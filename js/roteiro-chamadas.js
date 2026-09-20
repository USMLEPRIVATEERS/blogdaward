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
 */
(function () {
    'use strict';

    // Ocorrencias de chamadas repetiveis carregam este sufixo no landmark_type.
    // A auditoria de landmarks usa isso para NAO tratar duas ocorrencias da
    // mesma chamada como duplicata.
    var SUFIXO_OCORRENCIA = '__oc';

    var GRUPOS = [
        { chave: 'imersao', titulo: 'Imersão no USMLE' },
        { chave: 'seguimento', titulo: 'Chamadas de seguimento' },
        { chave: 'prova', titulo: 'Planejamento de prova' }
    ];

    var CHAMADAS = [
        // ---------- Imersão no USMLE ----------
        { grupo: 'imersao', tipo: 'call_marcos_plataforma', titulo: 'Marcos Vilela: como usar a plataforma da Ward Academy' },
        { grupo: 'imersao', tipo: 'call_iria_uworld', titulo: 'Iria da Costa: como resolver as questões do UWorld' },
        { grupo: 'imersao', tipo: 'call_iria_caminhos', titulo: 'Iria: o que é o USMLE e quais caminhos ele abre' },
        { grupo: 'imersao', tipo: 'call_guilherme_anki_setup', titulo: 'Guilherme: configurando o Anki do zero' },
        { grupo: 'imersao', tipo: 'call_marcos_myintealth_conta', titulo: 'Marcos: criando a sua conta no Myintealth' },
        { grupo: 'imersao', tipo: 'call_marcos_notarycam', titulo: 'Marcos: reconhecendo os documentos no NotaryCam' },
        { grupo: 'imersao', tipo: 'call_marcos_myintealth_final', titulo: 'Marcos: finalizando a inscrição no Myintealth' },
        { grupo: 'imersao', tipo: 'call_iria_materiais', titulo: 'Iria: quais materiais de estudo usar na preparação' },
        { grupo: 'imersao', tipo: 'call_iria_visto', titulo: 'Iria: como funciona o visto para os Estados Unidos' },
        { grupo: 'imersao', tipo: 'call_iria_familia', titulo: 'Iria: conversando com a família sobre a decisão do USMLE' },
        { grupo: 'imersao', tipo: 'call_iria_financeiro', titulo: 'Iria: planejando o lado financeiro da jornada' },

        // ---------- Chamadas de seguimento (sempre disponíveis) ----------
        {
            grupo: 'seguimento', tipo: 'call_marcos_ajuste_cronograma',
            titulo: 'Marcos: ajustando o seu cronograma de estudos', repetivel: true
        },
        {
            grupo: 'seguimento', tipo: 'call_iria_system',
            titulo: 'Iria: avaliando a conclusão de um system', repetivel: true,
            pergunta: {
                rotulo: 'Qual system você concluiu?',
                dica: 'Ex: Cardiologia, Neurologia, Renal...'
            }
        },
        {
            grupo: 'seguimento', tipo: 'call_iria_orientacoes',
            titulo: 'Iria: orientações gerais sobre a sua preparação', repetivel: true,
            pergunta: {
                rotulo: 'Sobre o que você quer conversar?',
                dica: 'Escreva em uma linha o que precisa tratar'
            }
        },
        {
            grupo: 'seguimento', tipo: 'call_guilherme_anki_update',
            titulo: 'Guilherme: atualizando e revisando o seu Anki', repetivel: true
        },

        // ---------- Planejamento de prova ----------
        { grupo: 'prova', tipo: 'call_iria_second_pass', titulo: 'Iria: planejando a segunda passada no conteúdo' },
        { grupo: 'prova', tipo: 'call_iria_simulados', titulo: 'Iria: organizando os simulados até a prova' },
        { grupo: 'prova', tipo: 'call_marcos_fsmb', titulo: 'Marcos: fazendo a sua inscrição no FSMB' },
        { grupo: 'prova', tipo: 'call_marcos_claude', titulo: 'Marcos: usando o Claude na preparação para o Step 1' },
        { grupo: 'prova', tipo: 'call_iria_materiais_reta_final', titulo: 'Iria: escolhendo os materiais de estudo da reta final' },
        { grupo: 'prova', tipo: 'call_guilherme_anki_reta_final', titulo: 'Guilherme: ajustando o Anki para a reta final' },
        {
            grupo: 'prova', tipo: 'call_iria_self_assessment',
            titulo: 'Iria: avaliando o seu resultado no self assessment', repetivel: true,
            pergunta: {
                rotulo: 'Qual simulado você fez?',
                dica: 'Ex: UWSA1, NBME 28, NBME 29...'
            }
        },
        { grupo: 'prova', tipo: 'call_marcos_eligibility', titulo: 'Marcos: marcando o eligibility period no FSMB' },
        { grupo: 'prova', tipo: 'call_marcos_preditivos', titulo: 'Marcos: organizando os materiais preditivos já realizados' },
        { grupo: 'prova', tipo: 'call_iria_predicao', titulo: 'Iria: avaliando a predição e definindo a data da prova' },
        { grupo: 'prova', tipo: 'call_marcos_prometric', titulo: 'Marcos: agendando a sua prova no Prometric' },
        { grupo: 'prova', tipo: 'call_iria_predicao_check', titulo: 'Iria: checando se a predição permite marcar a prova' },
        { grupo: 'prova', tipo: 'call_iria_pre_prova', titulo: 'Iria: conversa de preparação para o dia da prova' }
    ];

    // Sequencia de pesquisa com o Marcos. Fica fora do roteiro padrao: so
    // aparece para quem o Marcos liberar no dashboard dele.
    var PESQUISA = [
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_onboarding', titulo: 'Marcos: primeiros passos na pesquisa científica' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_ideia', titulo: 'Marcos: validando a ideia da sua pesquisa' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_databases', titulo: 'Marcos: usando as databases corretamente na busca' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_triagem_titulo', titulo: 'Marcos: fazendo a triagem por título e resumo' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_triagem_manuscrito', titulo: 'Marcos: fazendo a triagem por manuscrito completo' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_extracao', titulo: 'Marcos: extraindo os dados dos estudos' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_vies', titulo: 'Marcos: avaliando o risco de viés dos estudos' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_escrita', titulo: 'Marcos: escrevendo o manuscrito do seu artigo' },
        { grupo: 'pesquisa', tipo: 'call_marcos_pesquisa_submissao', titulo: 'Marcos: submetendo o manuscrito para a revista' }
    ];

    // Chamada do Dr. Fernando: so para quem o Marcos marcar como aluno dele.
    // O tipo e o mesmo de antes para nao soltar os agendamentos ja existentes.
    var FERNANDO = [
        { grupo: 'fernando', tipo: 'call_fernando_research', titulo: 'Fernando: mentoria em pesquisa científica' }
    ];

    var TODAS = CHAMADAS.concat(PESQUISA, FERNANDO);

    var porTipo = {};
    TODAS.forEach(function (c) { porTipo[c.tipo] = c; });

    function tipoBase(tipo) {
        if (!tipo) return '';
        return tipo.slice(-SUFIXO_OCORRENCIA.length) === SUFIXO_OCORRENCIA
            ? tipo.slice(0, -SUFIXO_OCORRENCIA.length)
            : tipo;
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
        GRUPOS: GRUPOS,
        CHAMADAS: CHAMADAS,
        PESQUISA: PESQUISA,
        FERNANDO: FERNANDO,
        TODAS: TODAS,
        tipoBase: tipoBase,
        ehOcorrencia: ehOcorrencia,
        definicao: definicao,
        ehRepetivel: ehRepetivel,
        doRoteiro: doRoteiro,
        mentorDoTitulo: mentorDoTitulo
    };
})();
