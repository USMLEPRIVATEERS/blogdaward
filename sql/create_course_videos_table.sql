-- ============================================================================
-- WARD ACADEMY - COURSE VIDEOS DATABASE SCHEMA
-- Complete course structure for USMLE preparation and IMG guidance
-- ============================================================================

-- Course Videos Table for Ward Academy
-- Tags are hierarchical using :: separator (e.g., "MODULO_0::INICIO_ABSOLUTO::MEGA_GUIA")
CREATE TABLE IF NOT EXISTS course_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    tags VARCHAR(500) NOT NULL,  -- Hierarchical tags like "MODULO_0::INICIO_ABSOLUTO::MEGA_GUIA"
    video_url TEXT,              -- YouTube or Vimeo URL (nullable)
    description TEXT,            -- Video/lesson description (nullable)
    thumbnail_url TEXT,          -- Optional thumbnail image
    duration_minutes INTEGER,    -- Video duration in minutes
    order_position INTEGER DEFAULT 0,  -- For ordering within category
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table for course videos
CREATE TABLE IF NOT EXISTS course_video_comments (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES course_videos(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_course_videos_tags ON course_videos(tags);
CREATE INDEX IF NOT EXISTS idx_course_videos_published ON course_videos(is_published);

-- ============================================================================
-- MÓDULO 0: INÍCIO ABSOLUTO - "DO ZERO AO PRIMEIRO PASSO"
-- ============================================================================

INSERT INTO course_videos (title, tags, video_url, description, duration_minutes, order_position) VALUES

-- 0.1 VÍDEO MEGA-GUIA
('Todo o Processo do Zero ao Match - Mega Guia Completo', 
 'MODULO_0::INICIO_ABSOLUTO::MEGA_GUIA', 
 NULL, 
 'Video unico e completo cobrindo: Timeline visual completa do processo, explicacao da sopa de letrinhas (USMLE, ECFMG, Intealth, NRMP, ERAS, Match), o que fazer HOJE se voce esta no dia zero, checklist dos primeiros 30 dias, erros mais comuns de quem esta comecando, quanto tempo leva (realista: 2-5 anos), quanto custa (breakdown completo: $15k-$30k+ USD), analise custo-beneficio honesta. Foco Old Grad: Expectativas realistas desde o inicio - sem romantizar o processo.', 
 90, 1),

-- 0.2 Como Sair da Inércia
('Como Sair da Inercia: Vencendo a Paralisia Inicial', 
 'MODULO_0::INICIO_ABSOLUTO::PARALISIA_INICIAL', 
 NULL, 
 'Video motivacional e pratico cobrindo: Sindrome do Impostor - reconhecer e combater, por onde comecar quando esta perdido, como criar momentum (pequenas acoes diarias), evitando a armadilha do planejamento eterno, primeiro diagnostic test - por que fazer AGORA, mindset: consistencia > perfeicao. Inclui RELATO REAL de membro que ficou 2 anos planejando antes de comecar. Foco Old Grad: Muitos old grads ficam meses so pesquisando e nunca comecam.', 
 20, 2),

-- 0.3 Checklist Completo
('Checklist Completo: O Que Voce Precisa Ter e Fazer', 
 'MODULO_0::INICIO_ABSOLUTO::CHECKLIST', 
 NULL, 
 'PDF interativo com video walkthrough cobrindo: Documentacao (passaporte valido, diploma, historico), financeiro (quanto guardar, quando comecar), ingles (nivel necessario, certificacoes), ferramentas (computador, internet, software necessario), tempo (quanto disponibilizar por semana - minimo), suporte familiar (conversa crucial antes de comecar), decisao Brasil vs EUA - fatores a considerar. Inclui planilha de autoavaliacao para saber se esta pronto para comecar.', 
 20, 3),

-- 0.4 Planejamento Financeiro
('Planejamento Financeiro: Quanto Custa e Como Se Preparar', 
 'MODULO_0::INICIO_ABSOLUTO::FINANCEIRO', 
 NULL, 
 'Planilha Excel com video explicativo. Breakdown detalhado de custos 2025: Exames (~$2,500 Step 1+2CK+3), materiais de estudo (~$1,500-2,000), OET (~$600), ECFMG fees (~$1,200), viagens para provas (~$2,000-3,000), estagios nos EUA (~$3,000-8,000), ERAS application (~$1,500-2,500), viagens para entrevistas (variavel), relocation (~$5,000-10,000). Como economizar em cada etapa, materiais gratuitos vs pagos, emprestimos e financiamento, planejamento de 2-3 anos de poupanca. Inclui calculadora interativa de custos personalizada.', 
 30, 4),

-- 0.5 Estados Mais Favoráveis
('Estados Mais Favoraveis para IMGs: Onde Voce Tem Mais Chances', 
 'MODULO_0::INICIO_ABSOLUTO::ESTADOS_FAVORAVEIS', 
 NULL, 
 'Mapa interativo com video analise. States com mais vagas para IMGs: New York, Illinois, Pennsylvania, Texas, Michigan - por que esses estados contratam mais IMGs. IMG-friendly cities: NYC, Chicago, Detroit, Philadelphia. Custo de vida vs salario de residente, comunidades brasileiras estabelecidas, fatores climaticos (importante para familia), licensing requirements por estado, alternative pathways por estado (Tennessee, Missouri, etc). Inclui mapa interativo filtrado por: vagas IMG, custo de vida, clima, comunidade BR.', 
 25, 5),

-- ============================================================================
-- MÓDULO 1: ENTENDENDO O PROCESSO - VERSÃO APROFUNDADA
-- ============================================================================

-- 1.1 Step 1 Pass/Fail
('Step 1 Pass/Fail: A Nova Realidade e Como Estudar Mesmo Assim', 
 'MODULO_1::ENTENDENDO_PROCESSO::STEP1_PASS_FAIL', 
 NULL, 
 'Conteudo ampliado: Por que estudar MUITO mesmo sendo P/F (base para Step 2 CK que da score, falhar = red flag gigante, conhecimento necessario para pratica clinica). Passing score: 196 - o que isso significa na pratica. Test-taking strategies especificas para Step 1. Como usar NBMEs para prever se vai passar. Target realista: passar confortavelmente (nao por 1 ponto). Inclui VIDEO RELATO de old grad que passou mas ficou no limite - licoes aprendidas.', 
 35, 1),

-- 1.2 Step 2 CK
('Step 2 CK: O Novo Rei - Como Maximizar Seu Score', 
 'MODULO_1::ENTENDENDO_PROCESSO::STEP2_CK', 
 NULL, 
 'Conteudo expandido: Por que CK virou tao importante (83% dos PDs consideram, 30% tem cutoff minimo, unica metrica numerica objetiva pos-Step 1 P/F). Target scores por specialty: Competitive 250+, Mid-tier 240-250, Less competitive 230-240. Vantagem dos old grads: experiencia clinica real. Como traduzir experiencia BR em conhecimento CK. Diferencas de conduta EUA vs Brasil. Tutorial de raciocinio clinico americano. Inclui VIDEO RELATO de old grad com 10+ anos que tirou 260+ no CK.', 
 40, 2),

-- 1.3 Diferenças Brasil vs EUA - Série
('Diferencas de Pratica Medica: Brasil vs Estados Unidos - Abordagem Diagnostica', 
 'MODULO_1::ENTENDENDO_PROCESSO::DIFERENCAS_BR_EUA::ABORDAGEM_DIAGNOSTICA', 
 NULL, 
 'Serie de videos curtos. Abordagem diagnostica: algoritmos americanos, uso de guidelines (muito mais rigoroso nos EUA).', 
 15, 3),

('Diferencas de Pratica Medica: Aspectos Medico-Legais', 
 'MODULO_1::ENTENDENDO_PROCESSO::DIFERENCAS_BR_EUA::MEDICO_LEGAL', 
 NULL, 
 'Defensive medicine e questoes medico-legais, autonomia do paciente e informed consent.', 
 15, 4),

('Diferencas de Pratica Medica: Prescricao e Manejo de Dor', 
 'MODULO_1::ENTENDENDO_PROCESSO::DIFERENCAS_BR_EUA::PRESCRICAO_DOR', 
 NULL, 
 'Prescricao de antibioticos e opioides, manejo de dor e diferencas culturais.', 
 15, 5),

('Diferencas de Pratica Medica: Cuidados de Fim de Vida', 
 'MODULO_1::ENTENDENDO_PROCESSO::DIFERENCAS_BR_EUA::FIM_DE_VIDA', 
 NULL, 
 'End-of-life care e advanced directives. Diferencas em lab values e unidades de medida. Inclui tabela comparativa de condutas comuns.', 
 15, 6),

-- 1.4 Alternative Pathways
('Alternative Pathways: Caminhos Alem do Match Tradicional', 
 'MODULO_1::ENTENDENDO_PROCESSO::ALTERNATIVE_PATHWAYS', 
 NULL, 
 'Video investigativo com entrevistas. Tennessee Pathway (Senate Bill SB 1371): requirements especificos, como aplicar, limitacoes e vantagens, quem se qualifica. Missouri Pathway (H.B. 402): residency substitute pathway, 3 anos de experiencia necessaria. Outros estados com programs especiais. Research Fellowship para Clinical Practice: como funciona, instituicoes que oferecem, requirements. Locum Tenens para IMGs. Staff positions sem residencia (muito raro, mas existe). ATUALIZACAO com novas leis estaduais de 2025. Inclui VIDEO ESPECIAL com entrevista de medico que usou alternative pathway.', 
 45, 7),

-- 1.5 Old Grad Específico
('Old Grad Especifico: Oportunidades e Desafios', 
 'MODULO_1::ENTENDENDO_PROCESSO::OLD_GRAD', 
 NULL, 
 'Mesa redonda virtual com 3-4 old grads. Vantagens de ser old grad: maturidade e experiencia clinica, soft skills desenvolvidos, network profissional brasileiro. Desvantagens honestas: competir com IMGs mais jovens, rust no conhecimento academico, responsabilidades financeiras/familiares, age bias (existe, mas pode ser superado). Como compensar time since graduation: Strong Step 2 CK score, multiple publications, strong USCE e LORs, compelling narrative no PS. Especialidades mais receptivas a old grads: Family Medicine, Internal Medicine, Psychiatry, Anesthesiology (pathway via pain fellowship). Inclui RELATOS de 3-4 old grads que matchearam em diferentes specialties.', 
 60, 8),

-- ============================================================================
-- MÓDULO 2: BUROCRACIA PASSO A PASSO - TUTORIAIS PRÁTICOS
-- ============================================================================

-- 2.1 MyIntealth
('Tutorial Completo: Criando Conta no MyIntealth', 
 'MODULO_2::BUROCRACIA::MYINTEALTH', 
 NULL, 
 'Screen recording com narracao passo a passo. Acesso ao portal www.myintealth.app. Passo 1: Criar conta (email, senha, security questions). Passo 2: Completar perfil basico. Passo 3: NotaryCam identity verification - documentos necessarios (passaporte OBRIGATORIO), agendamento da sessao, o que esperar durante a call, troubleshooting de problemas comuns. Passo 4: Obter MyIntealth ID. Passo 5: IIF (Intealth Identification Form) - como preencher cada campo, documentos para upload, common mistakes a evitar. Inclui PDF com screenshots de cada tela e checklist.', 
 25, 1),

-- 2.2 ECFMG Certification
('Tutorial Completo: Application for ECFMG Certification', 
 'MODULO_2::BUROCRACIA::ECFMG_CERTIFICATION', 
 NULL, 
 'Screen recording passo a passo. Quando aplicar: timeline recomendada. Navegacao no MyIntealth: onde encontrar a application. Secao por secao: Personal Information, Medical Education (como preencher dados da faculdade BR), upload de documentos, payment information. Taxa de aplicacao: como pagar (apenas cartao). Confirmacao e tracking: como acompanhar status. O que acontece depois: timeline de processamento. Erros comuns: como evitar. Inclui checklist interativo e FAQ de problemas comuns.', 
 35, 2),

-- 2.3 PSV
('Tutorial: Primary Source Verification (PSV) da Faculdade', 
 'MODULO_2::BUROCRACIA::PSV', 
 NULL, 
 'Video explicativo com template de emails. O que e PSV e por que demora tanto. Como identificar Authorized Officials da sua faculdade: onde procurar (site da faculdade, secretaria), titles comuns (Dean, Registrar, etc). Como solicitar PSV: email template em portugues, o que a faculdade precisa fazer, documentos que a faculdade enviara ao ECFMG. Timeline realista: 3-12 meses (pode ser MUITO demorado). Follow-up: como cobrar educadamente. Problemas comuns: faculdade nao responde, authorized official mudou/aposentou, faculdade nao sabe o processo. Solucoes praticas para cada problema. Inclui templates de email (PT e EN) e script de ligacao telefonica.', 
 25, 3),

-- 2.4 NotaryCam
('Tutorial: Processo do Notary (NotaryCam)', 
 'MODULO_2::BUROCRACIA::NOTARYCAM', 
 NULL, 
 'Screen recording com dicas praticas. Por que NotaryCam e obrigatorio. Preparacao antes da call: teste de camera e microfone, iluminacao adequada, background neutro, passaporte em maos. Durante a sessao: o que o notary vai pedir, como segurar o passaporte, perguntas que farao, quanto tempo demora (15-30 min). Problemas tecnicos comuns: camera nao funciona, conexao cai, documento nao e aceito. Apos a sessao: o que acontece depois. Inclui checklist pre-sessao.', 
 20, 4),

-- 2.5 Aplicação Step 1 e 2 CK
('Tutorial: Aplicacao para Step 1 no MyIntealth', 
 'MODULO_2::BUROCRACIA::APLICACAO_STEP1', 
 NULL, 
 'Screen recording. Requirements antes de aplicar: ECFMG Certification em progresso, taxa de aplicacao disponivel. Passo a passo da application: selecao do exam, escolha da eligibility period (3 meses), payment ($695 por exam em 2025), confirmacao. Apos aprovacao: receber scheduling permit. Scheduling no Prometric: como encontrar test centers, dicas de locations (EUA vs fora), quando agendar (strategic timing). Mudancas e cancelamentos: politicas e fees. Dia da prova: o que levar, o que esperar. Inclui guia de test centers recomendados e experiencias de alunos.', 
 20, 5),

('Tutorial: Aplicacao para Step 2 CK no MyIntealth', 
 'MODULO_2::BUROCRACIA::APLICACAO_STEP2CK', 
 NULL, 
 'Screen recording. Requirements antes de aplicar: ECFMG Certification em progresso, taxa de aplicacao disponivel. Passo a passo da application: selecao do exam, escolha da eligibility period (3 meses), payment ($695 por exam em 2025), confirmacao. Apos aprovacao: receber scheduling permit. Scheduling no Prometric: como encontrar test centers, dicas de locations (EUA vs fora), quando agendar (strategic timing). Mudancas e cancelamentos: politicas e fees. Dia da prova: o que levar, o que esperar. Inclui guia de test centers recomendados e experiencias de alunos.', 
 20, 6),

-- 2.6 OET - Série
('OET Medicine: Overview e Estrutura', 
 'MODULO_2::BUROCRACIA::OET::OVERVIEW', 
 NULL, 
 'Estrutura do OET Medicine. Score necessario: 350+ em CADA sub-teste. Timeline: fazer ate dezembro 2025 para Match 2026.', 
 15, 7),

('OET Medicine: Listening - Estrategias', 
 'MODULO_2::BUROCRACIA::OET::LISTENING', 
 NULL, 
 'Formato das questoes, estrategias especificas, materiais de pratica recomendados.', 
 20, 8),

('OET Medicine: Reading - Estrategias', 
 'MODULO_2::BUROCRACIA::OET::READING', 
 NULL, 
 'Tipos de texto, time management, estrategias de skimming/scanning.', 
 20, 9),

('OET Medicine: Writing - Referral Letter (MAIS IMPORTANTE)', 
 'MODULO_2::BUROCRACIA::OET::WRITING', 
 NULL, 
 'Formato da referral letter, estrutura padrao, common mistakes, templates e exemplos, como estudar. Inclui mock OET writing tasks corrigidos com feedback.', 
 30, 10),

('OET Medicine: Speaking - Role-plays', 
 'MODULO_2::BUROCRACIA::OET::SPEAKING', 
 NULL, 
 'Role-plays, como praticar sozinho, gravacao e auto-avaliacao.', 
 25, 11),

-- 2.7 Vistos
('Vistos para Medicos: Guia Completo J-1 vs H1B', 
 'MODULO_2::BUROCRACIA::VISTOS', 
 NULL, 
 'Video explicativo detalhado. Vistos para observerships/clerkships: B1/B2 com approval letter, como conseguir. J-1 Visa (o mais comum para residencia): Intealth como sponsor oficial, requirements e documentacao, DS-2019 form, 2-year home residency requirement, J-1 Waiver - como funciona, quando aplicar, estados que ajudam com waiver. H1B Visa: programas que oferecem (lista atualizada), cap-exempt institutions, vantagens vs J-1, path to green card. Dependentes: J-2 vs H4 status. Planejamento de longo prazo: qual escolher e por que. Inclui lista atualizada de programs com H1B sponsorship.', 
 40, 12),

-- ============================================================================
-- MÓDULO 3: ESTRATÉGIAS DE ESTUDO - ULTRA PRÁTICO
-- ============================================================================

-- 3.1 Cronograma para Quem Trabalha
('Cronograma para Quem Trabalha: Modelos Prontos', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::CRONOGRAMA_TRABALHANDO', 
 NULL, 
 'Planilhas editaveis com video explicativo. Modelo 1: 1 hora/dia (timeline 24+ meses). Modelo 2: 2 horas/dia (timeline 12-18 meses). Modelo 3: 3+ horas/dia (timeline 8-12 meses). Modelo 4: Plantoes + dias off (irregular schedule). Como bloquear tempo sagrado para estudos. Early morning vs night owl: quando estudar. Weekends: como maximizar. Tracking de progresso: apps e metodos. Quando considerar reduzir carga de trabalho. Sinais de burnout: como identificar e prevenir. Inclui RELATO de 3 old grads contando suas rotinas reais (cirurgiao, intensivista, plantonista). Google Sheets com cronogramas editaveis.', 
 30, 1),

-- 3.2 Diagnostic Test
('Diagnostic Test e Analise de Gaps: Por Onde Comecar', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::DIAGNOSTIC_TEST', 
 NULL, 
 'Tutorial pratico. Por que fazer diagnostic AGORA (nao depois). Como fazer: NBME ou UWSA como baseline. Analise de resultados: identificar sistemas fracos, identificar tipos de questoes problematicas, criar plano de ataque personalizado. Setting de metas realistas: short-term (semanal), mid-term (mensal), long-term (ate a prova). Reavaliacao a cada 4-6 semanas. Inclui planilha de analise de performance.', 
 25, 2),

-- 3.3 Tutorial Anki
('Tutorial Anki: Setup Completo de A a Z', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::ANKI_SETUP', 
 NULL, 
 'Screen recording detalhado. Download e instalacao: Windows, Mac, iOS, Android. Configuracao inicial: sincronizacao AnkiWeb. Download do AnKing V12: onde baixar, como importar, troubleshooting. FSRS (Free Spaced Repetition Scheduler): o que e e por que usar, como ativar, otimizacao de parametros. Settings ideais para old grads: new cards per day (realista 20-50), reviews per day (gerenciar 100-300), intervals, lapses. Add-ons essenciais: Review Heatmap, Image Occlusion, outros uteis. Workflow diario: como usar Anki eficientemente. Integracao com UWorld: tagging e suspensao de cards. Mobile optimization: usar em tempo morto. Inclui PDF com settings otimizados e troubleshooting guide.', 
 60, 3),

-- 3.4 UWorld Workshop
('UWorld: Como Usar da Forma Mais Eficiente (Workshop)', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::UWORLD_WORKSHOP', 
 NULL, 
 'Video pratico com demonstration. Tutor Mode vs Timed Mode: quando usar cada um. Timed/Random simulation: como fazer corretamente. Leitura das explanations: o que realmente importa, como anotar, quanto tempo gastar. UWorld Notes: como usar esse recurso. Question IDs (QID): sistema de tracking. Incorrect questions: review strategy. Marked questions: como e quando marcar. Performance tracking: metrics que importam. First pass: o que fazer. Second pass: strategy diferente. Integracao com Anki: unsuspend cards de topicos feitos. Resolvendo questoes AO VIVO: 10 questoes com think-aloud. Inclui template de anotacoes UWorld e Excel tracker.', 
 40, 4),

-- 3.5 Resolução de Questões - Série
('Resolucao de Questoes USMLE: Cardiology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::CARDIOLOGY', 
 NULL, 
 'Serie semanal. 5 questoes de Cardiology. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies, nao apenas conteudo. High-yield pearls apos cada questao.', 
 20, 5),

('Resolucao de Questoes USMLE: Pulmonology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::PULMONOLOGY', 
 NULL, 
 '5 questoes de Pulmonology. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 6),

('Resolucao de Questoes USMLE: Gastroenterology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::GI', 
 NULL, 
 '5 questoes de GI. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 7),

('Resolucao de Questoes USMLE: Renal', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::RENAL', 
 NULL, 
 '5 questoes de Renal. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 8),

('Resolucao de Questoes USMLE: Endocrinology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::ENDO', 
 NULL, 
 '5 questoes de Endocrinology. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 9),

('Resolucao de Questoes USMLE: Neurology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::NEURO', 
 NULL, 
 '5 questoes de Neurology. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 10),

('Resolucao de Questoes USMLE: Psychiatry', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::PSYCH', 
 NULL, 
 '5 questoes de Psychiatry. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 11),

('Resolucao de Questoes USMLE: Infectious Disease', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::ID', 
 NULL, 
 '5 questoes de Infectious Disease. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 12),

('Resolucao de Questoes USMLE: Hematology-Oncology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::HEME_ONC', 
 NULL, 
 '5 questoes de Hematology-Oncology. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 13),

('Resolucao de Questoes USMLE: Rheumatology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::QUESTOES::RHEUM', 
 NULL, 
 '5 questoes de Rheumatology. Formato: ler questao, pausar, explicar raciocinio, resposta, explicacao detalhada. Foco em test-taking strategies. High-yield pearls.', 
 20, 14),

-- 3.6 Materiais de Estudo
('Materiais de Estudo: Gratuitos vs Pagos - Guia Completo', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::MATERIAIS', 
 NULL, 
 'Guia completo. Recursos GRATUITOS que funcionam: Anki (gratis no desktop), Amboss Library (free access para students), YouTube channels (Dirty Medicine, Medicosis, Armando Hasudungan), Free 120 (simulado gratis), Khan Academy (basicos), como acessar drives gringos com materiais. Recursos PAGOS que valem a pena: UWorld (ESSENCIAL ~$500-600), AMBOSS Q-Bank (complementar ~$300), Pathoma (vale muito ~$100), Sketchy (se visual learner ~$300), B&B (alternativa ~$200). Recursos PAGOS que NAO valem: Kaplan lecture videos (desatualizados), multiplos Q-Banks alem de UWorld e AMBOSS. Como economizar: grupos para dividir contas, descontos sazonais, priorizacao do que comprar primeiro. Inclui planilha de custo-beneficio e links de descontos.', 
 30, 15),

-- 3.7 Inglês Médico - Série
('Ingles Medico: Apresentacao de Casos (SOAP Format)', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::INGLES_MEDICO::SOAP', 
 NULL, 
 'Serie de videos praticos. Apresentacao de casos no formato SOAP (Subjective, Objective, Assessment, Plan).', 
 20, 16),

('Ingles Medico: Terminologia Americana vs Brasileira', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::INGLES_MEDICO::TERMINOLOGIA', 
 NULL, 
 'Terminologia medica americana vs brasileira. Diferencas importantes.', 
 20, 17),

('Ingles Medico: Comunicacao com Pacientes (Plain Language)', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::INGLES_MEDICO::COMUNICACAO', 
 NULL, 
 'Comunicacao com pacientes usando plain language.', 
 20, 18),

('Ingles Medico: Abreviacoes e Acronimos', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::INGLES_MEDICO::ABREVIACOES', 
 NULL, 
 'Medical abbreviations e acronyms mais usados.', 
 20, 19),

('Ingles Medico: Pronuncia de Termos Medicos', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::INGLES_MEDICO::PRONUNCIA', 
 NULL, 
 'Pronuncia de termos medicos comuns. Pratica com role-play scenarios. Inclui glossario PT-EN de termos medicos e Anki deck de vocabulario.', 
 20, 20),

-- 3.8 High-Yield Topics - Série
('High-Yield Topics: Cardiology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::CARDIO', 
 NULL, 
 'Arritmias, MI, HF, valvulopathies. Conceitos visuais, mnemonics, questoes.', 
 20, 21),

('High-Yield Topics: Pulmonology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::PULM', 
 NULL, 
 'Asthma, COPD, pneumonias, ARDS. Conceitos visuais, mnemonics, questoes.', 
 20, 22),

('High-Yield Topics: Gastroenterology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::GI', 
 NULL, 
 'IBD, cirrose, pancreatite, GI bleeds. Conceitos visuais, mnemonics, questoes.', 
 20, 23),

('High-Yield Topics: Renal', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::RENAL', 
 NULL, 
 'Acid-base, eletrolitos, AKI/CKD. Conceitos visuais, mnemonics, questoes.', 
 20, 24),

('High-Yield Topics: Endocrinology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::ENDO', 
 NULL, 
 'DM, thyroid, adrenal disorders. Conceitos visuais, mnemonics, questoes.', 
 20, 25),

('High-Yield Topics: Neurology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::NEURO', 
 NULL, 
 'Stroke, seizures, MS, meningitis. Conceitos visuais, mnemonics, questoes.', 
 20, 26),

('High-Yield Topics: Psychiatry', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::PSYCH', 
 NULL, 
 'Depression, schizophrenia, anxiety disorders. Conceitos visuais, mnemonics, questoes.', 
 20, 27),

('High-Yield Topics: Pharmacology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::PHARM', 
 NULL, 
 'MOA das principais drogas. Conceitos visuais, mnemonics, questoes.', 
 20, 28),

('High-Yield Topics: Microbiology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::MICRO', 
 NULL, 
 'Sketchy-based: bacteria, virus, parasites, fungi. Conceitos visuais, mnemonics, questoes.', 
 20, 29),

('High-Yield Topics: Immunology', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::HIGH_YIELD::IMMUNO', 
 NULL, 
 'Hypersensitivity, immunodeficiencies. Conceitos visuais, mnemonics, questoes. Inclui PDF compilado de todos os HY topics.', 
 20, 30),

-- 3.9 Test-Taking Strategies
('Test-Taking Strategies: Tecnicas de Prova', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::TEST_TAKING', 
 NULL, 
 'Workshop pratico. Time management: como distribuir 280 min (Step 1) ou 318 min (Step 2 CK). Estrategias por tipo de questao: direct recall, two-step, three-step clinical reasoning, next best step, most likely diagnosis. Techniques: ruling out answers, buzzwords recognition, pattern matching, avoiding overthinking. Flagging strategy: quando usar. Guessing intelligently: quando voce nao sabe. Dealing com fadiga: breaks estrategicos. Common traps: como evitar. Inclui cheat sheet de test strategies.', 
 35, 31),

-- 3.10 NBMEs e Simulados
('NBMEs e Simulados: Estrategia Completa', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::NBMES', 
 NULL, 
 'Guia pratico. Quando fazer cada NBME: diagnostic NBME (inicio), mid-prep NBMEs (a cada 4-6 semanas), final NBMEs (dedicated period). Qual ordem fazer: NBME 25-30 (mais recentes primeiro). UWSA1 e UWSA2: quando usar (final de prep). Free 120: obrigatorio antes da prova real. Como analisar resultados: nao apenas o score mas os erros, identificar patterns de mistakes, adjustar estudo baseado em gaps. Predicting passing: correlation de NBMEs com pass rate. Quanto tempo entre simulados: 1-2 semanas. Reviewing incorrects: metodo systematic. Inclui planilha de tracking de NBMEs e curva de progresso.', 
 30, 32),

-- 3.11 Dedicated Period
('Dedicated Period: Guia das Ultimas 4-8 Semanas', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::DEDICATED', 
 NULL, 
 'Roadmap completo. O que e dedicated: full-time study period. Timing ideal: 4-6 semanas para Step 1, 4-8 para Step 2 CK. Estrutura do dia ideal: 8-10 hours de estudo focado, breaks estrategicos, exercise e alimentacao, sleep hygiene. Week-by-week plan: Weeks 1-2 review completo + weak areas, Weeks 3-4 UWorld second pass + NBMEs, Week 5 final review + UWSA, Week 6 light review + Free 120, last 2-3 days TAPER (diminuir intensidade). O que NAO fazer: nao estudar material novo, nao fazer maratona na vespera, nao ficar acordado a noite toda. Mental health management. Como lidar com ansiedade. Inclui day-by-day schedule template para dedicated.', 
 40, 33),

-- 3.12 Dia da Prova
('Dia da Prova: Checklist e Expectativas', 
 'MODULO_3::ESTRATEGIAS_ESTUDO::DIA_PROVA', 
 NULL, 
 'Video pratico com PDF. Vespera da prova: light review (nao estudar pesado), preparar documentos, dormir cedo. Manha da prova: o que comer (leve, energetico), quando sair de casa, o que levar (ID, scheduling permit). No test center: check-in process, locker e pertences, palm vein scan, tutorial (skip ou usar 15 min). Durante a prova: break strategy, snacks recomendados, bathroom breaks, manter o pace. Apos a prova: quando sai o resultado (1-2 semanas), o que fazer enquanto espera, como lidar com ansiedade pos-prova. Inclui checklist fisico para imprimir.', 
 20, 34),

-- ============================================================================
-- MÓDULO 4: CURRÍCULO, PESQUISA E ESTÁGIOS (USCE)
-- ============================================================================

-- 4.1 Observerships
('Como Conseguir Observerships: Workshop Pratico', 
 'MODULO_4::CURRICULO_USCE::OBSERVERSHIPS', 
 NULL, 
 'Video tutorial com templates. O que e observership (vs clerkship vs research). Timeline: quando comecar a buscar (6-12 meses antes). Metodos de busca: cold emailing (PRINCIPAL), networking via LinkedIn, connections via Brazilian doctors nos EUA, agencias (pros e contras, lista de confiaveis), mapa interativo Ward Academy de instituicoes. Cold Email Strategy: para quem enviar (Program Coordinator, not PD), subject line que funciona, body (apresentacao, credenciais, request especifico), follow-up (quando e como), response rate realista (5-10%), quantos emails enviar (100-200+). Documentacao necessaria: CV atualizado, Brazilian medical license, proof of malpractice insurance, Hepatitis B/MMR/Varicella/TB screening, background check. Custos realistas: housing $1,000-2,000/mes, living expenses $500-1,000/mes, transportation variavel, total $3,000-8,000 para 4-8 semanas. Inclui 5 templates de cold emails testados, lista de 50+ programs IMG-friendly 2025, script de follow-up, checklist de documentacao.', 
 45, 1),

-- 4.2 Mapa de Oportunidades
('Mapa de Oportunidades para IMGs (Exclusivo Ward Academy)', 
 'MODULO_4::CURRICULO_USCE::MAPA_OPORTUNIDADES', 
 NULL, 
 'Plataforma interativa online. Mapa visual dos EUA com pins de instituicoes. Filtros: tipo (observership, clerkship, research fellowship), specialty, estado, IMG-friendly rating (baseado em feedback de alunos), cost range, housing provided (yes/no). Cada instituicao inclui: contact information, application process, requirements especificos, timeline de application, experiencias de alunos Ward Academy, rating (1-5 stars). Constantemente atualizado pela equipe Ward. Acesso vitalicio para alunos da mentoria.', 
 15, 2),

-- 4.3 Postura e Cultura
('Postura e Cultura nos Estagios Americanos', 
 'MODULO_4::CURRICULO_USCE::POSTURA_CULTURA', 
 NULL, 
 'Video crucial - um dos mais importantes! Mindset americano vs brasileiro: go-getter attitude, proatividade esperada, comunicacao direta (nao indireta). Dress code: business professional (suit) para entrevistas, business casual ou scrubs para dia-a-dia, o que NAO usar. Pontualidade: 5-10 min early e on time, on time e late. Como apresentar casos: SOAP format, conciseness > detalhes excessivos, practice runs antes de apresentar. Communication style: eye contact, firm handshake, smile e enthusiasm, thank you frequente. Hierarchy respect: como se dirigir a attendings/fellows/residents, when to speak/when to listen. Red flags a evitar: chegar atrasado, cell phone usage, gossip, negative attitude, not showing interest. Como se destacar: ask thoughtful questions, show genuine interest, offer to help, follow-up apos rotacao. Inclui entrevista com PD americano explicando o que eles procuram e checklist de dos and donts.', 
 30, 3),

-- 4.4 Letters of Recommendation
('Letters of Recommendation: Como Conseguir LORs Fortes', 
 'MODULO_4::CURRICULO_USCE::LOR', 
 NULL, 
 'Guia estrategico. Importancia: 84% dos PDs consideram (2024 NRMP). Quantas necessarias: minimo 3, ideal 4 (3 USCE-based + 1 do Brasil se forte). De quem pedir: gold standard e US attending em USCE, silver e US fellow ou chief resident, avoid generic letters de quem mal conhece voce. Como construir relationship para LOR: nao pedir no primeiro dia, show value durante rotacao, express interest genuino, stay in touch. Quando pedir: 4-6 semanas antes de ERAS application. Como pedir: in-person ou email personalizado, explain your goals, provide CV e draft de PS, SEMPRE fazer waiver (renunciar direito de ler), facilitate o processo (dar templates). ERAS LOR system: como funciona. What if voce nao tem USCE: alternativas (nao ideais, mas possiveis). Inclui template de request de LOR e guide para quem vai escrever.', 
 35, 4),

-- 4.5 CV para Residência
('CV para Residencia: Como Valorizar Experiencia de Old Grad', 
 'MODULO_4::CURRICULO_USCE::CV', 
 NULL, 
 'Workshop com revisao ao vivo. Estrutura de CV para IMG: header (contact info, NRMP ID), education, clinical experience (aqui brilham os old grads!), research experience, leadership & volunteer, skills & interests, certifications. Como traduzir experiencia brasileira: Attending Physician vs Staff Surgeon, quantificar (Performed 200+ surgical procedures), highlighting responsibilities, mostrar breadth de experiencia. Old Grad como FORCA: 10+ years of clinical experience as..., leadership roles, teaching experience, administrative roles. O que INCLUIR: anos de experiencia (nao esconder!), specialized training, complex cases managed, publications e presentations, volunteer work. O que OMITIR: informacao pessoal (married, kids) - vai no ERAS nao CV, GPA (se nao e impressionante), hobbies irrelevantes. Formatting: consistencia e crucial, font Times New Roman ou Arial 11-12pt, margins 0.5-1 inch, length 2-3 paginas (old grads podem ter 3+). Common mistakes: typos (FATAL), inconsistent tenses, excessive abbreviations, poor formatting. Inclui template de CV editavel e 3 exemplos de old grads que matchearam. SERVICO: Revisao de CV pela Dra. Iria (included na mentoria).', 
 40, 5),

-- 4.6 Personal Statement
('Personal Statement: Contar Sua Historia de Old Grad', 
 'MODULO_4::CURRICULO_USCE::PERSONAL_STATEMENT', 
 NULL, 
 'Masterclass. Importancia: 81% dos PDs leem (2024 NRMP). Estrutura classica: Intro (10%) hook - o que chamou voce para medicina, Body (75%) sua jornada, experiencias formativas, por que ESSA specialty, Conclusion (15%) future goals, what youll bring. Old Grad PS Strategy: abordar o gap de frente (nao ignorar anos de formado), explaining After X years of practice in Brazil Ive decided to..., frame como STRENGTH My experience has solidified my passion for..., demonstrar maturidade, mostrar commitment (sacrificing established career). O que falar: specific experiences que shaped you, patient interactions memoraveis, challenges overcome, why this specialty specifically, what youll contribute. O que NAO fazer: cliches (I want to help people), sob stories excessivos, mentiras, negative reasons (residency in Brazil is bad), criticar healthcare systems. Length: ~750 words (1 pagina). Tone: professional mas pessoal, authentic. Editing process: multiple drafts, peer review, native speaker editing, professional service (when to use). Inclui 3 exemplos de PS fortes de old grads e template outline. SERVICO: Revisao de PS pela Dra. Iria + sugestoes (included).', 
 50, 6),

-- 4.7 Pesquisa Científica - Série
('Pesquisa Cientifica: Por Que Research Matters Pos-Step 1 P/F', 
 'MODULO_4::CURRICULO_USCE::PESQUISA::IMPORTANCIA', 
 NULL, 
 'Serie de videos (modulo 1 de 6). Importancia aumentada, o que program directors procuram, quantas publicacoes sao suficientes (5-10+ idealmente), quality vs quantity.', 
 30, 7),

('Pesquisa Cientifica: Tipos de Pesquisa para IMGs', 
 'MODULO_4::CURRICULO_USCE::PESQUISA::TIPOS', 
 NULL, 
 'Modulo 2. Case reports (mais acessivel), systematic reviews & meta-analyses, retrospective studies, original research (mais dificil), onde publicar (journals IMG-friendly).', 
 30, 8),

('Pesquisa Cientifica: Como Validar Ideia de Case Report', 
 'MODULO_4::CURRICULO_USCE::PESQUISA::VALIDAR_IDEA', 
 NULL, 
 'Modulo 3. Usando experiencia clinica brasileira, buscando literatura (PubMed), verificando se e novel ou learning point, evitando casos comuns.', 
 30, 9),

('Pesquisa Cientifica: Escrevendo um Case Report', 
 'MODULO_4::CURRICULO_USCE::PESQUISA::ESCREVER_CASE_REPORT', 
 NULL, 
 'Modulo 4. Estrutura: Abstract, Intro, Case, Discussion, Conclusion. Como escrever cada secao. Referencias e formatting. Submissao: cover letter.', 
 30, 10),

('Pesquisa Cientifica: Processo de Peer Review e Resubmissao', 
 'MODULO_4::CURRICULO_USCE::PESQUISA::PEER_REVIEW', 
 NULL, 
 'Modulo 5. O que esperar, como responder a reviewers, acceptance rate realista, timeline de publicacao.', 
 30, 11),

('Pesquisa Cientifica: Evitando Fraudes e Paper Mills', 
 'MODULO_4::CURRICULO_USCE::PESQUISA::FRAUDES', 
 NULL, 
 'Modulo 6. Red flags de journals predatorios, como verificar journal legitimacy, grupos fraudulentos - como identificar. Inclui template de case report e checklist de submission. SERVICO DA WARD ACADEMY: grupo de pesquisa hands-on com validacao de ideia, orientacao passo a passo, revisao de drafts, ajuda com submission, target 1st author publication em 6-12 meses. Projetos colaborativos: co-autoria em pesquisas em andamento, accumular publications adicionais.', 
 30, 12),

-- 4.8 Research Fellowship
('Como Conseguir Research Fellowship', 
 'MODULO_4::CURRICULO_USCE::RESEARCH_FELLOWSHIP', 
 NULL, 
 'Guia pratico. O que e research fellowship. Vantagens: hands-on clinical, LORs, networking, visa. Como buscar oportunidades: departamentos de universidades, NIH-funded labs, private research institutions. Application process. Funding: paid vs unpaid. Visa considerations: J-1 research scholar. Transition to clinical residency. Inclui RELATO com entrevista de IMG que fez RF e depois matched e lista de institutions offering RF para IMGs.', 
 30, 13),

-- 4.9 ERAS Application
('ERAS Application: Preenchendo Sem Erros', 
 'MODULO_4::CURRICULO_USCE::ERAS', 
 NULL, 
 'Screen recording passo a passo. Overview do ERAS: o que e, quando abre (setembro), token system, custos 2025 (~$100 para 10 programs +$18 cada adicional). Secoes do ERAS passo a passo: Personal Information, Medical Education, USMLE/COMLEX Transcript, Work Experience (critical para old grads!), Volunteer Experience, Research, Publications (como listar corretamente), Certifications, Medical Licensing, Other Information. Upload de documentos: CV, Personal Statement, photo (professional headshot), Letters of Recommendation (como request via ERAS), MSPE/Deans Letter (se aplicavel). Signal preferences (novas ferramentas): o que sao signals, especialties que usam (IM, PM&R, etc), como usar estrategicamente. Common mistakes CRITICOS: typos no personal info, datas erradas, trabalhos listados incorretamente, publications nao verificaveis, inconsistencia com CV. Review checklist antes de submit. Submission day: o que esperar. Inclui ERAS completion checklist e screenshots de cada secao. SERVICO: Revisao completa do ERAS pela equipe Ward (included).', 
 60, 14),

-- ============================================================================
-- MÓDULO 5: MATCH E ENTREVISTAS
-- ============================================================================

-- 5.1 Understanding NRMP Match
('Understanding NRMP Match: O Sistema Explicado', 
 'MODULO_5::MATCH_ENTREVISTAS::NRMP_MATCH', 
 NULL, 
 'Video explicativo com animacoes. Como funciona o algoritmo de match. Match statistics 2024 para IMGs: overall match rate ~60%, por specialty FM ~70% IM ~65% Psych ~55%, US IMGs vs non-US IMGs, old grads desafios especificos (dados). Timeline completa: setembro ERAS opens, outubro-janeiro entrevistas, final de fevereiro rank list deadline, marco Match Week. Couples Match: como funciona. SOAP: safety net se nao matchear. Inclui infografico da timeline e match stats por specialty.', 
 30, 1),

-- 5.2 Escolha de Programas
('Escolha de Programas: Estrategia de Application', 
 'MODULO_5::MATCH_ENTREVISTAS::ESCOLHA_PROGRAMAS', 
 NULL, 
 'Workshop estrategico. Quantos programas aplicar: Family Medicine 40-80, Internal Medicine 80-120, more competitive 100-150+, old grad = aplicar mais. Como escolher programs: IMG-friendly indicators (% of IMG residents), resources FREIDA/Texas STAR/Residency Explorer, program websites (culture, values), location considerations (family, custo de vida, clima), visa sponsorship J-1 vs H1B programs. Tier strategy: reach programs 15-20%, target programs 50-60%, safety programs 20-30%. Red flags de programs: high turnover, low board pass rates, legal issues. Making your list: planilha organizada. Inclui Excel de tracking de programs com filtros.', 
 40, 2),

-- 5.3 Mock Interviews - Série
('Mock Interviews: Perguntas Comuns', 
 'MODULO_5::MATCH_ENTREVISTAS::MOCK::PERGUNTAS_COMUNS', 
 NULL, 
 'Sessoes praticas 1-on-1 (sessao 1). Tell me about yourself (2-3 min estruturado), Why this specialty?, Why our program?, What are your strengths?, What are your weaknesses?, Where do you see yourself in 5-10 years?, Whats your greatest accomplishment?, Tell me about a challenge you overcame.', 
 60, 3),

('Mock Interviews: Perguntas para Old Grads', 
 'MODULO_5::MATCH_ENTREVISTAS::MOCK::PERGUNTAS_OLD_GRAD', 
 NULL, 
 'Sessao 2. Why did you wait X years to apply?, What have you been doing since graduation?, Wont you be older than your co-residents?, How will you adjust to being a trainee again?, What if you dont match?, Why US over Brazil?', 
 60, 4),

('Mock Interviews: Behavioral Questions (STAR Method)', 
 'MODULO_5::MATCH_ENTREVISTAS::MOCK::BEHAVIORAL', 
 NULL, 
 'Sessao 3. STAR method (Situation, Task, Action, Result). Conflict resolution scenarios. Teamwork examples. Leadership examples. Error/failure stories (and what you learned).', 
 60, 5),

('Mock Interviews: Questions for Interviewers', 
 'MODULO_5::MATCH_ENTREVISTAS::MOCK::QUESTIONS_TO_ASK', 
 NULL, 
 'Sessao 4. Smart questions to ask. What NOT to ask. Showing genuine interest. Feedback detalhado: content of answers, delivery (pace, tone, confidence), body language, eye contact, filler words (um, uh, like), enthusiasm level. Inclui lista de 100+ perguntas comuns e STAR method template. SERVICO: Sessoes de mock interview com Dra. Iria (included, ilimitadas se necessario).', 
 60, 6),

-- 5.4 Virtual Interview Setup
('Virtual Interview Setup: Ambiente e Tecnologia', 
 'MODULO_5::MATCH_ENTREVISTAS::VIRTUAL_SETUP', 
 NULL, 
 'Tutorial tecnico. Plataformas: Zoom, WebEx, Microsoft Teams - como usar cada uma. Equipment necessario: webcam (HD, idealmente externa), microphone (headset com mic ou lapel), lighting (ring light ou natural light bem posicionada), background (profissional, neutro, sem distracoes). Test setup: test a week before, test 30 min before, backup plan (phone as backup). Internet connection: wired > WiFi, close other applications, notify household members. Posture e framing: camera at eye level, sitting position, whats in frame. Dress code para virtual: full suit (top AND bottom - pode precisar levantar!), solid colors (azul, cinza, preto), avoid patterns/stripes, minimal jewelry, hair neat and professional. Inclui technical checklist e lighting setup guide.', 
 20, 7),

-- 5.5 Post-Interview Communication
('Post-Interview Communication: Love Letters e Updates', 
 'MODULO_5::MATCH_ENTREVISTAS::POST_INTERVIEW', 
 NULL, 
 'Guia estrategico. Thank you notes: quando enviar (24-48h apos interview), para quem (todos entrevistadores), template e personalization, tone (grateful, not desperate). Letter of Intent vs Letter of Interest: difference, quando enviar cada um, quantas LOIs enviar (uma so!), timing (janeiro, apos todas interviews). Program updates: new publications, awards, additional USCE, improved scores, como comunicar sem ser spam. Quando NAO enviar emails: evitar excessive communication, nao pedir feedback durante interview season. Inclui templates de thank you note, LOI, e LOI.', 
 25, 8),

-- 5.6 Rank Order List
('Rank Order List: A Decisao Final', 
 'MODULO_5::MATCH_ENTREVISTAS::RANK_LIST', 
 NULL, 
 'Workshop decisorio. Como criar seu ROL: certificacao no NRMP, deadline ultima quarta de fevereiro (~9pm ET), can edit ate deadline. Estrategia de ranking: rank by TRUE PREFERENCE nao strategy, algorithm works in your favor, dont try to game the system, certifique list antes de deadline! Factors a considerar: program fit e culture, location e family considerations, visa (J-1 vs H1B), future career goals, gut feeling. Couples match considerations: complexities, strategy different, comunicacao com parceiro. Final review: sleep on it mas dont overthink. Inclui ROL decision matrix template.', 
 30, 9),

-- 5.7 Match Week
('Match Week: Preparacao Emocional', 
 'MODULO_5::MATCH_ENTREVISTAS::MATCH_WEEK', 
 NULL, 
 'Video de suporte. Timeline da Match Week: Monday (~11am ET) sabe SE matchou (nao ONDE), Friday (~12pm ET) Match Day - descobre ONDE. Se voce matched: celebrate! nao descobrir location ate Friday, como passar a semana. Se voce NAO matched: SOAP Process comeca IMEDIATAMENTE, 72 horas criticas, como se preparar (ter materials prontos), suporte emocional crucial. Emotional preparation: ansiedade e normal, have support system, plan for both scenarios. Inclui SOAP preparation checklist (caso nao matche).', 
 20, 10),

-- 5.8 SOAP
('SOAP (Supplemental Offer and Acceptance Program)', 
 'MODULO_5::MATCH_ENTREVISTAS::SOAP', 
 NULL, 
 'Guia de emergencia. O que e SOAP. Como funciona: 72-hour intensive process. Preparation (BEFORE Match Week): have updated CV ready, updated PS (generic version), contact info organized, LORs updated if possible. During SOAP: programs with unfilled spots sao publicados, voce aplica rapidamente, programs offer interviews (virtual, rapidas), accept offer se receber. Strategies: apply broadly, be flexible (location, specialty), respond FAST, professional communication. Emotional support: Ward Academy suporte durante SOAP. Inclui SOAP timeline e template documents.', 
 30, 11),

-- 5.9 Pós-Match
('Pos-Match: Preparando para a Mudanca', 
 'MODULO_5::MATCH_ENTREVISTAS::POS_MATCH', 
 NULL, 
 'Guia de transicao. Imediato (pos-Match Day): contato com programa, paperwork inicial, contract review. Visto (J-1 ou H1B): timeline de application, documentacao necessaria, interview no consulado, processing time. Credentialing: state medical license application, ACLS/BLS/PALS certifications, background check, drug screening, immunization records, TB test. Logistica: housing (onde morar, como buscar), transportation (carro? transport publico?), banking (abrir conta americana), phone plan, health insurance (via programa). Financial planning: salario de residente $60-75k/ano (2025), taxes e deductions, budgeting para custo de vida, student loans (se tiver), emergency fund. Relocation: shipping pertences, temporary housing, timing da mudanca. Inclui checklist pos-match e timeline de preparativos.', 
 35, 12),

-- 5.10 Vida na Residência
('Vida na Residencia: Expectativas Realistas - IM Resident', 
 'MODULO_5::MATCH_ENTREVISTAS::VIDA_RESIDENCIA::IM', 
 NULL, 
 'Serie de entrevistas. Interview 1: IM Resident (BR IMG). Rotina tipica, duty hours (80h/week max), call schedule, relationship com attendings, desafios e rewards.', 
 20, 13),

('Vida na Residencia: Expectativas Realistas - FM Resident (Old Grad)', 
 'MODULO_5::MATCH_ENTREVISTAS::VIDA_RESIDENCIA::FM', 
 NULL, 
 'Interview 2: FM Resident (Old Grad). Adaptacao como old grad, relacao com co-residents mais jovens, balance work-life, family considerations.', 
 20, 14),

('Vida na Residencia: Expectativas Realistas - Anesthesiology Resident', 
 'MODULO_5::MATCH_ENTREVISTAS::VIDA_RESIDENCIA::ANESTHESIOLOGY', 
 NULL, 
 'Interview 3: Anesthesiology Resident. Specialty-specific insights, transition from clinical to procedural.', 
 20, 15),

('Vida na Residencia: Temas Comuns e Desafios', 
 'MODULO_5::MATCH_ENTREVISTAS::VIDA_RESIDENCIA::TEMAS_COMUNS', 
 NULL, 
 'Temas comuns: imposter syndrome, homesickness, adaptation cultural, dealing com hierarquia, making friends, burnout prevention, financial stress, future (fellowship vs attending). Inclui compiled wisdom de residents.', 
 20, 16),

-- ============================================================================
-- MÓDULO 6: RECURSOS EXTRAS E COMUNIDADE
-- ============================================================================

-- 6.1 Lives Mensais
('Lives Mensais: Novidades e Atualizacoes no Processo USMLE', 
 'MODULO_6::RECURSOS_EXTRAS::LIVES::NOVIDADES', 
 NULL, 
 'Live streaming com Q&A (60-90 min). Mes 1: Novidades e atualizacoes no processo USMLE.', 
 90, 1),

('Lives Mensais: Q&A Aberto com Dra. Iria', 
 'MODULO_6::RECURSOS_EXTRAS::LIVES::QA_DRA_IRIA', 
 NULL, 
 'Mes 2: Q&A aberto com Dra. Iria.', 
 90, 2),

('Lives Mensais: Guest Speaker - IMG que Matcheou', 
 'MODULO_6::RECURSOS_EXTRAS::LIVES::GUEST_SPEAKER', 
 NULL, 
 'Mes 3: Guest speaker - IMG que matched (different specialty cada vez).', 
 90, 3),

('Lives Mensais: Mesa Redonda - Old Grads em Diferentes Fases', 
 'MODULO_6::RECURSOS_EXTRAS::LIVES::MESA_REDONDA', 
 NULL, 
 'Mes 4: Mesa redonda - Old grads em diferentes fases.', 
 90, 4),

('Lives Mensais: Alternative Pathways Deep Dive', 
 'MODULO_6::RECURSOS_EXTRAS::LIVES::ALTERNATIVE_PATHWAYS', 
 NULL, 
 'Mes 5: Alternative pathways deep dive.', 
 90, 5),

('Lives Mensais: Revisao de CVs e PSs ao Vivo', 
 'MODULO_6::RECURSOS_EXTRAS::LIVES::REVISAO_CV_PS', 
 NULL, 
 'Mes 6: Revisao de CVs e PSs ao vivo (com permissao). Beneficio: interacao em tempo real, networking entre alunos.', 
 90, 6),

-- 6.2 Banco de Relatos - Por Specialty
('Banco de Relatos: Family Medicine', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::FAMILY_MEDICINE', 
 NULL, 
 'Video-library organizada. Historias reais de sucesso em Family Medicine. Formato: 15-30 min, background da pessoa, desafios especificos, estrategias que usaram, erros cometidos e licoes, conselhos praticos, Q&A.', 
 30, 7),

('Banco de Relatos: Internal Medicine', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::INTERNAL_MEDICINE', 
 NULL, 
 'Historias reais de sucesso em Internal Medicine.', 
 30, 8),

('Banco de Relatos: Psychiatry', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::PSYCHIATRY', 
 NULL, 
 'Historias reais de sucesso em Psychiatry.', 
 30, 9),

('Banco de Relatos: Anesthesiology', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::ANESTHESIOLOGY', 
 NULL, 
 'Historias reais de sucesso em Anesthesiology.', 
 30, 10),

('Banco de Relatos: Surgery', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::SURGERY', 
 NULL, 
 'Historias reais de sucesso em Surgery.', 
 30, 11),

('Banco de Relatos: Pediatrics', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::PEDIATRICS', 
 NULL, 
 'Historias reais de sucesso em Pediatrics.', 
 30, 12),

('Banco de Relatos: OBGYN', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::OBGYN', 
 NULL, 
 'Historias reais de sucesso em OBGYN.', 
 30, 13),

-- 6.2 Banco de Relatos - Por Challenge
('Banco de Relatos: Old Grads (10+ Anos Formado)', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::OLD_GRADS', 
 NULL, 
 'Historias de old grads com 10+ anos de formado.', 
 30, 14),

('Banco de Relatos: Conciliando Trabalho Full-Time', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::TRABALHO_FULLTIME', 
 NULL, 
 'Historias de quem conciliou trabalho full-time com estudos.', 
 30, 15),

('Banco de Relatos: Com Filhos Pequenos', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::COM_FILHOS', 
 NULL, 
 'Historias de quem conseguiu com filhos pequenos.', 
 30, 16),

('Banco de Relatos: Low Step Scores', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::LOW_SCORES', 
 NULL, 
 'Historias de quem matcheou mesmo com low Step scores.', 
 30, 17),

('Banco de Relatos: Unmatched para SOAP para Success', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::SOAP_SUCCESS', 
 NULL, 
 'Historias de quem nao matcheou, fez SOAP e conseguiu.', 
 30, 18),

('Banco de Relatos: Alternative Pathways', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::ALT_PATHWAYS', 
 NULL, 
 'Historias de quem usou alternative pathways.', 
 30, 19),

-- 6.2 Banco de Relatos - Por Fase
('Banco de Relatos: Como Passei no Step 1', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::PASSOU_STEP1', 
 NULL, 
 'Relatos de como diferentes pessoas passaram no Step 1.', 
 30, 20),

('Banco de Relatos: Como Tirei 250+ no Step 2 CK', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::STEP2_250', 
 NULL, 
 'Relatos de quem tirou 250+ no Step 2 CK.', 
 30, 21),

('Banco de Relatos: Como Consegui Meu Primeiro Observership', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::PRIMEIRO_OBSERVERSHIP', 
 NULL, 
 'Relatos de como conseguiram o primeiro observership.', 
 30, 22),

('Banco de Relatos: Como Foi Minha Primeira Entrevista', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::PRIMEIRA_ENTREVISTA', 
 NULL, 
 'Relatos de como foi a primeira entrevista.', 
 30, 23),

('Banco de Relatos: Match Day - Minha Experiencia', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::MATCH_DAY', 
 NULL, 
 'Relatos de experiencias no Match Day.', 
 30, 24),

('Banco de Relatos: Primeiro Ano de Residencia', 
 'MODULO_6::RECURSOS_EXTRAS::RELATOS::PRIMEIRO_ANO', 
 NULL, 
 'Relatos sobre o primeiro ano de residencia. Objetivo: inspiracao + aprendizado pratico.', 
 30, 25),

-- 6.3 Erros Mais Comuns - Série
('Erros Mais Comuns: Erros de Estudo', 
 'MODULO_6::RECURSOS_EXTRAS::ERROS::ESTUDO', 
 NULL, 
 'Videos rapidos (5-10 min). Fazer multiplos Q-Banks antes de terminar UWorld, assistir videos infinitos sem fazer questoes, nao usar Anki consistentemente, estudar passivamente, nao fazer NBMEs regularmente.', 
 10, 26),

('Erros Mais Comuns: Erros de Burocracia', 
 'MODULO_6::RECURSOS_EXTRAS::ERROS::BUROCRACIA', 
 NULL, 
 'Nao comecar PSV cedo suficiente, erros no ERAS application, perder deadlines, nao fazer waiver nas LORs.', 
 10, 27),

('Erros Mais Comuns: Erros de USCE', 
 'MODULO_6::RECURSOS_EXTRAS::ERROS::USCE', 
 NULL, 
 'Nao fazer follow-up apos observership, poor posture/attitude durante estagio, nao pedir LOR no timing certo.', 
 10, 28),

('Erros Mais Comuns: Erros de Application', 
 'MODULO_6::RECURSOS_EXTRAS::ERROS::APPLICATION', 
 NULL, 
 'Aplicar pra poucos programas, PS generico, typos no ERAS, overestimating chances.', 
 10, 29),

('Erros Mais Comuns: Erros de Interview', 
 'MODULO_6::RECURSOS_EXTRAS::ERROS::INTERVIEW', 
 NULL, 
 'Mal preparado tecnicamente, answers muito longos, nao fazer perguntas, negative attitude. Objetivo: aprender com erros comuns, evitar armadilhas.', 
 10, 30),

-- 6.4 Grupo de Estudos Virtual
('Grupo de Estudos Virtual: Accountability Partners', 
 'MODULO_6::RECURSOS_EXTRAS::GRUPO_ESTUDOS', 
 NULL, 
 'Plataforma de matching + check-ins semanais. Como funciona: alunos sao paired com accountability partners (similar timeline/goals), weekly check-ins (15-30 min), compartilhar progresso/challenges/wins, study sessions conjuntas (optional), suporte mutuo. Beneficio: comunidade, motivacao, nao se sentir sozinho.', 
 15, 31),

-- 6.5 Newsletter
('Atualizacoes Ward Academy - Newsletter Quinzenal', 
 'MODULO_6::RECURSOS_EXTRAS::NEWSLETTER', 
 NULL, 
 'Email newsletter + video curto (5-10 min). Conteudo: mudancas recentes no processo (USMLE/ECFMG updates, MyIntealth news, novas leis estaduais, match data e trends), novas oportunidades (programs accepting IMGs, research opportunities, observership programs, scholarships/grants), tips rapidos da Dra. Iria, highlight de aluno (small win da semana), upcoming events (lives, webinars). Objetivo: keep everyone updated, engaged.', 
 10, 32),

-- 6.6 Biblioteca de Recursos
('Biblioteca de Recursos: Templates', 
 'MODULO_6::RECURSOS_EXTRAS::BIBLIOTECA::TEMPLATES', 
 NULL, 
 'Repository organizado online. CV templates (3 versions), PS outlines, email templates (cold emails, follow-ups, thank you notes), LOR request templates.', 
 5, 33),

('Biblioteca de Recursos: Checklists', 
 'MODULO_6::RECURSOS_EXTRAS::BIBLIOTECA::CHECKLISTS', 
 NULL, 
 'Burocracia completa, dedicated period day-by-day, interview prep, ERAS application, pos-match.', 
 5, 34),

('Biblioteca de Recursos: Planilhas', 
 'MODULO_6::RECURSOS_EXTRAS::BIBLIOTECA::PLANILHAS', 
 NULL, 
 'Cronograma de estudos (customizavel), financial planning calculator, program tracking spreadsheet, NBME score tracker, ROL decision matrix.', 
 5, 35),

('Biblioteca de Recursos: PDFs', 
 'MODULO_6::RECURSOS_EXTRAS::BIBLIOTECA::PDFS', 
 NULL, 
 'High-yield summaries, test-taking strategies cheat sheet, SOAP preparation guide, alternative pathways guide.', 
 5, 36),

('Biblioteca de Recursos: Links Uteis', 
 'MODULO_6::RECURSOS_EXTRAS::BIBLIOTECA::LINKS', 
 NULL, 
 'FREIDA Online, Texas STAR, Residency Explorer, NRMP data, match statistics, fellowship databases. Objetivo: tudo em um lugar, facilmente acessivel.', 
 5, 37),

-- 6.7 Pergunte à Dra. Iria
('Pergunte a Dra. Iria - Q&A Assincrono', 
 'MODULO_6::RECURSOS_EXTRAS::QA_ASSINCRONO', 
 NULL, 
 'Plataforma de perguntas online. Como funciona: alunos postam perguntas na plataforma, Dra. Iria responde em video ou texto, outras pessoas veem respostas (FAQ construido naturalmente), upvote em perguntas (mais votadas respondidas primeiro), categorizacao automatica. Beneficio: suporte continuo, resposta a duvidas comuns beneficia todos.', 
 5, 38),

-- 6.8 Da Periferia ao Match
('Da Periferia ao Match: Historias Inspiradoras', 
 'MODULO_6::RECURSOS_EXTRAS::PERIFERIA::HISTORIAS', 
 NULL, 
 'Serie especial de videos. Objetivo: inspirar alunos de baixa renda, periferias, escola publica. Entrevistas com IMGs de backgrounds humildes que matchearam.', 
 30, 39),

('Da Periferia ao Match: Como Conseguir Materiais com Pouco Dinheiro', 
 'MODULO_6::RECURSOS_EXTRAS::PERIFERIA::MATERIAIS', 
 NULL, 
 'Materiais gratuitos, grupos de compartilhamento, scholarships e financial aid, part-time work durante prep.', 
 20, 40),

('Da Periferia ao Match: Superando o Impostor Syndrome', 
 'MODULO_6::RECURSOS_EXTRAS::PERIFERIA::IMPOSTOR_SYNDROME', 
 NULL, 
 'Mindset: superar impostor syndrome. Apoio emocional especifico. Community support dentro da Ward Academy. Inclui lista de resources para low-income IMGs.', 
 20, 41);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_video_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SIMPLE POLICIES (work without complex user table joins)
-- ============================================================================

-- Anyone can view published videos (no auth required)
CREATE POLICY "Anyone can view published videos" ON course_videos
    FOR SELECT USING (is_published = true);

-- Authenticated users can manage videos (you can restrict further in app logic)
-- For now, any logged-in user can manage - restrict in your app layer
CREATE POLICY "Authenticated users can manage videos" ON course_videos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON course_video_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON course_video_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own comments" ON course_video_comments
    FOR DELETE USING (true);

-- ============================================================================
-- OPTIONAL: If you want mentor-only video management, run this AFTER fixing
-- your users table structure. Replace the policy above with:
-- ============================================================================
-- 
-- DROP POLICY IF EXISTS "Authenticated users can manage videos" ON course_videos;
-- 
-- CREATE POLICY "Mentors can manage videos" ON course_videos
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM users
--             WHERE users.auth_id = auth.uid()  -- adjust column name as needed
--             AND users.role LIKE 'mentor_%'
--         )
--     );

-- ============================================================================
-- HELPER VIEWS FOR TAG NAVIGATION
-- ============================================================================

-- View to get unique top-level modules
CREATE OR REPLACE VIEW course_modules AS
SELECT DISTINCT 
    split_part(tags, '::', 1) as module_code,
    CASE split_part(tags, '::', 1)
        WHEN 'MODULO_0' THEN 'Início Absoluto - Do Zero ao Primeiro Passo'
        WHEN 'MODULO_1' THEN 'Entendendo o Processo'
        WHEN 'MODULO_2' THEN 'Burocracia Passo a Passo'
        WHEN 'MODULO_3' THEN 'Estratégias de Estudo'
        WHEN 'MODULO_4' THEN 'Currículo, Pesquisa e Estágios (USCE)'
        WHEN 'MODULO_5' THEN 'Match e Entrevistas'
        WHEN 'MODULO_6' THEN 'Recursos Extras e Comunidade'
        ELSE split_part(tags, '::', 1)
    END as module_name
FROM course_videos
WHERE is_published = true
ORDER BY module_code;

-- View to get submodules within each module
CREATE OR REPLACE VIEW course_submodules AS
SELECT DISTINCT 
    split_part(tags, '::', 1) as module_code,
    split_part(tags, '::', 2) as submodule_code,
    split_part(tags, '::', 1) || '::' || split_part(tags, '::', 2) as full_path
FROM course_videos
WHERE is_published = true
ORDER BY module_code, submodule_code;

-- ============================================================================
-- STATISTICS QUERY EXAMPLES
-- ============================================================================

-- Count videos per module
-- SELECT split_part(tags, '::', 1) as module, COUNT(*) as video_count
-- FROM course_videos
-- WHERE is_published = true
-- GROUP BY split_part(tags, '::', 1)
-- ORDER BY module;

-- Total course duration in hours
-- SELECT SUM(duration_minutes) / 60.0 as total_hours
-- FROM course_videos
-- WHERE is_published = true;

-- Search videos by tag pattern
-- SELECT title, tags, duration_minutes
-- FROM course_videos
-- WHERE tags LIKE '%STEP1%' AND is_published = true
-- ORDER BY order_position;
