/*
 * WardRoteiro — roteiro de chamadas da Ward Academy (fonte unica).
 *
 * Antes cada pagina carregava a sua propria copia da lista (landmarks.html,
 * os dashboards do Marcos e da Iria, o questionario): quatro listas que sempre
 * acabavam divergindo. Aqui e o unico lugar onde o roteiro existe.
 *
 * Convencoes:
 *   - titulo no formato "Mentor: assunto", sem numero e sem duracao;
 *   - `tipo` e o identificador estavel no banco (landmark_type). O titulo pode
 *     ser reescrito a vontade; o tipo, nao;
 *   - `repetivel: true` marca as chamadas que nunca sao concluidas: a linha e um
 *     botao permanente, e cada agendamento gera uma OCORRENCIA com o tipo
 *     acrescido de SUFIXO_OCORRENCIA;
 *   - `pergunta` obriga o aluno a escrever algo antes de agendar (o system que
 *     concluiu, o assunto, o simulado). O texto vai para o titulo da ocorrencia
 *     e para as observacoes do agendamento, entao o mentor ve na hora.
 *
 * STEPS
 *   O aluno escolhe no dashboard em que prova esta focando (Step 1, Step 2 CK
 *   ou Step 3). Quem nao escolheu nada esta no Step 1.
 *
 *   Duas naturezas de chamada:
 *     - `porJornada: true` — acontece UMA vez na vida do aluno (como usar a
 *       plataforma, notarycam, visto, familia) ou e uma vaga permanente de
 *       seguimento. O tipo nao muda com o step.
 *     - o resto — acontece UMA VEZ POR PROVA. O tipo recebe o sufixo do step
 *       ('' no Step 1, '__s2' no Step 2 CK, '__s3' no Step 3) e o titulo troca
 *       o marcador {STEP} pelo nome da prova. Quando o aluno passa no Step 1 e
 *       muda para Step 2 CK no dashboard, essas chamadas reaparecem com o nome
 *       novo, livres para agendar, e as do Step 1 vao para "Chamadas anteriores"
 *       com o historico intacto.
 *
 *   Step 1 nao tem sufixo de proposito: os landmarks que ja existem no banco
 *   continuam valendo sem nenhuma renomeacao de tipo.
 */
(function () {
    'use strict';

    // Ocorrencias de chamadas repetiveis carregam este sufixo no landmark_type.
    // A auditoria de landmarks usa isso para NAO tratar duas ocorrencias da
    // mesma chamada como duplicata.
    var SUFIXO_OCORRENCIA = '__oc';

    var STEP_PADRAO = 'step1';

    var STEPS = [
        { chave: 'step1', rotulo: 'Step 1', sufixo: '' },
        { chave: 'step2ck', rotulo: 'Step 2 CK', sufixo: '__s2' },
        { chave: 'step3', rotulo: 'Step 3', sufixo: '__s3' }
    ];

    var porStep = {};
    STEPS.forEach(function (s) { porStep[s.chave] = s; });

    var GRUPOS = [
        { chave: 'imersao', titulo: 'Imersão no USMLE' },
        { chave: 'seguimento', titulo: 'Chamadas de seguimento' },
        { chave: 'prova', titulo: 'Planejamento de prova' }
    ];

    var CHAMADAS = [
        // ---------- Imersão no USMLE ----------
        // A maior parte e de jornada: acontece uma vez, seja qual for a prova.
        { grupo: 'imersao', tipo: 'call_marcos_plataforma', porJornada: true, titulo: 'Marcos Vilela: como usar a plataforma da Ward Academy' },
        { grupo: 'imersao', tipo: 'call_iria_uworld', titulo: 'Iria da Costa: como resolver as questões do UWorld do {STEP}' },
        { grupo: 'imersao', tipo: 'call_iria_caminhos', porJornada: true, titulo: 'Iria: o que é o USMLE e quais caminhos ele abre' },
        { grupo: 'imersao', tipo: 'call_guilherme_anki_setup', porJornada: true, titulo: 'Guilherme: configurando o Anki do zero' },
        { grupo: 'imersao', tipo: 'call_guilherme_anki_update', porJornada: true, titulo: 'Guilherme: revisando o seu Anki' },
        { grupo: 'imersao', tipo: 'call_marcos_myintealth_conta', porJornada: true, titulo: 'Marcos: criando a sua conta no Myintealth' },
        { grupo: 'imersao', tipo: 'call_marcos_notarycam', porJornada: true, titulo: 'Marcos: reconhecendo os documentos no NotaryCam' },
        // O Myintealth e da ECFMG: vale para Step 1 e Step 2 CK. O Step 3 e pelo FSMB.
        { grupo: 'imersao', tipo: 'call_marcos_myintealth_final', steps: ['step1', 'step2ck'], titulo: 'Marcos: finalizando a inscrição no Myintealth para o {STEP}' },
        { grupo: 'imersao', tipo: 'call_iria_materiais', titulo: 'Iria: quais materiais de estudo usar na preparação para o {STEP}' },
        { grupo: 'imersao', tipo: 'call_iria_visto', porJornada: true, titulo: 'Iria: como funciona o visto para os Estados Unidos' },
        { grupo: 'imersao', tipo: 'call_iria_familia', porJornada: true, titulo: 'Iria: conversando com a família sobre a decisão do USMLE' },
        { grupo: 'imersao', tipo: 'call_iria_financeiro', porJornada: true, titulo: 'Iria: planejando o lado financeiro da jornada' },

        // ---------- Chamadas de seguimento (sempre disponíveis) ----------
        // Vagas permanentes: nunca sao concluidas e acompanham o aluno em
        // qualquer prova, entao nao levam o nome do step.
        {
            grupo: 'seguimento', tipo: 'call_marcos_ajuste_cronograma', porJornada: true,
            titulo: 'Marcos: ajustando o seu cronograma de estudos', repetivel: true
        },
        {
            grupo: 'seguimento', tipo: 'call_iria_system', porJornada: true,
            titulo: 'Iria: avaliando a conclusão de um system', repetivel: true,
            pergunta: {
                rotulo: 'Qual system você concluiu?',
                dica: 'Ex: Cardiologia, Neurologia, Renal...'
            }
        },
        {
            grupo: 'seguimento', tipo: 'call_iria_orientacoes', porJornada: true,
            titulo: 'Iria: orientações gerais sobre a sua preparação', repetivel: true,
            pergunta: {
                rotulo: 'Sobre o que você quer conversar?',
                dica: 'Escreva em uma linha o que precisa tratar'
            }
        },
        // ---------- Planejamento de prova ----------
        // Este bloco inteiro se repete a cada prova, com o nome da prova no titulo.
        { grupo: 'prova', tipo: 'call_iria_second_pass', titulo: 'Iria: planejando a segunda passada no conteúdo do {STEP}' },
        { grupo: 'prova', tipo: 'call_iria_simulados', titulo: 'Iria: organizando os simulados do {STEP}' },
        { grupo: 'prova', tipo: 'call_marcos_fsmb', titulo: 'Marcos: fazendo a sua inscrição no FSMB para o {STEP}' },
        { grupo: 'prova', tipo: 'call_marcos_claude', titulo: 'Marcos: usando o Claude na preparação para o {STEP}' },
        { grupo: 'prova', tipo: 'call_iria_materiais_reta_final', titulo: 'Iria: escolhendo os materiais de estudo da reta final do {STEP}' },
        { grupo: 'prova', tipo: 'call_guilherme_anki_reta_final', titulo: 'Guilherme: ajustando o Anki para a reta final do {STEP}' },
        {
            grupo: 'prova', tipo: 'call_iria_self_assessment',
            titulo: 'Iria: avaliando o seu resultado no self assessment do {STEP}', repetivel: true,
            pergunta: {
                rotulo: 'Qual simulado você fez?',
                dica: 'Ex: UWSA1, NBME 28, NBME 29...'
            }
        },
        { grupo: 'prova', tipo: 'call_marcos_eligibility', titulo: 'Marcos: marcando o eligibility period do {STEP} no FSMB' },
        { grupo: 'prova', tipo: 'call_marcos_preditivos', titulo: 'Marcos: organizando os materiais preditivos do {STEP} que você já fez' },
        { grupo: 'prova', tipo: 'call_iria_predicao', titulo: 'Iria: avaliando a predição e definindo a data da prova do {STEP}' },
        { grupo: 'prova', tipo: 'call_marcos_prometric', titulo: 'Marcos: agendando a sua prova do {STEP} no Prometric' },
        { grupo: 'prova', tipo: 'call_iria_predicao_check', titulo: 'Iria: checando se a predição permite marcar a prova do {STEP}' },
        { grupo: 'prova', tipo: 'call_iria_pre_prova', titulo: 'Iria: conversa de preparação para o dia da prova do {STEP}' }
    ];

    // Sequencia de pesquisa com o Marcos. Fica fora do roteiro padrao: so
    // aparece para quem o Marcos liberar no dashboard dele. Nao depende da
    // prova — e a jornada de pesquisa do aluno.
    var PESQUISA = [
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_onboarding', titulo: 'Marcos: primeiros passos na pesquisa científica' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_ideia', titulo: 'Marcos: validando a ideia da sua pesquisa' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_databases', titulo: 'Marcos: usando as databases corretamente na busca' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_triagem_titulo', titulo: 'Marcos: fazendo a triagem por título e resumo' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_triagem_manuscrito', titulo: 'Marcos: fazendo a triagem por manuscrito completo' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_extracao', titulo: 'Marcos: extraindo os dados dos estudos' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_vies', titulo: 'Marcos: avaliando o risco de viés dos estudos' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_escrita', titulo: 'Marcos: escrevendo o manuscrito do seu artigo' },
        { grupo: 'pesquisa', porJornada: true, tipo: 'call_marcos_pesquisa_submissao', titulo: 'Marcos: submetendo o manuscrito para a revista' }
    ];

    // Chamada do Dr. Fernando: so para quem o Marcos marcar como aluno dele.
    // O tipo e o mesmo de antes para nao soltar os agendamentos ja existentes.
    var FERNANDO = [
        { grupo: 'fernando', porJornada: true, tipo: 'call_fernando_research', titulo: 'Fernando: mentoria em pesquisa científica' }
    ];

    var TODAS = CHAMADAS.concat(PESQUISA, FERNANDO);

    var porTipo = {};
    TODAS.forEach(function (c) { porTipo[c.tipo] = c; });

    // ------------------------------------------------------------------ steps

    // O dashboard grava 'step1' | 'step2ck' | 'step3' | 'oet' | 'other'.
    // Quem nao escolheu nada, ou escolheu algo que nao e um Step, segue no
    // roteiro do Step 1.
    function normalizaStep(valor) {
        var v = String(valor || '').toLowerCase().replace(/[\s_-]/g, '');
        if (v === 'step2' || v === 'step2ck' || v === '2' || v === 'ck') return 'step2ck';
        if (v === 'step3' || v === '3') return 'step3';
        return STEP_PADRAO;
    }

    function rotuloStep(step) {
        return (porStep[normalizaStep(step)] || porStep[STEP_PADRAO]).rotulo;
    }

    function sufixoStep(step) {
        return (porStep[normalizaStep(step)] || porStep[STEP_PADRAO]).sufixo;
    }

    function semOcorrencia(tipo) {
        if (!tipo) return '';
        return tipo.slice(-SUFIXO_OCORRENCIA.length) === SUFIXO_OCORRENCIA
            ? tipo.slice(0, -SUFIXO_OCORRENCIA.length)
            : tipo;
    }

    // Tipo sem sufixo de ocorrencia e sem sufixo de step: a chave do roteiro.
    function tipoBase(tipo) {
        var t = semOcorrencia(tipo);
        for (var i = 0; i < STEPS.length; i++) {
            var sfx = STEPS[i].sufixo;
            if (sfx && t.slice(-sfx.length) === sfx) return t.slice(0, -sfx.length);
        }
        return t;
    }

    // De que prova e este landmark. Chamadas de jornada nao pertencem a
    // nenhuma prova — devolvem null.
    function stepDoTipo(tipo) {
        var def = definicao(tipo);
        if (def && def.porJornada) return null;
        var t = semOcorrencia(tipo);
        for (var i = 0; i < STEPS.length; i++) {
            var sfx = STEPS[i].sufixo;
            if (sfx && t.slice(-sfx.length) === sfx) return STEPS[i].chave;
        }
        return STEP_PADRAO;
    }

    function ehOcorrencia(tipo) {
        return !!tipo && tipo.slice(-SUFIXO_OCORRENCIA.length) === SUFIXO_OCORRENCIA;
    }

    function definicao(tipo) {
        return porTipo[tipoBase(tipo)] || null;
    }

    function ehRepetivel(tipo) {
        var d = definicao(tipo);
        return !!(d && d.repetivel);
    }

    // Uma chamada do roteiro atual? Serve para separar o que e historico.
    function doRoteiro(tipo) {
        return !!definicao(tipo);
    }

    function existeNoStep(def, step) {
        if (!def) return false;
        if (def.porJornada) return true;
        if (!def.steps) return true;
        return def.steps.indexOf(normalizaStep(step)) >= 0;
    }

    // Uma chamada crua vira uma chamada concreta do step: tipo com sufixo,
    // titulo com o nome da prova no lugar de {STEP}.
    function resolve(def, step) {
        if (!def) return null;
        var s = normalizaStep(step);
        return {
            tipo: def.porJornada ? def.tipo : def.tipo + sufixoStep(s),
            titulo: String(def.titulo).replace('{STEP}', rotuloStep(s)),
            grupo: def.grupo,
            repetivel: !!def.repetivel,
            pergunta: def.pergunta || null,
            porJornada: !!def.porJornada,
            step: def.porJornada ? null : s,
            base: def.tipo
        };
    }

    // Como este landmark deveria se chamar, a partir do tipo que ele tem no
    // banco (inclusive um landmark de um step que o aluno ja passou).
    function resolvida(tipo) {
        var def = definicao(tipo);
        if (!def) return null;
        if (ehOcorrencia(tipo)) return null; // ocorrencia tem titulo proprio
        return resolve(def, stepDoTipo(tipo));
    }

    // O roteiro que o aluno ve hoje. `opcoes.pesquisa` e `opcoes.fernando`
    // entram so para quem o Marcos liberou.
    function roteiro(step, opcoes) {
        var s = normalizaStep(step);
        var op = opcoes || {};
        var lista = CHAMADAS.filter(function (c) { return existeNoStep(c, s); });
        if (op.pesquisa) lista = lista.concat(PESQUISA);
        if (op.fernando) lista = lista.concat(FERNANDO);
        return lista.map(function (c) { return resolve(c, s); });
    }

    // Esta chamada faz parte do roteiro de agora, ou e de uma prova anterior?
    function noStep(tipo, step) {
        var def = definicao(tipo);
        if (!def) return false;
        if (def.porJornada) return true;
        return stepDoTipo(tipo) === normalizaStep(step) && existeNoStep(def, step);
    }

    // Em que grupo da pagina o landmark cai, dado o step atual do aluno.
    function grupoDe(tipo, step) {
        if (/^call_extra_/.test(tipo || '')) return 'extras';
        var def = definicao(tipo);
        if (!def) return 'historico';
        return noStep(tipo, step) ? def.grupo : 'historico';
    }

    function mentorDoTitulo(titulo) {
        var t = String(titulo || '');
        if (/Iria/i.test(t)) return 'iria';
        if (/Marcos/i.test(t)) return 'marcos';
        if (/Guilherme/i.test(t)) return 'guilherme';
        if (/Fernando/i.test(t)) return 'fernando';
        return '';
    }

    window.WardRoteiro = {
        SUFIXO_OCORRENCIA: SUFIXO_OCORRENCIA,
        STEPS: STEPS,
        STEP_PADRAO: STEP_PADRAO,
        GRUPOS: GRUPOS,
        CHAMADAS: CHAMADAS,
        PESQUISA: PESQUISA,
        FERNANDO: FERNANDO,
        TODAS: TODAS,
        normalizaStep: normalizaStep,
        rotuloStep: rotuloStep,
        sufixoStep: sufixoStep,
        stepDoTipo: stepDoTipo,
        semOcorrencia: semOcorrencia,
        tipoBase: tipoBase,
        ehOcorrencia: ehOcorrencia,
        definicao: definicao,
        resolvida: resolvida,
        resolve: resolve,
        roteiro: roteiro,
        existeNoStep: existeNoStep,
        noStep: noStep,
        grupoDe: grupoDe,
        ehRepetivel: ehRepetivel,
        doRoteiro: doRoteiro,
        mentorDoTitulo: mentorDoTitulo
    };
})();
