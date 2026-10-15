/*
 * WardAniversarios — aniversários dos alunos.
 *
 * A data de nascimento vive em `users.birth_date` (DATE). Daqui saem três
 * coisas: quem faz aniversário hoje, o calendário que os mentores veem, e a
 * janela de parabéns que o aluno vê quando entra na plataforma.
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
        return n || p.email || 'Aluno';
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
            return '<p class="text-muted">Nenhum aluno preencheu a data de nascimento ainda. '
                 + 'Eles veem o pedido no dashboard assim que entram.</p>';
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
                            + escapar(nomeDe(p, fmt))
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
                            + '<span>' + escapar(nomeDe(x.pessoa, fmt)) + '</span>'
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
                                       + escapar(nomeDe(p, fmt)) + (hojeEh ? ' 🎉' : '') + '</div>';
                              }).join('')
                            : '<div style="font-size: 0.8rem; color: #d1d5db;">—</div>')
                        + '</div>';
               }).join('')
             + '</div>';

        var sem = (pessoas || []).filter(function (p) { return p && !p.birth_date; }).length;
        if (sem) {
            html += '<p class="text-muted" style="margin: 1rem 0 0; font-size: 0.8rem;">'
                 + (sem === 1
                     ? '1 aluno ainda não preencheu a data. O pedido aparece no dashboard dele.'
                     : sem + ' alunos ainda não preencheram a data. O pedido aparece no dashboard deles.')
                 + '</p>';
        }
        return html;
    }

    window.WardAniversarios = {
        cartaoHTML: cartaoHTML,
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
