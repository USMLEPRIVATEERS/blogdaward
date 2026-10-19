/*
 * WardAniversarios — aniversários dos alunos e dos mentores.
 *
 * A data de nascimento vive em `users.birth_date` (DATE). Daqui saem três
 * coisas: quem faz aniversário hoje, o calendário que os mentores veem, e a
 * janela de parabéns que a pessoa vê quando entra na plataforma.
 *
 * O dashboard do aluno tem a própria janela de pedido; os dashboards dos
 * mentores usam pedirNascimento(), que monta a janela sozinha.
 *
 * Fuso: a data de nascimento é uma data de calendário, sem hora. Ela é lida
 * literalmente ('1990-03-15' é 15 de março em qualquer lugar do mundo), e
 * "hoje" é o dia em São Paulo — senão um mentor na Europa veria o aniversário
 * um dia antes do aluno.
 */
(function () {
    'use strict';

    var FUSO_WARD = 'America/Sao_Paulo';
    // Quantos dias antes e depois ainda contam como "aniversário" para a
    // janela de parabéns. Quem entra no fim de semana não fica sem.
    var JANELA_DIAS = 1;

    var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    var _fmt = null;
    function hoje() {
        try {
            if (!_fmt) {
                _fmt = new Intl.DateTimeFormat('en-CA', {
                    timeZone: FUSO_WARD, year: 'numeric', month: '2-digit', day: '2-digit'
                });
            }
            return paraData(_fmt.format(new Date()));
        } catch (e) {
            var d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
    }

    function paraData(valor) {
        if (!valor) return null;
        if (valor instanceof Date) {
            if (isNaN(valor.getTime())) return null;
            return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
        }
        var m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        var d = new Date(String(valor));
        if (isNaN(d.getTime())) return null;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    function formataDia(valor) {
        var d = paraData(valor);
        if (!d) return '—';
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function idadeEm(nascimento, quando) {
        var n = paraData(nascimento);
        var q = quando ? paraData(quando) : hoje();
        if (!n || !q) return null;
        var idade = q.getFullYear() - n.getFullYear();
        var passou = (q.getMonth() > n.getMonth()) ||
            (q.getMonth() === n.getMonth() && q.getDate() >= n.getDate());
        if (!passou) idade--;
        return idade;
    }

    // 29 de fevereiro em ano comum cai em 28/02: quem nasceu no dia extra
    // comemora, e não some do calendário por três anos.
    function aniversarioNoAno(nascimento, ano) {
        var n = paraData(nascimento);
        if (!n) return null;
        var mes = n.getMonth();
        var dia = n.getDate();
        var ultimo = new Date(ano, mes + 1, 0).getDate();
        return new Date(ano, mes, Math.min(dia, ultimo));
    }

    function diasEntre(de, ate) {
        if (!de || !ate) return null;
        return Math.round((ate.getTime() - de.getTime()) / 86400000);
    }

    // Quantos dias faltam para o próximo aniversário. 0 = é hoje.
    function diasParaOAniversario(nascimento, referencia) {
        var q = referencia ? paraData(referencia) : hoje();
        var n = paraData(nascimento);
        if (!n || !q) return null;
        var esteAno = aniversarioNoAno(n, q.getFullYear());
        if (diasEntre(q, esteAno) >= 0) return diasEntre(q, esteAno);
        return diasEntre(q, aniversarioNoAno(n, q.getFullYear() + 1));
    }

    // Dentro da janela de parabéns? Devolve -1 (ontem), 0 (hoje) ou 1 (amanhã),
    // e null fora dela.
    function posicaoNaJanela(nascimento, referencia) {
        var q = referencia ? paraData(referencia) : hoje();
        var n = paraData(nascimento);
        if (!n || !q) return null;
        for (var delta = -JANELA_DIAS; delta <= JANELA_DIAS; delta++) {
            var dia = new Date(q.getFullYear(), q.getMonth(), q.getDate() + delta);
            var aniv = aniversarioNoAno(n, dia.getFullYear());
            if (aniv && aniv.getTime() === dia.getTime()) return delta;
        }
        return null;
    }

    function ehHoje(nascimento, referencia) {
        return diasParaOAniversario(nascimento, referencia) === 0;
    }

    // ------------------------------------------------------------ listas

    function comData(pessoas) {
        return (pessoas || []).filter(function (p) { return p && p.birth_date; });
    }

    function aniversariantesDoDia(pessoas, referencia) {
        return comData(pessoas).filter(function (p) {
            return ehHoje(p.birth_date, referencia);
        });
    }

    // Ordenado por quem vem primeiro, começando em hoje.
    function proximos(pessoas, quantos, referencia) {
        var lista = comData(pessoas).map(function (p) {
            return { pessoa: p, dias: diasParaOAniversario(p.birth_date, referencia) };
        }).sort(function (a, b) { return a.dias - b.dias; });
        return quantos ? lista.slice(0, quantos) : lista;
    }

    // Doze meses, cada um com os aniversariantes ordenados por dia. Serve o
    // calendário dos mentores.
    function porMes(pessoas) {
        var meses = MESES.map(function (nome, i) {
            return { indice: i, nome: nome, pessoas: [] };
        });
        comData(pessoas).forEach(function (p) {
            var d = paraData(p.birth_date);
            if (d) meses[d.getMonth()].pessoas.push(p);
        });
        meses.forEach(function (m) {
            m.pessoas.sort(function (a, b) {
                return paraData(a.birth_date).getDate() - paraData(b.birth_date).getDate();
            });
        });
        return meses;
    }

    // ------------------------------------------------- mensagens do aluno

    // Variam por ano para não repetir a mesma frase todo aniversário.
    var MENSAGENS = [
        { titulo: 'Parabéns!', texto: 'Mais um ano — e mais um ano perto da vaga que você está construindo. A Ward inteira te deseja um dia muito bom.' },
        { titulo: 'Feliz aniversário!', texto: 'Hoje é dia de fechar o UWorld mais cedo. O cronograma espera; o seu aniversário, não.' },
        { titulo: 'Parabéns!', texto: 'Quem escolhe esse caminho escolhe uma maratona. Hoje é dia de olhar para trás e ver o quanto você já andou.' },
        { titulo: 'Feliz aniversário!', texto: 'Que este ano seja o do e-mail que você está esperando. Aproveite o dia — merecidamente.' },
        { titulo: 'Parabéns!', texto: 'Um brinde a você, que estuda depois do plantão. Hoje o dia é seu.' }
    ];

    function mensagemDoAno(ano) {
        return MENSAGENS[Math.abs(Number(ano) || 0) % MENSAGENS.length];
    }

    // A janela aparece UMA vez por aniversário. A chave leva o ano, então no
    // ano seguinte ela volta.
    function chaveDaJanela(userId, referencia) {
        var q = referencia ? paraData(referencia) : hoje();
        return 'aniv_visto_' + userId + '_' + q.getFullYear();
    }

    function jaViu(userId, referencia) {
        try { return !!localStorage.getItem(chaveDaJanela(userId, referencia)); }
        catch (e) { return false; }
    }

    function marcarVisto(userId, referencia) {
        try { localStorage.setItem(chaveDaJanela(userId, referencia), '1'); }
        catch (e) { /* navegador sem storage: no máximo aparece de novo */ }
    }

    // ------------------------------------------------- o cartao do mentor

    function escapar(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function nomeDe(p, formatar) {
        var n = formatar ? formatar(p.full_name) : p.full_name;
        return n || p.email || (p.ehMentor ? 'Mentor' : 'Aluno');
    }

    // Nome ja escapado, com a etiqueta "mentor" quando for o caso.
    function rotuloDe(p, formatar) {
        return escapar(nomeDe(p, formatar))
            + (p.ehMentor ? ' <span style="font-size: 0.68rem; font-weight: 700; color: #C45700; '
                + 'background: #fff4ec; border-radius: 999px; padding: 0.05rem 0.4rem; margin-left: 0.2rem;">mentor</span>' : '');
    }

    /**
     * HTML do calendario de aniversarios para o dashboard de um mentor.
     * `opcoes.nome` e a funcao que decodifica o nome (_dn em cada pagina).
     */
    function cartaoHTML(pessoas, opcoes) {
        var op = opcoes || {};
        var fmt = op.nome;
        var comDataLista = comData(pessoas);
        if (!comDataLista.length) {
            return '<p class="text-muted">Ninguém preencheu a data de nascimento ainda. '
                 + 'O pedido aparece no dashboard de cada um assim que entra.</p>';
        }

        var hojeD = hoje();
        var doDia = aniversariantesDoDia(comDataLista);
        var html = '';

        if (doDia.length) {
            html += '<div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 10px; '
                 + 'padding: 0.9rem 1rem; margin-bottom: 1.25rem;">'
                 + '<div style="font-weight: 700; color: #92400e; margin-bottom: 0.35rem;">🎉 Hoje é aniversário de</div>'
                 + doDia.map(function (p) {
                       var idade = idadeEm(p.birth_date);
                       return '<div style="font-size: 0.92rem; color: #78350f;">'
                            + rotuloDe(p, fmt)
                            + (idade != null ? ' <span style="opacity: 0.75;">— ' + idade + ' anos</span>' : '')
                            + '</div>';
                   }).join('')
                 + '</div>';
        }

        var proximosSete = proximos(comDataLista).filter(function (x) {
            return x.dias > 0 && x.dias <= 30;
        }).slice(0, 5);
        if (proximosSete.length) {
            html += '<div style="margin-bottom: 1.25rem;">'
                 + '<div style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; '
                 + 'color: #6b7280; font-weight: 700; margin-bottom: 0.4rem;">Nos próximos 30 dias</div>'
                 + proximosSete.map(function (x) {
                       return '<div style="display: flex; justify-content: space-between; gap: 1rem; '
                            + 'padding: 0.35rem 0; border-bottom: 1px solid #f3f4f6; font-size: 0.88rem;">'
                            + '<span>' + rotuloDe(x.pessoa, fmt) + '</span>'
                            + '<span style="color: #6b7280; white-space: nowrap;">'
                            + formataDia(x.pessoa.birth_date) + ' · em ' + x.dias + ' dia' + (x.dias === 1 ? '' : 's')
                            + '</span></div>';
                   }).join('')
                 + '</div>';
        }

        // O ano inteiro, comecando pelo mes corrente — e isso que faz dele um
        // calendario e nao uma lista.
        var meses = porMes(comDataLista);
        var ordem = [];
        for (var i = 0; i < 12; i++) ordem.push(meses[(hojeD.getMonth() + i) % 12]);

        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem;">'
             + ordem.map(function (m) {
                   var atual = m.indice === hojeD.getMonth();
                   return '<div style="border: 1px solid ' + (atual ? '#d97706' : '#e5e7eb') + '; border-radius: 10px; padding: 0.7rem 0.85rem;">'
                        + '<div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; '
                        + 'letter-spacing: 0.04em; color: ' + (atual ? '#92400e' : '#6b7280') + '; margin-bottom: 0.4rem;">'
                        + m.nome + '</div>'
                        + (m.pessoas.length
                            ? m.pessoas.map(function (p) {
                                  var hojeEh = ehHoje(p.birth_date);
                                  return '<div style="font-size: 0.84rem; padding: 0.15rem 0;'
                                       + (hojeEh ? ' font-weight: 700; color: #92400e;' : '') + '">'
                                       + '<span style="display: inline-block; min-width: 2.6rem; color: #9ca3af;">'
                                       + formataDia(p.birth_date) + '</span>'
                                       + rotuloDe(p, fmt) + (hojeEh ? ' 🎉' : '') + '</div>';
                              }).join('')
                            : '<div style="font-size: 0.8rem; color: #d1d5db;">—</div>')
                        + '</div>';
               }).join('')
             + '</div>';

        var semAlunos = (pessoas || []).filter(function (p) { return p && !p.birth_date && !p.ehMentor; }).length;
        var semMentores = (pessoas || []).filter(function (p) { return p && !p.birth_date && p.ehMentor; }).length;
        var faltam = [];
        if (semAlunos) faltam.push(semAlunos === 1 ? '1 aluno' : semAlunos + ' alunos');
        if (semMentores) faltam.push(semMentores === 1 ? '1 mentor' : semMentores + ' mentores');
        if (faltam.length) {
            html += '<p class="text-muted" style="margin: 1rem 0 0; font-size: 0.8rem;">'
                 + faltam.join(' e ') + ((semAlunos + semMentores) === 1 ? ' ainda não preencheu' : ' ainda não preencheram')
                 + ' a data. O pedido aparece no dashboard de cada um.</p>';
        }
        return html;
    }

    // Os mentores tambem entram no calendario. Consulta a parte: se a coluna
    // birth_date ainda nao existir, o calendario segue so com os alunos.
    var PAPEIS_MENTOR = ['mentor_marcos', 'mentor_iria', 'mentor_guilherme', 'mentor_fernando'];
    function carregarMentores() {
        try {
            if (!window.WardApp || !window.WardApp.db) return Promise.resolve([]);
            return Promise.resolve(window.WardApp.db.from('users')
                .select('id, full_name, email, role, birth_date')
                .in('role', PAPEIS_MENTOR))
                .then(function (r) {
                    if (!r || r.error) return [];
                    return (r.data || []).filter(function (m) {
                        return m && PAPEIS_MENTOR.indexOf(m.role) !== -1;   // so mentores, mesmo que o servidor devolva mais
                    }).map(function (m) {
                        var c = {}; for (var k in m) c[k] = m[k];
                        c.ehMentor = true; return c;
                    });
                })
                .catch(function () { return []; });
        } catch (e) { return Promise.resolve([]); }
    }

    // ------------------------------------------------------------------
    // Pedido da data (obrigatorio) e parabens, para quem nao e aluno: os
    // dashboards dos mentores chamam pedirNascimento(userData). A janela nao
    // fecha sem a data: sem botao de fechar e o clique fora nao chega ao
    // fechador generico de modais do app.js.
    // ------------------------------------------------------------------
    function el(html) {
        var d = document.createElement('div');
        d.innerHTML = html.trim();
        return d.firstChild;
    }

    function pedirNascimento(usuario, opcoes) {
        var op = opcoes || {};
        if (!usuario || !usuario.id || !window.WardApp || !window.WardApp.db) return Promise.resolve();
        return Promise.resolve(window.WardApp.db.from('users').select('birth_date').eq('id', usuario.id).maybeSingle())
            .then(function (r) {
                if (!r || r.error) return;               // coluna ainda nao existe: nao pede nada
                var nascimento = r.data && r.data.birth_date;
                if (!nascimento) { mostrarPedido(usuario, op); return; }
                try { sessionStorage.setItem('ward_nasc_ok', '1'); } catch (e) {}
                if (posicaoNaJanela(nascimento) !== null && !jaViu(usuario.id)) mostrarParabens(usuario, nascimento);
            })
            .catch(function () {});
    }

    function mostrarPedido(usuario, op) {
        if (document.getElementById('nascimento-modal')) return;
        var modal = el(
            '<div id="nascimento-modal" class="modal-overlay active">'
          + '  <div class="modal" style="max-width: 440px;">'
          + '    <div class="modal-header"><h3 class="modal-title">🎂 Falta a sua data de nascimento</h3></div>'
          + '    <div class="modal-body">'
          + '      <p style="margin: 0 0 1rem; line-height: 1.6; font-size: 0.92rem;">'
          + '        A Ward agora guarda o aniversário de alunos e mentores: o seu entra no calendário'
          + '        do time. A data é obrigatória — preencha para continuar.'
          + '      </p>'
          + '      <input type="date" id="nascimento-input" class="form-input" style="width: 100%;">'
          + '      <p id="nascimento-erro" style="display: none; color: #991b1b; font-size: 0.82rem; margin: 0.5rem 0 0;"></p>'
          + '    </div>'
          + '    <div class="modal-footer">'
          + '      <button class="btn btn-primary" id="nascimento-salvar">Salvar e continuar</button>'
          + '    </div>'
          + '  </div>'
          + '</div>');
        // O app.js fecha qualquer .modal-overlay clicado: este nao.
        modal.addEventListener('click', function (e) { e.stopPropagation(); });
        document.body.appendChild(modal);

        var input = modal.querySelector('#nascimento-input');
        var erro = modal.querySelector('#nascimento-erro');
        var btn = modal.querySelector('#nascimento-salvar');
        function mostraErro(t) { erro.textContent = t; erro.style.display = ''; }

        btn.addEventListener('click', function () {
            erro.style.display = 'none';
            var valor = input.value;
            if (!valor) return mostraErro('Escolha a data.');
            var d = paraData(valor), h = hoje();
            if (!d || d >= h) return mostraErro('A data precisa ser no passado.');
            if (h.getFullYear() - d.getFullYear() > 120) return mostraErro('Confira o ano.');
            btn.disabled = true; btn.textContent = 'Salvando...';
            Promise.resolve(window.WardApp.db.from('users').update({ birth_date: valor }).eq('id', usuario.id))
                .then(function (r) {
                    btn.disabled = false; btn.textContent = 'Salvar e continuar';
                    if (r && r.error) return mostraErro('Não consegui salvar: ' + (r.error.message || 'tente de novo.'));
                    modal.parentNode && modal.parentNode.removeChild(modal);
                    try { sessionStorage.setItem('ward_nasc_ok', '1'); } catch (e) {}
                    if (window.WardApp.showToast) window.WardApp.showToast('Obrigado! Data salva.');
                    if (typeof op.aoSalvar === 'function') { try { op.aoSalvar(valor); } catch (e) {} }
                    if (posicaoNaJanela(valor) !== null && !jaViu(usuario.id)) {
                        setTimeout(function () { mostrarParabens(usuario, valor); }, 400);
                    }
                })
                .catch(function () {
                    btn.disabled = false; btn.textContent = 'Salvar e continuar';
                    mostraErro('Não consegui salvar. Tente de novo.');
                });
        });
    }

    function mostrarParabens(usuario, nascimento) {
        if (document.getElementById('aniversario-modal')) return;
        var msg = mensagemDoAno(hoje().getFullYear());
        var idade = idadeEm(nascimento);
        var modal = el(
            '<div id="aniversario-modal" class="modal-overlay active">'
          + '  <div class="modal" style="max-width: 420px; overflow: hidden;">'
          + '    <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: white; padding: 2rem 1.5rem; text-align: center; position: relative;">'
          + '      <button class="modal-close" data-fechar style="position: absolute; top: 0.6rem; right: 0.8rem; color: white;">&times;</button>'
          + '      <div style="font-size: 3.5rem; line-height: 1;">🎉</div>'
          + '      <h3 id="aniversario-titulo" style="margin: 0.6rem 0 0; font-size: 1.4rem;">' + escapar(msg.titulo) + '</h3>'
          + '      <div id="aniversario-idade" style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.2rem;">'
          +          ((idade != null && idade > 0 && idade < 120) ? idade + ' anos' : '') + '</div>'
          + '    </div>'
          + '    <div class="modal-body" style="text-align: center;">'
          + '      <p id="aniversario-texto" style="margin: 0; line-height: 1.65; font-size: 0.95rem;">' + escapar(msg.texto) + '</p>'
          + '    </div>'
          + '    <div class="modal-footer" style="justify-content: center;">'
          + '      <button class="btn btn-primary" data-fechar>Obrigado!</button>'
          + '    </div>'
          + '  </div>'
          + '</div>');
        function fechar() { modal.parentNode && modal.parentNode.removeChild(modal); }
        modal.addEventListener('click', function (e) {
            if (e.target === modal || (e.target.hasAttribute && e.target.hasAttribute('data-fechar'))) fechar();
        });
        document.body.appendChild(modal);
        // Marca ao mostrar: fechar, clicar fora ou sair da pagina, nao volta.
        marcarVisto(usuario.id);
    }

    window.WardAniversarios = {
        cartaoHTML: cartaoHTML,
        carregarMentores: carregarMentores,
        pedirNascimento: pedirNascimento,
        PAPEIS_MENTOR: PAPEIS_MENTOR,
        FUSO_WARD: FUSO_WARD,
        JANELA_DIAS: JANELA_DIAS,
        MESES: MESES,
        hoje: hoje,
        paraData: paraData,
        formataDia: formataDia,
        idadeEm: idadeEm,
        aniversarioNoAno: aniversarioNoAno,
        diasParaOAniversario: diasParaOAniversario,
        posicaoNaJanela: posicaoNaJanela,
        ehHoje: ehHoje,
        aniversariantesDoDia: aniversariantesDoDia,
        proximos: proximos,
        porMes: porMes,
        mensagemDoAno: mensagemDoAno,
        jaViu: jaViu,
        marcarVisto: marcarVisto
    };
})();
