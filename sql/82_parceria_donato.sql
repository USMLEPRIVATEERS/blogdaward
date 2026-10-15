-- =============================================
-- WARD ACADEMY - Parceria Dr. Andre Donato (fellow e via alternativa)
-- =============================================
-- Fluxo:
--   1. O Marcos libera o aluno para o Dr. Andre (users.donato_liberado).
--   2. No dashboard do aluno aparece o botao "Fellow e Alternate", que abre a
--      pagina com a explicacao e o formulario de pre-chamada.
--   3. O aluno preenche o formulario (donato_intake) e envia.
--   4. O Marcos revisa, confirma que esta tudo certo E que ja criou o acesso do
--      aluno ao curso Rota Medica na Hotmart. So depois disso o aluno ve o
--      botao do curso.
--   5. Antes de cada uma das duas chamadas com o Dr. Andre o aluno marca uma
--      previa com o Marcos. Feita a previa, libera o contato do Dr. Andre por
--      WhatsApp.
--
-- Seguro de rodar mais de uma vez.
-- =============================================

-- ---------------------------------------------------------------------------
-- 1. O papel do parceiro
-- ---------------------------------------------------------------------------
-- NAO e um papel 'mentor_%'. Em api/data/query.js a linha
--   const isAdmin = auth.role && auth.role.startsWith('mentor_')
-- transforma qualquer mentor em administrador: ele deixa de ser filtrado em
-- toda tabela com escopo por usuario e passa a escrever em `users`. O Dr. Andre
-- e parceiro externo e so pode enxergar os alunos que o Marcos liberou, entao
-- ganha um papel proprio, com o escopo aplicado no servidor.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN (
        'aluno',
        'assessoria',
        'externo',
        'mentor_marcos',
        'mentor_iria',
        'mentor_guilherme',
        'mentor_fernando',
        'parceiro_donato',
        'mentor',
        'admin'
    ));

-- ---------------------------------------------------------------------------
-- 2. A liberacao do aluno (mesmo padrao do fernando_interested)
-- ---------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS donato_liberado BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS donato_liberado_em TIMESTAMPTZ;

COMMENT ON COLUMN users.donato_liberado IS 'Marcos liberou este aluno para o Dr. Andre Donato';
COMMENT ON COLUMN users.donato_liberado_em IS 'Quando a liberacao foi marcada';

CREATE INDEX IF NOT EXISTS idx_users_donato_liberado ON users(donato_liberado)
    WHERE donato_liberado = TRUE;

-- ---------------------------------------------------------------------------
-- 3. O formulario de pre-chamada
-- ---------------------------------------------------------------------------
-- Uma linha por aluno. Os campos sao os que o proprio Dr. Andre pediu em 06/10
-- (especialidade, etapa do USMLE, observership, curriculo) mais o que a sessao
-- precisa para decidir rota. Nada de CPF, saude ou financeiro detalhado.
CREATE TABLE IF NOT EXISTS donato_intake (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Perfil
    especialidade TEXT,
    tem_rqe BOOLEAN,
    anos_residencia TEXT,
    anos_pratica TEXT,

    -- USMLE
    step1_status TEXT,       -- nao_comecou | estudando | agendado | aprovado | reprovado
    step1_nota TEXT,
    step2_status TEXT,
    step2_nota TEXT,
    step3_status TEXT,
    oet_status TEXT,
    ecfmg_certificado BOOLEAN,

    -- Experiencia nos EUA
    observership_feito BOOLEAN,
    observership_onde TEXT,
    contatos_eua TEXT,       -- o dado mais valioso da sessao
    producao_cientifica TEXT,
    cv_url TEXT,

    -- Visto
    visto_atual TEXT,        -- nenhum | b1b2 | j1 | h1b | o1 | green_card | outro
    negativa_visto BOOLEAN,
    negativa_visto_detalhe TEXT,

    -- Plano
    tempo_aceita_fellow TEXT,   -- ABR e ABA pedem ~4 anos
    janela TEXT,
    objetivo TEXT,
    orcamento_faixa TEXT,
    observacoes_aluno TEXT,

    -- Ciclo de vida
    enviado_em TIMESTAMPTZ,
    revisado_em TIMESTAMPTZ,
    revisado_por BIGINT REFERENCES users(id),
    curso_liberado_em TIMESTAMPTZ,
    observacoes_marcos TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donato_intake_user ON donato_intake(user_id);
CREATE INDEX IF NOT EXISTS idx_donato_intake_enviado ON donato_intake(enviado_em)
    WHERE enviado_em IS NOT NULL;

DROP TRIGGER IF EXISTS update_donato_intake_updated_at ON donato_intake;
CREATE TRIGGER update_donato_intake_updated_at
    BEFORE UPDATE ON donato_intake
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE donato_intake ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. A conta do Dr. Andre
-- ---------------------------------------------------------------------------
-- Rode este bloco DEPOIS de trocar o e-mail pelo definitivo. A senha e trocada
-- no primeiro acesso; o cadastro segue o mesmo caminho dos outros membros.
--
-- INSERT INTO users (email, password_hash, full_name, role, first_login_completed)
-- VALUES ('andrebdonato1@gmail.com', 'trocar-no-primeiro-acesso',
--         'Andre Donato', 'parceiro_donato', FALSE)
-- ON CONFLICT (email) DO UPDATE SET role = 'parceiro_donato';

-- ---------------------------------------------------------------------------
-- 5. Conferencia
-- ---------------------------------------------------------------------------
-- SELECT COUNT(*) FILTER (WHERE donato_liberado) AS liberados,
--        COUNT(*) AS alunos
--   FROM users WHERE role = 'aluno';
-- SELECT u.full_name, i.enviado_em, i.revisado_em, i.curso_liberado_em
--   FROM donato_intake i JOIN users u ON u.id = i.user_id ORDER BY i.enviado_em DESC;
