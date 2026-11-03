/*
 * Monitor de alunos -> WhatsApp: cartoes iguais aos da "Atividade Global".
 *
 * Recebe as linhas das tres consultas de consultas.sql e devolve, para cada
 * uma, o evento pronto (textos iguais aos do painel do Marcos), a legenda
 * curta para o WhatsApp e a imagem PNG do cartao.
 *
 * Requer: Node 18+ e `npm install playwright` (+ `npx playwright install chromium`).
 *
 *   const c = require('./cartao');
 *   const ev = c.eventoDeChamada(linha);          // ou eventoDeCheckin / eventoDeSessao
 *   await c.gerarImagem(ev, 'saida.png');
 *   // ev.legenda -> texto curto para mandar junto com a imagem
 *   // ev.chave   -> guarde depois de enviar, para nao avisar duas vezes
 *
 * Nomes: users.full_name pode vir cifrado. decifrarNome() usa a chave da
 * variavel de ambiente WARD_NOME_CHAVE (ver README.md, "Nomes cifrados").
 */
'use strict';

const crypto = require('crypto');

const FUSO = 'America/Sao_Paulo';

// ------------------------------------------------------------------ nomes

// Porta de _parseStr (js/src/app.js): base64 -> UTF-8 -> XOR com a chave.
// Texto que nao parece cifrado (tem @ ou ponto, CPF, curto) volta como esta.
function decifrarNome(valor, chave = process.env.WARD_NOME_CHAVE) {
    if (typeof valor !== 'string' || !chave) return valor;
    if (valor.length < 8 || !/^[A-Za-z0-9+/]+=*$/.test(valor)) return valor;
    if (valor.includes('@') || valor.includes('.') || /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(valor)) return valor;
    try {
        const d = Buffer.from(valor, 'base64').toString('utf8');
        let r = '';
        for (let i = 0; i < d.length; i++) {
            r += String.fromCharCode(d.charCodeAt(i) ^ chave.charCodeAt(i % chave.length));
        }
        return /^[\x20-\x7E\xA0-\xFF]+$/.test(r) ? r : valor;
    } catch (e) {
        return valor;
    }
}

// ------------------------------------------------------------------ datas

// DATE do Postgres pode chegar como '2026-11-05' ou como Date (node-pg).
function dataCurta(v) {
    if (!v) return '';
    if (v instanceof Date) {
        return [v.getDate(), v.getMonth() + 1].map(n => String(n).padStart(2, '0')).join('/') + '/' + v.getFullYear();
    }
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v);
}

// timestamptz -> "03/11/2026 10:42" no horario de Brasilia.
function dataHora(v) {
    if (!v) return '';
    const p = new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).formatToParts(new Date(v)).reduce((o, x) => (o[x.type] = x.value, o), {});
    return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
}

const hora = t => String(t || '').slice(0, 5);
const pct = (certas, total) => Math.round((Number(certas) || 0) * 100 / Number(total));
const resumo = s => crypto.createHash('md5').update(s).digest('hex').slice(0, 10);

// ---------------------------------------------------------------- eventos
// Cores, icones e frases sao as mesmas do feed (mentor-dashboard-marcos.html).

function eventoDeChamada(l) {
    const aluno = decifrarNome(l.aluno_nome) || 'Aluno';
    const mentor = decifrarNome(l.mentor_nome) || 'Mentor';
    const quando = `${dataCurta(l.scheduled_date)} às ${hora(l.scheduled_time)}`;
    return {
        tipo: 'chamada',
        chave: `chamada:${l.id}`,
        cor: '#0ea5e9',
        icone: '📞',
        nome: aluno,
        acao: 'agendou call',
        titulo: l.chamada || 'Call com mentor',
        detalhe: `${mentor} - ${quando}`,
        data: dataHora(l.created_at),
        legenda: `📞 ${aluno} marcou chamada com ${mentor}: ${quando}`
    };
}

const STATUS_CHECKIN = {
    tranquilo: '🟢 Tranquilo',
    preciso_ajuda: '🟡 Precisa de Ajuda',
    parado: '🔴 Parado',
    custom: '✍️ Mensagem personalizada'
};

function eventoDeCheckin(l) {
    const aluno = decifrarNome(l.aluno_nome) || 'Aluno';
    const q = Number(l.uworld_questions_done) || 0;
    const anki = Number(l.anki_cards_today) || 0;
    const streak = Number(l.anki_current_streak) || 0;
    const progresso = [];
    if (q > 0) progresso.push(`📊 UWorld: ${q} questões (${pct(l.uworld_correct_answers, q)}% acertos)`);
    if (anki > 0) {
        progresso.push(`🎴 Anki: ${anki} cards hoje`);
        if (streak > 0) progresso.push(`🔥 Streak: ${streak} dias`);
    }
    const icone = l.status === 'parado' ? '🔴' : l.status === 'preciso_ajuda' ? '🟡' : l.status === 'custom' ? '✍️' : '🟢';
    const motivos = [];
    if (l.status === 'preciso_ajuda') motivos.push('precisa de ajuda');
    if (l.status === 'parado') motivos.push('parado');
    if (String(l.message || '').trim()) motivos.push('com mensagem');
    if (q > 0 && pct(l.uworld_correct_answers, q) <= 40) motivos.push(`UWorld ${pct(l.uworld_correct_answers, q)}%`);
    return {
        tipo: 'checkin',
        // O aluno pode refazer o check-in do dia (mesmo id): se o conteudo
        // mudar, a chave muda e o aviso sai de novo.
        chave: `checkin:${l.id}:${resumo([l.status, l.message, q, l.uworld_correct_answers].join('|'))}`,
        cor: l.status === 'parado' ? '#ef4444' : l.status === 'preciso_ajuda' ? '#f59e0b' : '#10b981',
        icone,
        nome: aluno,
        acao: 'fez check-in',
        titulo: STATUS_CHECKIN[l.status] || 'Check-in',
        detalhe: l.message || '',
        progresso: progresso.join(' • '),
        data: dataCurta(l.date),
        legenda: `${icone} Check-in de ${aluno}: ${motivos.join(' · ')}`
    };
}

function eventoDeSessao(l) {
    const aluno = decifrarNome(l.aluno_nome) || 'Aluno';
    const total = Number(l.total_questions) || 0;
    const p = pct(l.correct_answers, total);
    const partes = [];
    if (l.system) partes.push(`System: ${l.system}`);
    if (l.category) partes.push(`Category: ${l.category}`);
    if (l.subject) partes.push(`Subject: ${l.subject}`);
    return {
        tipo: 'sessao',
        chave: `sessao:${l.id}`,
        cor: '#6366f1',
        icone: '📊',
        nome: aluno,
        acao: 'registrou sessao UWorld',
        titulo: `${total} questoes - ${p}% acertos`,
        detalhe: partes.join(' | '),
        texto: l.notes || '',
        data: dataHora(l.created_at),
        legenda: `📊 ${aluno}: ${total} questões com ${p}% de acertos${l.system ? ` (${l.system})` : ''}`
    };
}

// ---------------------------------------------------------------- imagem

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Mesmo HTML e mesmos valores de CSS do .feed-item do painel.
function htmlDoCartao(ev) {
    const detalhe = ev.detalhe || ev.progresso
        ? `<div class="feed-detail">${esc(ev.detalhe)}${ev.progresso
            ? `${ev.detalhe ? '<br>' : ''}<small style="color: #2563eb;">${esc(ev.progresso)}</small>` : ''}</div>`
        : '';
    return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; background: #ffffff; color: #111827; line-height: 1.6; -webkit-font-smoothing: antialiased;
         font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .feed-item { display: flex; gap: 0.75rem; padding: 0.75rem; width: 504px; box-sizing: border-box;
               border-left: 3px solid ${ev.cor}; background: #f9fafb; border-radius: 0 10px 10px 0; }
  .feed-icon { font-size: 1.25rem; flex-shrink: 0; }
  .feed-content { flex: 1; min-width: 0; }
  .feed-header { font-size: 0.875rem; color: #374151; margin-bottom: 0.25rem; }
  .feed-title { font-weight: 500; color: #111827; word-wrap: break-word; }
  .feed-full-content { background: #ffffff; border: 1px solid #e5e7eb; padding: 0.75rem; border-radius: 8px;
                       margin-top: 0.5rem; white-space: pre-wrap; word-wrap: break-word; font-size: 0.85rem;
                       line-height: 1.55; color: #374151; }
  .feed-detail { font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem; }
  .feed-date { font-size: 0.7rem; color: #9ca3af; margin-top: 0.25rem; }
</style></head><body>
<div class="feed-item">
  <div class="feed-icon">${esc(ev.icone)}</div>
  <div class="feed-content">
    <div class="feed-header"><strong>${esc(ev.nome)}</strong> ${esc(ev.acao)}</div>
    ${ev.titulo ? `<div class="feed-title">${esc(ev.titulo)}</div>` : ''}
    ${ev.texto ? `<div class="feed-full-content">${esc(ev.texto)}</div>` : ''}
    ${detalhe}
    <div class="feed-date">${esc(ev.data)}</div>
  </div>
</div></body></html>`;
}

// Gera o PNG (escala 2, como o "copiar imagem" do painel). Passe `navegador`
// para reaproveitar um Chromium aberto quando houver varios cartoes.
async function gerarImagem(ev, caminho, navegador) {
    const { chromium } = require('playwright');
    const browser = navegador || await chromium.launch();
    try {
        const page = await browser.newPage({ deviceScaleFactor: 2 });
        // Sem internet para a fonte, cai na fonte do sistema e segue.
        await page.setContent(htmlDoCartao(ev), { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.locator('.feed-item').screenshot({ path: caminho });
        await page.close();
    } finally {
        if (!navegador) await browser.close();
    }
    return caminho;
}

module.exports = {
    decifrarNome, eventoDeChamada, eventoDeCheckin, eventoDeSessao,
    htmlDoCartao, gerarImagem, dataHora, dataCurta
};

// Teste rapido: node cartao.js  -> gera exemplo-*.png nesta pasta
if (require.main === module) {
    (async () => {
        const agora = new Date().toISOString();
        const exemplos = [
            eventoDeChamada({ id: 1, aluno_nome: 'Rodrigo de Campos Lopes', mentor_nome: 'Guilherme', scheduled_date: '2026-11-05',
                scheduled_time: '14:00:00', chamada: 'Guilherme: avaliando o seu resultado no self assessment do Step 1 — NBME 28', created_at: agora }),
            eventoDeCheckin({ id: 2, aluno_nome: 'Ana Beatriz', status: 'preciso_ajuda', date: '2026-11-03',
                message: 'Travei em Renal e estou atrasada duas semanas.', uworld_questions_done: 40, uworld_correct_answers: 15, anki_cards_today: 210 }),
            eventoDeSessao({ id: 3, aluno_nome: 'José da Conceição', total_questions: 40, correct_answers: 14, system: 'Renal',
                category: 'Physiology', notes: 'Errei quase tudo de ácido-base.', created_at: agora })
        ];
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        for (const ev of exemplos) {
            await gerarImagem(ev, `exemplo-${ev.tipo}.png`, browser);
            console.log(ev.chave, '|', ev.legenda);
        }
        await browser.close();
    })();
}
