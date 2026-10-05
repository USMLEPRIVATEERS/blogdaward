/*
 * WardMentoria — por quanto tempo cada aluno tem acesso a mentoria.
 *
 * REGRA
 *   - Quem foi cadastrado na plataforma ANTES de 01/06/2026 tem acesso
 *     permanente: nao vence e nao precisa renovar.
 *   - De 01/06/2026 em diante, cada pagamento compra 18 meses. O relogio
 *     comeca a contar no dia do cadastro; quando o aluno paga de novo, o
 *     mentor marca a renovacao e soma mais 18 meses ao fim atual.
 *
 * ONDE FICAM OS DADOS (colunas de `users`, criadas por sql/81_mentoria_acesso.sql)
 *   mentoria_inicio      DATE     — inicio da mentoria (por padrao, o cadastro)
 *   mentoria_fim         DATE     — ultimo dia de acesso; NULL quando e permanente
 *   mentoria_vitalicia   BOOLEAN  — acesso permanente
 *   mentoria_renovacoes  JSONB    — historico [{ data, meses, ate, por }]
 *
 *   Enquanto o SQL nao for rodado as colunas simplesmente nao existem na
 *   resposta, e tudo aqui cai no calculo a partir de `created_at` — a tela
 *   mostra a mesma coisa. Depois do SQL, o banco e quem manda.
 *
 * SO PARA ALUNO DE MENTORIA
 *   Assessoria avulsa e outro produto, com acesso limitado proprio. Esta
 *   contagem nao se aplica a ela, e `situacao()` devolve estado 'na-aplica'.
 */
(function () {
    'use strict';

    // Cadastro anterior a esta data = acesso permanente.
    var CORTE_VITALICIO = '2026-06-01';
    // Cada pagamento compra este tanto de meses.
    var MESES_POR_PAGAMENTO = 18;
    // A partir de quantos dias para o fim a tela passa a avisar.
    var DIAS_DE_AVISO = 60;
    // Fuso em que a Ward cadastra e conta os dias. Nao e detalhe: created_at
    // chega em UTC, e as 22h de 31/05 em Brasilia ja sao 01/06 la — quem se
    // cadastrou na vespera do corte perderia o acesso permanente. Os mentores
    // tambem nao estao todos no mesmo fuso, e o prazo tem de ser o mesmo para
    // todos eles.
    var FUSO_WARD = 'America/Sao_Paulo';

    // ---------------------------------------------------------------- datas

    // Aceita 'YYYY-MM-DD', ISO completo ou Date. Devolve sempre meia-noite
    // LOCAL: a conta e em dias de calendario, e new Date('2026-06-01') seria
    // meia-noite UTC — no Brasil, 21h do dia 31/05.
    function paraData(valor) {
        if (!valor) return null;
        if (valor instanceof Date) {
            if (isNaN(valor.getTime())) return null;
            return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
        }
        var texto = String(valor);
        var m = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        var d = new Date(texto);
        if (isNaN(d.getTime())) return null;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    var _formatadorWard = null;
    function _diaNoFuso(instante) {
        try {
            if (!_formatadorWard) {
                _formatadorWard = new Intl.DateTimeFormat('en-CA', {
                    timeZone: FUSO_WARD, year: 'numeric', month: '2-digit', day: '2-digit'
                });
            }
            // en-CA formata como 'YYYY-MM-DD'.
            return paraData(_formatadorWard.format(instante));
        } catch (e) {
            return paraData(instante);
        }
    }

    function hoje() {
        return _diaNoFuso(new Date());
    }

    // Para timestamp (created_at). Uma coluna DATE vem sem hora e e literal:
    // '2026-05-31' e 31 de maio em qualquer lugar do mundo.
    function dataDoCadastro(valor) {
        if (!valor) return null;
        var texto = String(valor);
        if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return paraData(texto);
        var d = valor instanceof Date ? valor : new Date(texto);
        if (isNaN(d.getTime())) return paraData(valor);
        return _diaNoFuso(d);
    }

    function paraISO(data) {
        if (!data) return null;
        var mes = String(data.getMonth() + 1).padStart(2, '0');
        var dia = String(data.getDate()).padStart(2, '0');
        return data.getFullYear() + '-' + mes + '-' + dia;
    }

    function formataData(valor) {
        var d = paraData(valor);
        if (!d) return '—';
        return String(d.getDate()).padStart(2, '0') + '/' +
            String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }

    // Soma meses mantendo o dia do mes. Quando o dia nao existe no mes de
    // destino (31 de agosto + 18 meses -> 29 de fevereiro), cai no ultimo dia
    // daquele mes em vez de vazar para o mes seguinte.
    function somaMeses(data, meses) {
        if (!data) return null;
        var dia = data.getDate();
        var destino = new Date(data.getFullYear(), data.getMonth() + meses, 1);
        var ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
        destino.setDate(Math.min(dia, ultimoDia));
        return destino;
    }

    function diasEntre(de, ate) {
        if (!de || !ate) return null;
        return Math.round((ate.getTime() - de.getTime()) / 86400000);
    }

    // Meses inteiros entre duas datas, com os dias que sobram.
    function periodoEntre(de, ate) {
        if (!de || !ate) return null;
        var meses = (ate.getFullYear() - de.getFullYear()) * 12 + (ate.getMonth() - de.getMonth());
        if (somaMeses(de, meses) > ate) meses--;
        var marco = somaMeses(de, meses);
        return { meses: meses, dias: diasEntre(marco, ate), total: diasEntre(de, ate) };
    }

    // "1 ano e 3 meses", "5 meses", "12 dias", "hoje".
    function formataPeriodo(de, ate) {
        var p = periodoEntre(de, ate);
        if (!p) return '—';
        if (p.total <= 0) return 'hoje';
        if (p.meses <= 0) return p.dias === 1 ? '1 dia' : p.dias + ' dias';
        var anos = Math.floor(p.meses / 12);
        var meses = p.meses % 12;
        var partes = [];
        if (anos > 0) partes.push(anos === 1 ? '1 ano' : anos + ' anos');
        if (meses > 0) partes.push(meses === 1 ? '1 mês' : meses + ' meses');
        return partes.join(' e ');
    }

    // ------------------------------------------------------------- situacao

    function ehAluno(usuario) {
        return !!usuario && usuario.role === 'aluno';
    }

    function renovacoesDe(usuario) {
        var r = usuario && usuario.mentoria_renovacoes;
        if (Array.isArray(r)) return r;
        if (typeof r === 'string') {
            try { var p = JSON.parse(r); return Array.isArray(p) ? p : []; } catch (e) { return []; }
        }
        return [];
    }

    /**
     * Tudo que as telas precisam saber sobre o acesso de um aluno.
     *
     * estado:
     *   'nao-aplica' — nao e aluno de mentoria (assessoria, mentor)
     *   'vitalicia'  — acesso permanente (cadastro antes do corte)
     *   'ativa'      — dentro do prazo, com folga
     *   'vencendo'   — dentro do prazo, mas faltam DIAS_DE_AVISO dias ou menos
     *   'vencida'    — o prazo acabou
     *   'sem-data'   — nao da para calcular (sem inicio e sem cadastro)
     */
    function situacao(usuario, referencia) {
        var agora = referencia ? paraData(referencia) : hoje();
        var base = {
            estado: 'nao-aplica', vitalicia: false, inicio: null, fim: null,
            diasRestantes: null, tempoNaMentoria: '—', tempoRestante: '—',
            renovacoes: [], rotulo: '—', detalhe: ''
        };
        if (!ehAluno(usuario)) return base;

        var inicio = paraData(usuario.mentoria_inicio) || dataDoCadastro(usuario.created_at);
        if (!inicio) {
            base.estado = 'sem-data';
            base.rotulo = 'sem data de início';
            return base;
        }

        // A coluna manda. Sem ela (SQL ainda nao rodado), vale a data do corte.
        var vitalicia = usuario.mentoria_vitalicia === true ||
            usuario.mentoria_vitalicia === 'true' ||
            ((usuario.mentoria_vitalicia === undefined || usuario.mentoria_vitalicia === null) &&
                inicio < paraData(CORTE_VITALICIO));

        var fim = vitalicia ? null
            : (paraData(usuario.mentoria_fim) || somaMeses(inicio, MESES_POR_PAGAMENTO));

        var tempoNaMentoria = formataPeriodo(inicio, agora);
        var sit = {
            estado: 'vitalicia',
            vitalicia: vitalicia,
            inicio: inicio,
            fim: fim,
            diasRestantes: null,
            tempoNaMentoria: tempoNaMentoria,
            tempoRestante: 'acesso permanente',
            renovacoes: renovacoesDe(usuario),
            rotulo: 'acesso permanente',
            detalhe: 'na mentoria há ' + tempoNaMentoria
        };

        if (vitalicia) return sit;

        var restantes = diasEntre(agora, fim);
        sit.diasRestantes = restantes;
        if (restantes < 0) {
            sit.estado = 'vencida';
            sit.tempoRestante = 'venceu há ' + formataPeriodo(fim, agora);
            sit.rotulo = sit.tempoRestante;
        } else {
            sit.estado = restantes <= DIAS_DE_AVISO ? 'vencendo' : 'ativa';
            sit.tempoRestante = restantes === 0 ? 'vence hoje' : 'restam ' + formataPeriodo(agora, fim);
            sit.rotulo = sit.tempoRestante;
        }
        sit.detalhe = 'na mentoria há ' + tempoNaMentoria + ' · até ' + formataData(fim);
        return sit;
    }

    // Nova data de fim depois de mais um pagamento. Quem ainda esta dentro do
    // prazo soma em cima do fim atual (ninguem perde o que ja pagou); quem ja
    // venceu recomeca de hoje.
    function fimAposRenovar(sit, referencia) {
        var agora = referencia ? paraData(referencia) : hoje();
        if (!sit || sit.vitalicia) return null;
        var partida = (sit.fim && sit.fim > agora) ? sit.fim : agora;
        return somaMeses(partida, MESES_POR_PAGAMENTO);
    }

    // O que gravar em `users` ao marcar a renovacao. `por` e o nome de quem
    // marcou, so para o historico.
    function dadosDaRenovacao(usuario, por, referencia) {
        var sit = situacao(usuario, referencia);
        if (sit.estado === 'nao-aplica' || sit.vitalicia) return null;
        var novoFim = fimAposRenovar(sit, referencia);
        var registro = {
            data: paraISO(referencia ? paraData(referencia) : hoje()),
            meses: MESES_POR_PAGAMENTO,
            ate: paraISO(novoFim),
            por: por || null
        };
        return {
            novoFim: novoFim,
            registro: registro,
            campos: {
                mentoria_inicio: paraISO(sit.inicio),
                mentoria_vitalicia: false,
                mentoria_fim: paraISO(novoFim),
                mentoria_renovacoes: sit.renovacoes.concat([registro])
            }
        };
    }

    // Classe do badge, nas mesmas cores que os dashboards ja usam.
    function classeDoEstado(estado) {
        if (estado === 'vencida') return 'is-vencida';
        if (estado === 'vencendo') return 'is-vencendo';
        if (estado === 'vitalicia') return 'is-vitalicia';
        if (estado === 'ativa') return 'is-ativa';
        return 'is-neutro';
    }

    window.WardMentoria = {
        CORTE_VITALICIO: CORTE_VITALICIO,
        MESES_POR_PAGAMENTO: MESES_POR_PAGAMENTO,
        DIAS_DE_AVISO: DIAS_DE_AVISO,
        paraData: paraData,
        dataDoCadastro: dataDoCadastro,
        hoje: hoje,
        paraISO: paraISO,
        formataData: formataData,
        somaMeses: somaMeses,
        diasEntre: diasEntre,
        periodoEntre: periodoEntre,
        formataPeriodo: formataPeriodo,
        situacao: situacao,
        fimAposRenovar: fimAposRenovar,
        dadosDaRenovacao: dadosDaRenovacao,
        classeDoEstado: classeDoEstado
    };
})();
