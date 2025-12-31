# 🎓 WARD ACADEMY - PROTÓTIPO DA PLATAFORMA

## 🎨 IDENTIDADE VISUAL
- **Cores:** Fundo Branco | Texto Preto | Detalhes Laranja Queimado (#C45700)
- **Estilo:** Minimalista, Profissional, Fácil Navegação

---

## 📱 ESTRUTURA DE NAVEGAÇÃO

### HEADER (Após Login)
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎓 WARD ACADEMY    [Dashboard] [Cronograma] [Links] [Blog]     │
│                    [Pesquisa] [Diário Estudos] [Diário UWorld] │
│                                         [👤 Perfil] [🚪 Sair]   │
└─────────────────────────────────────────────────────────────────┘
```
*Nota: Páginas "Diário Estudos" e "Diário UWorld" só aparecem se ativadas*

---

## 🔐 PÁGINA 1: LOGIN (index.html)

### Layout
```
┌────────────────────────────────────────────┐
│                                            │
│         🎓 WARD ACADEMY                    │
│                                            │
│    ┌──────────────────────────────┐       │
│    │  Email                       │       │
│    │  [___________________]       │       │
│    │                              │       │
│    │  Senha                       │       │
│    │  [___________________]       │       │
│    │                              │       │
│    │     [  ENTRAR  ]             │       │
│    └──────────────────────────────┘       │
│                                            │
└────────────────────────────────────────────┘
```

### Funcionalidades
- ✅ Validação de email e senha
- ✅ Detecta primeiro login → redireciona para questionário
- ✅ Login normal → redireciona para Dashboard

---

## 📋 PÁGINAS 2-10: QUESTIONÁRIO DE PRIMEIRO ACESSO

### Design Comum
- **Progress Bar no topo:** `[▓▓▓░░░░░░] 3/9`
- **Botões de navegação:** `[← Voltar] [Continuar Depois →] [Avançar →]`
- **Auto-save:** Salva automaticamente a cada resposta
- **Responsivo:** Máximo 3-4 campos por tela para evitar cansaço

---

### PÁGINA 2: DADOS BÁSICOS
```
╔═══════════════════════════════════════════════════╗
║  Seus Dados Profissionais                    1/9  ║
╚═══════════════════════════════════════════════════╝

Nome Completo*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Email* (confirmação)
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

CPF*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

ORCID (opcional - pode adicionar depois)
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Endereço Completo*
(compatível com Brasil, EUA, Europa, etc)
┌──────────────────────────────────────────────┐
│ Rua/Avenida                                  │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Número/Complemento                           │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Cidade                                       │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Estado/Província                             │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ CEP/Zip Code                                 │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ País                                         │
└──────────────────────────────────────────────┘

Data de Formatura em Medicina*
┌──────────────────────────────────────────────┐
│ [  /  /    ]                                 │
└──────────────────────────────────────────────┘

Faculdade de Medicina*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Instituição Atual em que Trabalha*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Especialidade Atual*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Especialidade Pretendida nos EUA*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

   [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 3: DADOS USMLE
```
╔═══════════════════════════════════════════════════╗
║  Seu Caminho no USMLE                        2/9  ║
╚═══════════════════════════════════════════════════╝

Qual caminho você pretende seguir?*
( ) USMLE Tradicional
( ) Alternate Pathway

Você possui visto americano?*
( ) Sim  → [Qual visto? _______________]
( ) Não

Em qual etapa do processo você está?*
☐ Ainda iniciando
☐ Step 1 concluído
☐ Step 2 CK concluído
☐ OET concluído
☐ Step 3 concluído
☐ Outro → [Especifique: _______________]

┌────────────────────────────────────────────────┐
│ Quando pretende fazer sua próxima prova?       │
│                                                │
│ Prova: [Step 1          ▼]                    │
│ Data prevista: [  /  /    ]                   │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ PLANEJAMENTO DE ESTUDOS                        │
│                                                │
│ First Pass                                     │
│ ├─────●─────────────────┤ 6 meses             │
│  1 mês              12 meses                   │
│                                                │
│ Second Pass                                    │
│ ├────●──────┤ 2 meses                         │
│  0        6 meses                              │
│                                                │
│ Dedicated                                      │
│ ├──●──┤ 1 mês                                 │
│  0   3 meses                                   │
└────────────────────────────────────────────────┘

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 4: PREPARAÇÃO UWORLD
```
╔═══════════════════════════════════════════════════╗
║  UWorld - Sua Preparação                     3/9  ║
╚═══════════════════════════════════════════════════╝

Você já comprou o UWorld?*
( ) Sim  ( ) Não

[Se SIM:]
Já ativou sua assinatura?*
( ) Sim  ( ) Não

[Se ATIVOU:]
┌────────────────────────────────────────────────┐
│ Quando vence? [  /  /    ]                    │
└────────────────────────────────────────────────┘

[Se NÃO ATIVOU:]
Quanto tempo de assinatura escolheu?*
( ) 6 meses
( ) 1 ano
( ) Outro → [________]

[Se ATIVOU - Continua:]
Quantas questões já fez?
┌──────────────────────────────────────────────┐
│ [_______] questões                           │
└──────────────────────────────────────────────┘

Qual sua porcentagem geral de acertos?
┌──────────────────────────────────────────────┐
│ [_______] %                                  │
└──────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 📊 DESEMPENHO POR SYSTEM (Opcional)            │
│                                                │
│ Menor %: [_____%] em [____________]            │
│ Maior %: [_____%] em [____________]            │
└────────────────────────────────────────────────┘

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 5: SYSTEMS E CATEGORIES CONCLUÍDOS
```
╔═══════════════════════════════════════════════════╗
║  UWorld - Progress Tracking                  4/9  ║
╚═══════════════════════════════════════════════════╝

Marque os Systems e Categories que já finalizou:

▼ Biochemistry (General Principles)
  ☐ Amino acids, proteins, and enzymes
  ☐ Bioenergetics and carbohydrate metabolism
  ☐ Cell and molecular biology
  ☐ Lipid metabolism
  ☐ Miscellaneous

▼ Genetics (General Principles)
  ☐ Clinical genetics
  ☐ DNA structure, replication, and repair
  ☐ Gene expression and regulation
  ☐ Protein synthesis
  ☐ RNA structure, synthesis, and processing
  ☐ Miscellaneous

▼ Cardiovascular System
  ☐ Aortic and peripheral artery diseases
  ☐ Cardiac arrhythmias
  ☐ Congenital heart disease
  ☐ Coronary heart disease
  ☐ Heart failure and shock
  ☐ Hypertension
  ☐ Myopericardial diseases
  ☐ Valvular heart diseases
  ☐ Cardiovascular drugs
  ☐ Miscellaneous

[... continua com todos os systems]

┌────────────────────────────────────────────────┐
│ 🆘 ÁREAS DE DIFICULDADE                        │
│ Marque com ⚠️ categories com mais dificuldade  │
│                                                │
│ [Para cada ⚠️ marcado:]                        │
│ O que achou mais difícil? (opcional)          │
│ ┌────────────────────────────────────────┐   │
│ │                                        │   │
│ └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 6: NÍVEL DE INGLÊS
```
╔═══════════════════════════════════════════════════╗
║  Avaliação do Inglês                         5/9  ║
╚═══════════════════════════════════════════════════╝

LEITURA E COMPREENSÃO*
( ) Consigo ler e entender as questões do UWorld sem problemas
( ) Preciso pesquisar palavras com frequência
( ) Estou traduzindo o UWorld
( ) Tenho muita dificuldade com leitura

ESCUTA E COMPREENSÃO*
( ) Consigo entender aulas do B&B e outros cursos normalmente
( ) Entendo parcialmente, preciso de legendas
( ) Não consigo entender bem escuta em inglês
( ) Tenho muita dificuldade com áudio

Comentários adicionais sobre seu inglês (opcional):
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 7: ANKI
```
╔═══════════════════════════════════════════════════╗
║  Uso do Anki                                 6/9  ║
╚═══════════════════════════════════════════════════╝

Já baixou o Anki?*
( ) Sim  ( ) Não

[Se SIM:]
Já usou o Anki?*
( ) Sim  ( ) Não

[Se USA:]
Usa o deck do AnKing?*
( ) Sim  ( ) Não  ( ) Não conheço

Com que frequência usa?*
( ) Todos os dias
( ) Dia sim, dia não
( ) Poucas vezes na semana
( ) Quase não tenho usado

Cria seus próprios flashcards?*
( ) Sim, crio meus próprios cards
( ) Não, uso apenas o AnKing
( ) Uso o AnKing e também crio alguns cards

Em quais dispositivos usa? (marque todos)*
☐ Computador (Windows/Linux)
☐ Mac
☐ iPhone
☐ Android
☐ Tablet
☐ iPad

Qual dispositivo usa COM MAIS FREQUÊNCIA?*
( ) Computador  ( ) Mac  ( ) iPhone  
( ) Android  ( ) Tablet  ( ) iPad

┌────────────────────────────────────────────────┐
│ Média de cards por dia: [_______]              │
│                                                │
│ Desde quando usa? [  /  /    ]                │
└────────────────────────────────────────────────┘

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 8: PESQUISA - PARTE 1
```
╔═══════════════════════════════════════════════════╗
║  Pesquisa Acadêmica                          7/9  ║
╚═══════════════════════════════════════════════════╝

[Se não preencheu antes, preencha agora:]
ORCID (obrigatório para publicações)
┌──────────────────────────────────────────────┐
│ 0000-0000-0000-0000                          │
└──────────────────────────────────────────────┘

Confirme seu endereço completo:
[Campos preenchidos anteriormente - editáveis]

Instituição afiliada atualmente*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Especialidade/Departamento*
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Experiência com pesquisa*
( ) Nenhuma experiência
( ) Já participei de projetos ainda não concluídos
( ) Já tive projetos apresentados em congresso
( ) Já tive publicações não indexadas no PubMed
( ) Tenho publicações indexadas no PubMed

Já participou de revisão sistemática?*
( ) Nunca participei
( ) Fiz algo pontual
( ) Fui primeiro autor
( ) Outro → [Especifique: _______________]

[Se PARTICIPOU:]
Status dessa revisão:*
( ) Publicada e indexada
( ) Publicada, não indexada
( ) Apresentada em congresso
( ) Ainda em produção
( ) Abandonada

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 9: PESQUISA - PARTE 2
```
╔═══════════════════════════════════════════════════╗
║  Seus Interesses em Pesquisa                 8/9  ║
╚═══════════════════════════════════════════════════╝

Liste 5 áreas/temas que te interessam em pesquisa:

1. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

2. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

3. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

4. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

5. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

Liste 3 instituições nos EUA que gostaria de trabalhar
ou fazer networking:

1. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

2. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

3. ┌────────────────────────────────────────────┐
   │                                            │
   └────────────────────────────────────────────┘

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 10: PESQUISA - PARTE 3
```
╔═══════════════════════════════════════════════════╗
║  Colaboração em Pesquisa                     9/9  ║
╚═══════════════════════════════════════════════════╝

Pretende realizar pesquisas na Ward Academy?*
( ) Sim, imediatamente
( ) Sim, mas depois do USMLE
( ) Não, já tenho pesquisas suficientes

Você poderia colaborar em quais etapas de uma
revisão sistemática dos outros membros?
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘

Você possui contatos para networking em pesquisa?*
( ) Sim  ( ) Não

[Se SIM:]
┌────────────────────────────────────────────────┐
│ Contato 1                                      │
│ Nome: [__________________]                     │
│ Especialidade: [__________________]            │
│ Instituição: [__________________]              │
│                         [+ Adicionar outro]    │
└────────────────────────────────────────────────┘

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 11: ESTÁGIOS MÉDICOS
```
╔═══════════════════════════════════════════════════╗
║  Experiência Clínica                        10/9  ║
╚═══════════════════════════════════════════════════╝

Durante a faculdade, fez clerkship nos EUA?*
( ) Sim  ( ) Não

Já fez observerships?*
( ) Sim  ( ) Não

[Se SIM:]
Quantos observerships já fez? [___]

┌────────────────────────────────────────────────┐
│ OBSERVERSHIP #1                                │
├────────────────────────────────────────────────┤
│ Instituição: [_____________________]           │
│ Ano: [____]                                    │
│ Especialidade: [_____________________]         │
│ Local:                                         │
│  ( ) Hospital  ( ) Clínica Privada             │
│ Custo aproximado: R$ [_________]               │
│ Conseguiu carta de recomendação?               │
│  ( ) Sim  ( ) Não                              │
│ Comentários:                                   │
│ ┌────────────────────────────────────────┐   │
│ │                                        │   │
│ └────────────────────────────────────────┘   │
│                                                │
│              [+ Adicionar outro]               │
└────────────────────────────────────────────────┘

PLANEJAMENTO FUTURO
Pretende fazer mais observerships?*
( ) Sim  ( ) Não

[Se SIM:]
Quantos pretende fazer? [___]

[Repete estrutura acima para planos futuros]

   [← Voltar]  [Continuar Depois →]  [Avançar →]
```

---

### PÁGINA 12: BACKGROUND PESSOAL
```
╔═══════════════════════════════════════════════════╗
║  Sua História                               11/9  ║
╚═══════════════════════════════════════════════════╝

Onde você mora atualmente?*
( ) Brasil
( ) Estados Unidos
( ) Outro → [País: _______________]

[Se BRASIL ou OUTRO:]
Conte um pouco sobre sua história:
(Vida, família, trabalho, o que te fez escolher USMLE)

┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘

Sua família está de acordo com o processo de
equivalência nos EUA?*
( ) Sim, totalmente de acordo
( ) Sim, com algumas ressalvas
( ) Ainda em discussão
( ) Não estão de acordo

[Se EUA:]
Como você foi para os EUA?
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Qual visto possui?
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Como conseguiu o visto?
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

Trabalha nos EUA atualmente?*
( ) Sim  ( ) Não

[Se SIM:]
Como conseguiu esse trabalho?
┌──────────────────────────────────────────────┐
│                                              │
└──────────────────────────────────────────────┘

   [← Voltar]  [🎉 FINALIZAR CADASTRO 🎉]
```

---

## 🏠 DASHBOARD PRINCIPAL (Aluno)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎓 WARD ACADEMY    [Dashboard] [Cronograma] [Links] [Blog]     │
│                    [Pesquisa]                                   │
│                                         [👤 Perfil] [🚪 Sair]   │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  Bem-vindo(a), [Nome do Aluno]! 👋                            ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────┐ ┌───────────────────────┐
│ 📝 STATUS DO QUESTIONÁRIO         │ │ 🎯 PREPARAÇÃO ATUAL   │
├───────────────────────────────────┤ ├───────────────────────┤
│ [████████░░] 80% concluído        │ │ Atualmente focando em:│
│                                   │ │                       │
│ [Continuar Questionário →]        │ │ ( ) Step 1            │
└───────────────────────────────────┘ │ ( ) Step 2 CK         │
                                      │ ( ) Step 3            │
┌───────────────────────────────────┐ │ ( ) OET               │
│ 🔐 SEGURANÇA                      │ │ ( ) Outro: [____]     │
├───────────────────────────────────┤ │                       │
│ [Trocar Senha]                    │ │ [Salvar]              │
└───────────────────────────────────┘ └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📬 RECADOS DOS MENTORES                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📌 Dra. Iria (há 2 dias):                                  │
│ "Parabéns por finalizar Cardiovascular! Vamos conversar    │
│  sobre Second Pass na próxima chamada."                     │
│  [✓ Marcar como lido]                                      │
│                                                             │
│ 📌 Marcos (há 5 dias):                                     │
│ "Seu protocolo foi aprovado! Próximo passo: exportar dos   │
│  databases."                                                │
│  [✓ Marcar como lido]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 ATIVAÇÕES OPCIONAIS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Toggle OFF] Diário de Estudos                             │
│            (Registre seu progresso diário - 250 chars)     │
│                                                             │
│ [Toggle OFF] Diário do UWorld                              │
│            (Acompanhe suas questões e performance)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎯 LANDMARKS - CHAMADAS E MARCOS                            │
├─────────────────────────────────────────────────────────────┤
│ [Ver Todos os Landmarks →]                                  │
│                                                             │
│ ✅ Entrada na Ward Academy (12/01/2025)                     │
│ ✅ 1ª Chamada - Dra. Iria (15/01/2025)                      │
│ ⏳ 1ª Chamada - Guilherme (Pendente)                        │
│ ⏳ 1ª Chamada - Marcos (Pendente)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🔗 ACESSO RÁPIDO                                            │
├─────────────────────────────────────────────────────────────┤
│ [📁 Repositório de Links]  [📅 Cronograma]                 │
│ [💬 Blog da Ward]  [🔬 Minhas Pesquisas]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 👤 PÁGINA: PERFIL DO ALUNO

```
╔═══════════════════════════════════════════════════════════════╗
║  Meu Perfil                                                   ║
╚═══════════════════════════════════════════════════════════════╝

[Tabs de navegação:]
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ 📋 Dados│ 🎓 USMLE│ 📚 Prep │ 🔬 Pesq │ 🏥 Estág│
│  Básicos│         │         │   uisa  │  ios    │
└─────────┴─────────┴─────────┴─────────┴─────────┘

[TAB ATIVO: DADOS BÁSICOS]
┌─────────────────────────────────────────────────────────────┐
│ DADOS PESSOAIS E PROFISSIONAIS                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nome Completo:                                              │
│ ┌─────────────────────────────────────────────┐            │
│ │ [Nome editável]                             │  [Editar]  │
│ └─────────────────────────────────────────────┘            │
│                                                             │
│ Email:                                                      │
│ ┌─────────────────────────────────────────────┐            │
│ │ [email@exemplo.com]                         │  [Editar]  │
│ └─────────────────────────────────────────────┘            │
│                                                             │
│ [... todos os campos preenchidos no questionário ...]      │
│                                                             │
│                     [💾 Salvar Alterações]                  │
└─────────────────────────────────────────────────────────────┘

[Todas as abas permitem edição dos dados respectivos]
```

---

## 🎯 PÁGINA: LANDMARKS

```
╔═══════════════════════════════════════════════════════════════╗
║  Landmarks - Marcos e Chamadas                                ║
╚═══════════════════════════════════════════════════════════════╝

[Legenda:]
✅ Concluído | ⏳ Pendente | ⚠️ Urgente | 📝 Com Observações

┌─────────────────────────────────────────────────────────────┐
│ ENTRADA E SETUP INICIAL                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Entrada na Ward Academy                                  │
│    Data: 12/01/2025                                         │
│    [📝 Ver observações]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ PRIMEIRA RODADA DE CHAMADAS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️ 1ª Chamada - Dra. Iria: Background e USMLE               │
│    Status: ⏳ Pendente                                      │
│    [📝 Adicionar obs] [📅 Agendar] [⚠️ Marcar urgência]    │
│    [✓ Marcar como concluída]                               │
│    Observações dos mentores:                                │
│    • Nenhuma ainda                                          │
│                                                             │
│ ⏳ 1ª Chamada - Guilherme: Configurando Anki                │
│    Status: ⏳ Pendente                                      │
│    [📝 Adicionar obs] [📅 Agendar] [⚠️ Marcar urgência]    │
│    [✓ Marcar como concluída]                               │
│                                                             │
│ ⏳ 1ª Chamada - Marcos: Organizando próximos passos         │
│    Status: ⏳ Pendente                                      │
│    [📝 Adicionar obs] [📅 Agendar] [⚠️ Marcar urgência]    │
│    [✓ Marcar como concluída]                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ SEGUNDA RODADA DE CHAMADAS                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⏳ 2ª Chamada - Dra. Iria: Como usar o UWorld               │
│    [Mesma estrutura...]                                     │
│                                                             │
│ ⏳ 2ª Chamada - Marcos: Conversa sobre pesquisa             │
│    [VISÍVEL APENAS SE: Marcou interesse em pesquisa]       │
│    [Mesma estrutura...]                                     │
│                                                             │
│ ⏳ 2ª Chamada - Guilherme: Uso do Anki nas últimas semanas  │
│    [Mesma estrutura...]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ CHAMADAS POR SYSTEM CONCLUÍDO                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [+ Adicionar chamada de System concluído]                   │
│    → Abre modal para selecionar qual System                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ CHAMADAS DE PESQUISA (Condicional)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⏳ 3ª Chamada - Marcos: Usar databases corretamente         │
│ ⏳ 4ª Chamada - Marcos: Validando ideia de revisão          │
│ ⏳ 5ª Chamada - Marcos: Triagem por título e resumo         │
│ ⏳ 6ª Chamada - Marcos: Triagem por manuscritos completos   │
│ ⏳ 7ª Chamada - Marcos: Extração de dados                   │
│ ⏳ 8ª Chamada - Marcos: Risco de viés                       │
│ ⏳ 9ª Chamada - Marcos: Escrita científica                  │
│ ⏳ 10ª Chamada - Marcos: Submissão do manuscrito            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FASE DE SECOND PASS E SIMULADOS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⏳ Chamada - Dra. Iria: Second Pass                         │
│ ⏳ Chamada - Dra. Iria: Simulados (NBMEs)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FASE DEDICATED E PROVA                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⏳ Chamada - Dra. Iria: Dedicated                           │
│ ⏳ Chamada - Dra. Iria: Agendar a prova                     │
│ ⏳ Chamada - Dra. Iria: Pré-prova                           │
│ ⏳ Chamada - Dra. Iria: Pós-prova                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CHAMADAS EXTRAS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [+ Adicionar chamada extra com Dra. Iria]                   │
│ [+ Adicionar chamada extra com Marcos]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[FUNCIONALIDADES DE DRAG AND DROP]
• Aluno pode arrastar landmarks para reorganizar ordem
• Mentores também podem reorganizar
• Ambos podem adicionar observações
• Ambos podem editar tema da chamada
• Ambos podem marcar urgência
```

---

## 📅 PÁGINA: CRONOGRAMA

```
╔═══════════════════════════════════════════════════════════════╗
║  Cronograma de Estudos                                        ║
╚═══════════════════════════════════════════════════════════════╝

[Barra de ações:]
┌─────────────────────────────────────────────────────────────┐
│ [⚠️ Sinalizar Atraso]  [📊 Ver Progresso]  [📥 Exportar]   │
└─────────────────────────────────────────────────────────────┘

[Mensagem se MENTOR não colou cronograma ainda:]
┌─────────────────────────────────────────────────────────────┐
│ ⏳ Seu cronograma está sendo preparado pelos mentores...    │
│    Aguarde a atualização em breve!                          │
└─────────────────────────────────────────────────────────────┘

[Quando CRONOGRAMA foi colado:]
┌─────────────────────────────────────────────────────────────┐
│ CRONOGRAMA DE FIRST PASS                                    │
│ Última atualização: 15/01/2025 por Marcos Vilela           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ System          Category              Questões   Terminei  │
│ ────────────────────────────────────────────────────────── │
│ Biochemistry    Amino acids...        45        [☐]        │
│ Biochemistry    Bioenergetics...      38        [☐]        │
│ Biochemistry    Cell biology...       52        [☐]        │
│ Genetics        Clinical genetics     28        [☐]        │
│ Genetics        DNA structure...      35        [☐]        │
│ Cardiovascular  Arrhythmias          56        [☐]        │
│ Cardiovascular  Heart failure...      42        [☐]        │
│ ...                                                         │
│                                                             │
│ ══════════════════════════════════════════════════          │
│ Progresso Total: [████████░░] 8/150 categories (5%)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[Ao clicar em "Sinalizar Atraso":]
┌────────────────────────────────────────┐
│ ⚠️ SINALIZAR ATRASO                    │
├────────────────────────────────────────┤
│                                        │
│ Início do atraso: [  /  /    ]        │
│ Fim do atraso: [  /  /    ]           │
│                                        │
│ Motivo (opcional):                     │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│    [Cancelar]  [Sinalizar]            │
└────────────────────────────────────────┘

[VISÍVEL PARA MENTORES: Histórico de atrasos]
[MENTOR PODE: Editar cronograma | Colar nova planilha]
```

---

## 🔗 PÁGINA: REPOSITÓRIO DE LINKS

```
╔═══════════════════════════════════════════════════════════════╗
║  Repositório de Links                                         ║
╚═══════════════════════════════════════════════════════════════╝

[Barra de ações:]
┌─────────────────────────────────────────────────────────────┐
│ [+ Adicionar Link]    [🔍 Buscar: ________________]         │
│                                                             │
│ Filtros:                                                    │
│ [Todos ▼] [Step 1] [Step 2 CK] [Step 3] [OET] [Pesquisa]  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📌 LINKS - STEP 1                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔗 First Aid 2025 Updates                                  │
│    https://example.com/fa2025                              │
│    Atualizações importantes do FA 2025                     │
│    Adicionado por: Dra. Iria (12/01/2025)                  │
│    [✏️ Editar] [🗑️ Deletar]                                │
│                                                             │
│ 🔗 Cardiovascular Study Guide                              │
│    https://example.com/cardio                              │
│    Guia completo de estudo para cardio                     │
│    Adicionado por: Marcos (10/01/2025)                     │
│    [✏️ Editar] [🗑️ Deletar]                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📌 LINKS - PESQUISA                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔗 PubMed Advanced Search                                   │
│    https://pubmed.ncbi.nlm.nih.gov/advanced                │
│    Tutorial de busca avançada no PubMed                    │
│    Adicionado por: Marcos (05/01/2025)                     │
│    [✏️ Editar] [🗑️ Deletar]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[Ao clicar "+ Adicionar Link":]
┌────────────────────────────────────────┐
│ ADICIONAR NOVO LINK                    │
├────────────────────────────────────────┤
│                                        │
│ Título*:                               │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ URL*:                                  │
│ ┌────────────────────────────────┐   │
│ │ https://                       │   │
│ └────────────────────────────────┘   │
│                                        │
│ Descrição*:                            │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ Categoria*:                            │
│ ( ) Step 1                             │
│ ( ) Step 2 CK                          │
│ ( ) Step 3                             │
│ ( ) OET                                │
│ ( ) Pesquisa                           │
│                                        │
│    [Cancelar]  [Salvar]                │
└────────────────────────────────────────┘
```

---

## 💬 PÁGINA: BLOG DA WARD

```
╔═══════════════════════════════════════════════════════════════╗
║  Blog da Ward Academy                                         ║
╚═══════════════════════════════════════════════════════════════╝

[Barra de ações:]
┌─────────────────────────────────────────────────────────────┐
│ [✍️ Novo Post]                                               │
│ Filtros: [Mais recentes ▼] [Mais curtidos] [Pinados]       │
└─────────────────────────────────────────────────────────────┘

[POSTS:]
┌─────────────────────────────────────────────────────────────┐
│ 📌 PINADO (até 15/02/2025)                                  │
│                                                             │
│ 👨‍⚕️ Dra. Iria da Costa (Mentora)                            │
│    há 3 dias                                                │
│                                                             │
│ Pessoal, lembrete importante sobre o uso do Anki: não      │
│ deixem os cards acumularem! É melhor fazer 100 cards por   │
│ dia consistentemente do que tentar recuperar 500 cards de  │
│ uma vez. Mantenham a disciplina! 💪                         │
│                                                             │
│ [👍 45 likes] [👎 0 dislikes] [💬 12 comentários]           │
│                                                             │
│ [Mentor pode: 📌 Despinar | 🗑️ Deletar post]               │
│                                                             │
│ ┌─── Comentários ────────────────────────────────────────┐ │
│ │ Mayara Alencar (há 2 dias):                            │ │
│ │ Obrigada pelo lembrete! Estava acumulando mesmo...     │ │
│ │ [👍 5] [💬 Responder]                                  │ │
│ │                                                        │ │
│ │ Guilherme Lavor (Mentor, há 2 dias):                  │ │
│ │ Exatamente! Repetição espaçada só funciona com        │ │
│ │ consistência. Qualquer dúvida sobre configuração do   │ │
│ │ Anki, me chamem! 📚                                    │ │
│ │ [👍 8] [💬 Responder]                                  │ │
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👤 Letícia Andrigheto                                        │
│    há 1 dia                                                  │
│                                                             │
│ Acabei de terminar o block de Cardiovascular! Foram 450    │
│ questões e 68% de acertos. Alguém tem dicas pra melhorar   │
│ na área de arrhythmias? 📊                                  │
│                                                             │
│ [👍 23 likes] [👎 0 dislikes] [💬 8 comentários]            │
│ [✏️ Editar] [🗑️ Deletar]                                   │
│                                                             │
│ ┌─── Comentários ────────────────────────────────────────┐ │
│ │ [Ver comentários...]                                   │ │
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

[Ao clicar "Novo Post":]
┌────────────────────────────────────────┐
│ ✍️ CRIAR POST                          │
├────────────────────────────────────────┤
│                                        │
│ [ALUNO: limite 250 caracteres]        │
│ [MENTOR: sem limite]                   │
│                                        │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │                                │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ Caracteres: 0/250                      │
│                                        │
│    [Cancelar]  [Publicar]              │
└────────────────────────────────────────┘

[MENTORES têm opções extras:]
• 📌 Pinar por: [1 semana | 1 mês | Permanente]
• 🗑️ Deletar qualquer post
• 💬 Sem limite de caracteres
```

---

## 🔬 PÁGINA: PESQUISAS

```
╔═══════════════════════════════════════════════════════════════╗
║  Minhas Pesquisas                                             ║
╚═══════════════════════════════════════════════════════════════╝

[Barra de ações:]
┌─────────────────────────────────────────────────────────────┐
│ [+ Nova Pesquisa]                                            │
│ Filtros: [Todas] [Em andamento] [Concluídas] [Pausadas]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 PESQUISA #1                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Tipo: ⚖️ Double Arm Meta-Analysis                           │
│                                                             │
│ HELIUM PLASMA RADIOFREQUENCY-ASSISTED LIPOABDOMINOPLASTY    │
│ VERSUS TRADITIONAL LIPOABDOMINOPLASTY FOR AESTHETIC        │
│ SURGERY PATIENTS                                            │
│                                                             │
│ Etapa atual: 📝 Extração de dados                          │
│ Deadline: 🚨 15/12/2025 (14 dias restantes!)               │
│                                                             │
│ 🔗 Google Drive: [Acessar pasta →]                         │
│                                                             │
│ 👥 Coautores:                                               │
│    • Marcos Vilela (Coordenador)                           │
│    • Brenda Feres                                          │
│    • Bruno Nocrato Loiola                                  │
│    • Eduardo Ximenes                                       │
│    [+ Adicionar coautor]                                   │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                             │
│ 📋 ETAPAS CONCLUÍDAS:                                       │
│                                                             │
│ ✅ Nova tarefa → Marcos Vilela                              │
│ ✅ Testando ideia → Marcos Vilela, Brenda Feres            │
│ ✅ Encontrando estudos → Marcos Vilela                      │
│ ✅ Estratégia de busca → Marcos Vilela                      │
│ ✅ Validando ideia → Marcos Vilela, Eduardo Ximenes        │
│ ✅ Escrever protocolo → Marcos Vilela, Brenda Feres        │
│ ✅ Exportar de databases → Marcos Vilela                    │
│ ✅ Desduplicar → Marcos Vilela                              │
│ ✅ Revisores 1 e 2 → Brenda Feres, Bruno Nocrato           │
│ ✅ Revisor 3 → Eduardo Ximenes                              │
│ ✅ Baixando PDFs → Marcos Vilela                            │
│ ✅ Leitura completa → Brenda Feres, Bruno Nocrato          │
│ ✅ PRISMA Flow Diagram → Marcos Vilela                      │
│ ✅ Tabela PICO → Marcos Vilela                              │
│ ⏳ Extração de dados → [EM ANDAMENTO]                       │
│ ⬜ Análise estatística padrão                               │
│ ⬜ Análises estatísticas adicionais                         │
│ ⬜ Risco de viés revisores 1 e 2                            │
│ ⬜ Risco de viés revisor 3                                  │
│ ⬜ Gráficos de desfechos                                    │
│ ⬜ Gráficos de vieses                                       │
│ ⬜ GRADE                                                    │
│ ⬜ Submeter ao PROSPERO                                     │
│ ⬜ Escrever Abstract                                        │
│ ⬜ Submeter para congresso                                  │
│ ⬜ Escrever Introduction                                    │
│ ⬜ Escrever Methods                                         │
│ ⬜ Escrever Results                                         │
│ ⬜ Escrever Discussion                                      │
│ ⬜ Escrever Conclusion                                      │
│ ⬜ Escrever Limitations                                     │
│ ⬜ Escrever References                                      │
│ ⬜ Encontrar revistas                                       │
│ ⬜ Escrever Cover Letter                                    │
│ ⬜ Submeter para revista                                    │
│ ⬜ Responder revisores                                      │
│ ⬜ Escrever Rebuttal Letter                                 │
│ ⬜ Últimos ajustes                                          │
│ ⬜ Tarefa concluída                                         │
│                                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                             │
│ 💬 COMENTÁRIOS (editável por mentores e aluno):            │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Próximos passos:                                    │   │
│ │ - Terminar extração até 01/12                       │   │
│ │ - Brenda e Bruno fazem análise estatística          │   │
│ │ - Deadline congresso: 15/12/2025                    │   │
│ │                                                     │   │
│ │ Atualização 25/11: Encontramos 3 estudos a mais    │   │
│ │ que precisam ser incluídos.                         │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [✏️ Editar] [🗑️ Deletar] [📊 Ver Progresso]               │
└─────────────────────────────────────────────────────────────┘

[Ao clicar "+ Nova Pesquisa":]
┌────────────────────────────────────────────────────────────┐
│ ADICIONAR NOVA REVISÃO SISTEMÁTICA                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Tipo de meta-análise*:                                     │
│ ( ) Single Arm                                             │
│ ( ) Double Arm                                             │
│ ( ) Network Meta-Analysis                                  │
│ ( ) Sem meta-análise (apenas revisão sistemática)         │
│                                                            │
│ [Se DOUBLE ARM:]                                           │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ INTERVENTION (maiúsculas):                           │ │
│ │ [_______________________________]                    │ │
│ │                                                      │ │
│ │ VERSUS                                               │ │
│ │                                                      │ │
│ │ COMPARISON (maiúsculas):                             │ │
│ │ [_______________________________]                    │ │
│ │                                                      │ │
│ │ FOR                                                  │ │
│ │                                                      │ │
│ │ POPULATION (maiúsculas):                             │ │
│ │ [_______________________________]                    │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ [Se SINGLE ARM:]                                           │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ INTERVENTION (maiúsculas):                           │ │
│ │ [_______________________________]                    │ │
│ │                                                      │ │
│ │ FOR                                                  │ │
│ │                                                      │ │
│ │ POPULATION (maiúsculas):                             │ │
│ │ [_______________________________]                    │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ [Se NETWORK:]                                              │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ INTERVENTIONS (separar com vírgula, maiúsculas):    │ │
│ │ [_______________________________]                    │ │
│ │                                                      │ │
│ │ FOR                                                  │ │
│ │                                                      │ │
│ │ POPULATION (maiúsculas):                             │ │
│ │ [_______________________________]                    │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ Etapa atual*:                                              │
│ [Selecione ▼]                                              │
│                                                            │
│ Deadline*:                                                 │
│ [  /  /    ]                                               │
│                                                            │
│ Link Google Drive*:                                        │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ https://drive.google.com/...                         │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ Comentários iniciais (opcional):                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│    [Cancelar]  [Criar Pesquisa]                           │
└────────────────────────────────────────────────────────────┘

[MENTORES podem:]
• Ver TODAS as pesquisas de todos os alunos
• Adicionar coautores a qualquer pesquisa (abre modal com lista
  de todos os alunos cadastrados)
• Editar qualquer campo
• Marcar etapas como concluídas e adicionar nomes dos autores
```

---

## 📖 PÁGINA: DIÁRIO DE ESTUDOS

*Visível apenas se ativado no Dashboard*

```
╔═══════════════════════════════════════════════════════════════╗
║  Diário de Estudos                                            ║
╚═══════════════════════════════════════════════════════════════╝

[Barra de ações:]
┌─────────────────────────────────────────────────────────────┐
│ [+ Nova Entrada]                                             │
│ Filtros: [Últimos 7 dias] [Últimos 30 dias] [Tudo]         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📅 Quarta, 29/11/2025                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Hoje finalizei o block de Cardiovascular - Arrhythmias.    │
│ Foram 56 questões, 63% de acertos. Preciso revisar os      │
│ tipos de bloqueios AV.                                      │
│                                                             │
│ [✏️ Editar] [🗑️ Remover]                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📅 Terça, 28/11/2025                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Revisei todos os flashcards de Biochem metabolism. 450     │
│ cards, levou 2h30min. Amanhã foco em cardio!               │
│                                                             │
│ [✏️ Editar] [🗑️ Remover]                                   │
└─────────────────────────────────────────────────────────────┘

[Ao clicar "+ Nova Entrada":]
┌────────────────────────────────────────┐
│ NOVA ENTRADA NO DIÁRIO                 │
├────────────────────────────────────────┤
│                                        │
│ Data: [29/11/2025]                     │
│                                        │
│ O que você fez hoje? (250 chars):     │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │                                │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ Caracteres: 0/250                      │
│                                        │
│    [Cancelar]  [Salvar]                │
└────────────────────────────────────────┘
```

---

## 📊 PÁGINA: DIÁRIO DO UWORLD

*Visível apenas se ativado no Dashboard*

```
╔═══════════════════════════════════════════════════════════════╗
║  Diário do UWorld                                             ║
╚═══════════════════════════════════════════════════════════════╝

[Barra de ações:]
┌─────────────────────────────────────────────────────────────┐
│ [+ Nova Sessão]                                              │
│ [📊 Ver Estatísticas]                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 ESTATÍSTICAS GERAIS                                       │
├─────────────────────────────────────────────────────────────┤
│ Total de questões: 1,247                                    │
│ Acertos médios: 68%                                         │
│ Tempo médio por questão: 1min 45s                           │
│ Melhor system: Genetics (78%)                               │
│ System para revisar: Pharmacology (58%)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📅 Quarta, 29/11/2025                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Questões: 56                                                │
│ Acertos: 35/56 (63%)                                        │
│ Tempo total: 1h 38min                                       │
│ System: Cardiovascular                                      │
│ Category: Cardiac arrhythmias                               │
│                                                             │
│ Dificuldades encontradas:                                   │
│ "Tive problemas com os diferentes tipos de bloqueios AV,   │
│ especialmente diferenciando Mobitz I de Mobitz II. Preciso │
│ revisar os ECGs."                                           │
│                                                             │
│ [✏️ Editar] [🗑️ Remover]                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📅 Terça, 28/11/2025                                         │
├─────────────────────────────────────────────────────────────┤
│ Questões: 44                                                │
│ Acertos: 32/44 (73%)                                        │
│ Tempo total: 1h 15min                                       │
│ System: Biochemistry                                        │
│ Category: Bioenergetics and carbohydrate metabolism         │
│                                                             │
│ Dificuldades encontradas:                                   │
│ "Ciclo de Krebs foi tranquilo, mas errei algumas sobre     │
│ gliconeogênese."                                            │
│                                                             │
│ [✏️ Editar] [🗑️ Remover]                                   │
└─────────────────────────────────────────────────────────────┘

[Ao clicar "+ Nova Sessão":]
┌────────────────────────────────────────┐
│ REGISTRAR SESSÃO DO UWORLD             │
├────────────────────────────────────────┤
│                                        │
│ Data: [29/11/2025]                     │
│                                        │
│ Quantas questões? [____]              │
│                                        │
│ Quantas acertou? [____]               │
│                                        │
│ Tempo total: [__h __min]              │
│                                        │
│ System e Category:                     │
│ ┌────────────────────────────────┐   │
│ │ Ex: Cardiovascular - Arrhythmias│ │
│ └────────────────────────────────┘   │
│                                        │
│ Dificuldades (250 chars):             │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│    [Cancelar]  [Salvar]                │
└────────────────────────────────────────┘
```

---

## 👥 MODAL: CHECK-IN DIÁRIO

*Aparece ao abrir a plataforma APÓS completar questionário*

```
┌──────────────────────────────────────────────┐
│  🎓 Como tem sido sua preparação?            │
├──────────────────────────────────────────────┤
│                                              │
│  Conte-nos sobre os últimos dias:            │
│  ┌────────────────────────────────────────┐ │
│  │                                        │ │
│  │                                        │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Ou selecione:                               │
│  ( ) 😊 Tudo tranquilo!                      │
│  ( ) 🆘 Preciso de ajuda                     │
│  ( ) ⏸️ Estou parado no momento              │
│                                              │
│  [Pular]  [Enviar]  [×]                     │
└──────────────────────────────────────────────┘
```

---

# 🧑‍💼 PERFIS DOS MENTORES

---

## 👨‍💻 PERFIL: MARCOS VILELA (TI/Administrador)

**Email:** marcosantoniodv@gmail.com  
**Senha:** Luna11anos

```
╔═══════════════════════════════════════════════════════════════╗
║  Painel de Administração - Marcos Vilela                      ║
╚═══════════════════════════════════════════════════════════════╝

[Header especial para Marcos:]
┌─────────────────────────────────────────────────────────────┐
│ 🎓 WARD ACADEMY - ADMIN                                      │
│ [Dashboard] [Cronograma] [Links] [Blog] [Pesquisa]         │
│ [👥 Gerenciar Membros] [⚙️ Configurações]                   │
│                                         [👤 Perfil] [🚪Sair] │
└─────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  Dashboard do Administrador                                   ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ 📊 ESTATÍSTICAS GERAIS                                       │
├─────────────────────────────────────────────────────────────┤
│ Total de membros ativos: 25                                 │
│ Pesquisas em andamento: 12                                  │
│ Chamadas pendentes: 38                                      │
│ Posts no blog esta semana: 15                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👥 GERENCIAMENTO DE MEMBROS                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [+ Adicionar Novo Membro]  [🔍 Buscar: _______________]    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Nome              Email              Status   Ações  │   │
│ │ ─────────────────────────────────────────────────── │   │
│ │ Mayara Alencar   mayaa@...  ✅Ativo [✏️][👁️][🗑️] │   │
│ │ Letícia A.       letici@... ✅Ativo [✏️][👁️][🗑️] │   │
│ │ Larissa Campos   larir@...  ✅Ativo [✏️][👁️][🗑️] │   │
│ │ ...                                                 │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [✏️ Editar perfil completo]                                 │
│ [👁️ Ver como mentor]                                       │
│ [🗑️ Remover membro]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[Ao clicar "+ Adicionar Novo Membro":]
┌────────────────────────────────────────┐
│ CADASTRAR NOVO MEMBRO                  │
├────────────────────────────────────────┤
│                                        │
│ Nome completo*:                        │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ Email*:                                │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ Senha temporária*:                     │
│ ┌────────────────────────────────┐   │
│ │                                │   │
│ └────────────────────────────────┘   │
│                                        │
│ Tipo de conta:                         │
│ ( ) Aluno                              │
│ ( ) Mentor                             │
│                                        │
│    [Cancelar]  [Cadastrar]             │
└────────────────────────────────────────┘

[Ao clicar "✏️ Editar" em um membro:]
• Abre TODOS os dados do perfil desse membro
• Marcos pode editar QUALQUER campo
• Marcos pode ver e trocar a senha
• Marcos pode preencher questionários pelo aluno
• Marcos pode editar Landmarks
• Marcos pode COLAR CRONOGRAMAS (via Excel, tab-separated)

┌─────────────────────────────────────────────────────────────┐
│ 📅 COLAR CRONOGRAMA                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Selecione o aluno:                                          │
│ [Mayara Alencar ▼]                                          │
│                                                             │
│ Cole o cronograma do Excel (separado por TAB):             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ System   Category              Questões   Terminei  │   │
│ │ Biochem  Amino acids           45         FALSE     │   │
│ │ Biochem  Bioenergetics         38         FALSE     │   │
│ │ ...                                                 │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│    [Cancelar]  [Salvar Cronograma]                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🔬 PESQUISAS - VISÃO COMPLETA                                │
├─────────────────────────────────────────────────────────────┤
│ • Ver TODAS as pesquisas                                    │
│ • Adicionar/editar qualquer pesquisa                        │
│ • Adicionar coautores                                       │
│ • Marcar etapas concluídas                                  │
│ • Editar comentários                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 💬 BLOG & LINKS                                              │
├─────────────────────────────────────────────────────────────┤
│ • Fazer postagens (sem limite de caracteres)                │
│ • Adicionar links ao repositório                            │
│ • Moderar/deletar posts                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 👩‍⚕️ PERFIL: DRA. IRIA DA COSTA

```
╔═══════════════════════════════════════════════════════════════╗
║  Dashboard - Dra. Iria da Costa                               ║
╚═══════════════════════════════════════════════════════════════╝

[Design MUITO SIMPLES e VISUALMENTE AMIGÁVEL]

┌─────────────────────────────────────────────────────────────┐
│ 🎓 WARD ACADEMY                                              │
│ [🏠 Início] [👥 Alunos] [💬 Blog] [🔗 Links]                │
│                                         [👤 Perfil] [🚪Sair] │
└─────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  Bem-vinda, Dra. Iria! 👋                                     ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ ⚠️ CHAMADAS URGENTES (3)                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🚨 Mayara Alencar                                           │
│    → 2ª Chamada - Como usar UWorld (marcado há 3 dias)     │
│    [Ver perfil →]                                           │
│                                                             │
│ 🚨 Letícia Andrigheto                                        │
│    → 4ª Chamada - Desempenho Blocão (marcado há 5 dias)    │
│    [Ver perfil →]                                           │
│                                                             │
│ 🚨 Larissa Campos                                            │
│    → 3ª Chamada - Primeiras semanas (marcado há 2 dias)    │
│    [Ver perfil →]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📅 PRÓXIMAS CHAMADAS PENDENTES (8)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Guilherme Lavor → 1ª Chamada - Background e USMLE          │
│ Sean Robinson → 2ª Chamada - Como usar UWorld              │
│ Bruna Cnobrega → 1ª Chamada - Background e USMLE           │
│ Eduardo Medeiros → Chamada System: Cardiovascular          │
│ Dayane Silva → 3ª Chamada - Primeiras semanas              │
│ ...                                                         │
│                                                             │
│ [Ver todas as chamadas →]                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📰 LINHA DO TEMPO - ATUALIZAÇÕES DOS ALUNOS                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📅 Hoje, 10:23                                              │
│ 👤 Mayara Alencar                                            │
│    Diário de Estudos:                                       │
│    "Finalizei Cardiovascular - Arrhythmias! 63% de         │
│    acertos, vou revisar bloqueios AV."                      │
│    [Ver perfil completo →]                                  │
│                                                             │
│ 📅 Hoje, 09:15                                              │
│ 👤 Guilherme Lavor                                           │
│    Check-in:                                                │
│    "😊 Tudo tranquilo! Estou mantendo 400 cards/dia no     │
│    Anki."                                                   │
│    [Ver perfil completo →]                                  │
│                                                             │
│ 📅 Ontem, 18:42                                             │
│ 👤 Letícia Andrigheto                                        │
│    Diário UWorld:                                           │
│    "44 questões de Biochemistry, 73% acertos. Glico-       │
│    neogênese ainda confusa."                                │
│    [Ver perfil completo →]                                  │
│                                                             │
│ 📅 Ontem, 16:30                                             │
│ 👤 Sean Robinson                                             │
│    Cronograma:                                              │
│    ⚠️ Sinalizou atraso de 3 dias (25/11 - 28/11)           │
│    Motivo: "Plantão extra no hospital"                      │
│    [Ver perfil completo →]                                  │
│                                                             │
│ 📅 Ontem, 14:12                                             │
│ 💬 Blog da Ward                                              │
│    Bruna Cnobrega fez um post:                              │
│    "Dúvida sobre antidepressivos no Step 1..."             │
│    [Ver post →]                                             │
│                                                             │
│ [Carregar mais →]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👥 ACESSO RÁPIDO                                             │
├─────────────────────────────────────────────────────────────┤
│ [Ver Lista de Todos os Alunos]                              │
│ [Adicionar Links ao Repositório]                            │
│ [Fazer Post no Blog]                                        │
└─────────────────────────────────────────────────────────────┘
```

### PÁGINA: LISTA DE ALUNOS (Dra. Iria)

```
╔═══════════════════════════════════════════════════════════════╗
║  Meus Alunos                                                  ║
╚═══════════════════════════════════════════════════════════════╝

[Busca e filtros:]
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Buscar: _______________]                                │
│ Filtros: [Todos] [Com chamadas pendentes] [Com urgência]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👤 Mayara Alencar                              [Ver perfil →]│
│    📊 Step 1 - First Pass (Cardiovascular)                  │
│    ⚠️ 2ª Chamada pendente e marcada urgente                 │
│    📅 Última atualização: Hoje, 10:23                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👤 Guilherme Lavor                             [Ver perfil →]│
│    📊 Step 1 - First Pass (Genetics)                        │
│    ✅ Todas as chamadas em dia                              │
│    📅 Última atualização: Hoje, 09:15                       │
└─────────────────────────────────────────────────────────────┘

[... continua com todos os alunos ...]

[Ao clicar "Ver perfil →":]
• Dra. Iria vê TODOS os dados do perfil do aluno
• Pode ver todos os diários
• Pode ver todas as respostas dos questionários
• Pode EDITAR Landmarks (marcar chamadas como feitas, adicionar
  observações, marcar urgência)
• Pode adicionar links ao repositório
• Pode fazer posts no blog (sem limite de caracteres)
• Pode visualizar pesquisas do aluno
```

---

## 👨‍💻 PERFIL: GUILHERME LAVOR

```
╔═══════════════════════════════════════════════════════════════╗
║  Dashboard - Guilherme Lavor                                  ║
╚═══════════════════════════════════════════════════════════════╝

[Semelhante ao da Dra. Iria, mas focado nas CHAMADAS DE ANKI]

┌─────────────────────────────────────────────────────────────┐
│ 🎓 WARD ACADEMY                                              │
│ [🏠 Início] [👥 Alunos] [💬 Blog] [🔗 Links]                │
│                                         [👤 Perfil] [🚪Sair] │
└─────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  Bem-vindo, Guilherme! 👋                                     ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ ⚠️ CHAMADAS URGENTES - ANKI (2)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🚨 Pedro Junior                                             │
│    → 1ª Chamada - Configurando Anki (marcado há 4 dias)    │
│    [Ver perfil →]                                           │
│                                                             │
│ 🚨 Eduarda Jassé                                            │
│    → 2ª Chamada - Uso do Anki (marcado há 2 dias)          │
│    [Ver perfil →]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📅 MINHAS PRÓXIMAS CHAMADAS (12)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⏳ Mayara Alencar → 1ª Chamada - Configurando Anki          │
│ ⏳ Letícia Andrigheto → 2ª Chamada - Uso do Anki            │
│ ⏳ Larissa Campos → 1ª Chamada - Configurando Anki          │
│ ⏳ Sean Robinson → 2ª Chamada - Uso do Anki                 │
│ ...                                                         │
│                                                             │
│ [Ver todas →]                                               │
└─────────────────────────────────────────────────────────────┘

[Resto similar à Dra. Iria: linha do tempo, lista de alunos]
[Pode editar Landmarks relacionados ao Anki]
[Pode fazer posts no blog e adicionar links]
```

---

## 🔬 PERFIL: RÔMULO SANGLARD

```
╔═══════════════════════════════════════════════════════════════╗
║  Dashboard - Rômulo Sanglard                                  ║
╚═══════════════════════════════════════════════════════════════╝

[Focado em PESQUISA]

┌─────────────────────────────────────────────────────────────┐
│ 🎓 WARD ACADEMY                                              │
│ [🏠 Início] [🔬 Pesquisas] [👥 Alunos] [💬 Blog] [🔗 Links] │
│                                         [👤 Perfil] [🚪Sair] │
└─────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  Bem-vindo, Rômulo! 👋                                        ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│ 🚨 PESQUISAS COM DEADLINE PRÓXIMO (5)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️ HELIUM PLASMA RF LIPO vs TRADITIONAL LIPO                │
│    → Deadline: 15/12/2025 (14 dias!)                        │
│    → Etapa: Extração de dados                               │
│    → Coautores: Brenda, Bruno, Eduardo                      │
│    [Ver pesquisa →]                                         │
│                                                             │
│ ⚠️ CPR QUALITY AT HIGH ALTITUDE                             │
│    → Deadline: 20/12/2025 (19 dias)                         │
│    → Etapa: Análise estatística                             │
│    → Coautores: Marcelo Ribeiro, Mayara                     │
│    [Ver pesquisa →]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 TODAS AS PESQUISAS EM ANDAMENTO (12)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Filtros: Todas | Por deadline | Por aluno | Por etapa]    │
│                                                             │
│ [Lista de todas as pesquisas...]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 👥 ALUNOS FAZENDO PESQUISA                                   │
├─────────────────────────────────────────────────────────────┤
│ [Lista de alunos que marcaram interesse em pesquisa]       │
│ [Pode ver perfil e landmarks de pesquisa de cada um]        │
└─────────────────────────────────────────────────────────────┘

[Pode:]
• Ver TODAS as pesquisas
• Adicionar/editar pesquisas
• Adicionar coautores
• Atualizar etapas
• Editar comentários das pesquisas
• Ver e editar Landmarks de pesquisa dos alunos
• Fazer posts no blog e adicionar links
```

---

# 🗄️ ESTRUTURA DE DADOS SUPABASE

## Tabelas Necessárias:

```sql
1. users
   - id (PK)
   - email
   - password_hash
   - name
   - role (aluno, mentor_iria, mentor_marcos, mentor_guilherme, mentor_romulo)
   - first_login_completed (boolean)
   - created_at
   - updated_at

2. user_basic_data
   - user_id (FK)
   - cpf
   - orcid
   - address_line1
   - address_line2
   - city
   - state
   - zip_code
   - country
   - graduation_date
   - medical_school
   - current_institution
   - current_specialty
   - intended_specialty_usa

3. user_usmle_data
   - user_id (FK)
   - pathway (traditional, alternate)
   - has_visa (boolean)
   - visa_type
   - current_stage (starting, step1_done, step2ck_done, oet_done, step3_done, other)
   - other_stage_details
   - next_exam
   - next_exam_date
   - first_pass_months
   - second_pass_months
   - dedicated_months

4. user_uworld_data
   - user_id (FK)
   - purchased (boolean)
   - activated (boolean)
   - expiration_date
   - subscription_length
   - questions_done
   - overall_percentage
   - lowest_percentage
   - lowest_system
   - highest_percentage
   - highest_system

5. user_uworld_progress
   - id (PK)
   - user_id (FK)
   - system
   - category
   - completed (boolean)
   - difficulty_marked (boolean)
   - difficulty_notes

6. user_english_level
   - user_id (FK)
   - reading_level
   - listening_level
   - additional_comments

7. user_anki_data
   - user_id (FK)
   - downloaded (boolean)
   - used (boolean)
   - uses_anking (boolean)
   - frequency
   - creates_own_cards
   - devices (JSONB)
   - main_device
   - average_cards_per_day
   - using_since

8. user_research_data
   - user_id (FK)
   - experience_level
   - participated_systematic_review
   - review_role
   - review_status
   - interest_areas (JSONB)
   - target_institutions (JSONB)
   - wants_research_ward (immediate, after_usmle, no)
   - can_collaborate_stages
   - has_networking_contacts (boolean)

9. user_research_contacts
   - id (PK)
   - user_id (FK)
   - contact_name
   - specialty
   - institution

10. user_observerships
    - id (PK)
    - user_id (FK)
    - is_past (boolean)
    - institution
    - year
    - specialty
    - location_type (hospital, private_clinic)
    - approximate_cost
    - got_recommendation_letter (boolean)
    - comments

11. user_background
    - user_id (FK)
    - current_location (brazil, usa, other)
    - other_location
    - personal_story
    - family_agreement
    - how_got_to_usa
    - visa_type_usa
    - how_got_visa
    - works_in_usa (boolean)
    - how_got_job

12. user_preparation_status
    - user_id (FK)
    - currently_preparing_for
    - updated_at

13. messages
    - id (PK)
    - user_id (FK)
    - message
    - is_read (boolean)
    - created_at
    - created_by (mentor_id)

14. links_repository
    - id (PK)
    - title
    - url
    - description
    - category (step1, step2ck, step3, oet, research)
    - added_by (user_id)
    - created_at

15. study_diary
    - id (PK)
    - user_id (FK)
    - date
    - entry_text
    - created_at
    - updated_at

16. uworld_diary
    - id (PK)
    - user_id (FK)
    - date
    - questions_done
    - questions_correct
    - time_spent_minutes
    - system_category
    - difficulties_text
    - created_at
    - updated_at

17. landmarks
    - id (PK)
    - user_id (FK)
    - landmark_type (entry, call_iria, call_marcos, call_guilherme, etc)
    - title
    - completed (boolean)
    - completion_date
    - is_urgent (boolean)
    - notes (JSONB - permite múltiplas observações)
    - order_position
    - created_at
    - updated_at

18. schedules
    - id (PK)
    - user_id (FK)
    - system
    - category
    - questions
    - completed (boolean)
    - created_at
    - updated_at
    - uploaded_by (mentor_id)

19. schedule_delays
    - id (PK)
    - user_id (FK)
    - start_date
    - end_date
    - reason
    - created_at

20. blog_posts
    - id (PK)
    - user_id (FK)
    - content
    - likes
    - dislikes
    - is_pinned (boolean)
    - pin_until (date, nullable)
    - created_at
    - updated_at

21. blog_comments
    - id (PK)
    - post_id (FK)
    - user_id (FK)
    - content
    - likes
    - created_at
    - updated_at

22. research_projects
    - id (PK)
    - type (single_arm, double_arm, network, no_meta)
    - intervention
    - comparison (nullable)
    - interventions (JSONB, for network)
    - population
    - current_stage
    - deadline
    - google_drive_link
    - comments
    - created_by (user_id)
    - created_at
    - updated_at

23. research_coauthors
    - id (PK)
    - project_id (FK)
    - user_id (FK)

24. research_stages_completed
    - id (PK)
    - project_id (FK)
    - stage_name
    - completed (boolean)
    - authors (JSONB)
    - completed_date

25. daily_checkins
    - id (PK)
    - user_id (FK)
    - date
    - status (tranquilo, preciso_ajuda, parado)
    - message
    - created_at
```

---

# 📐 WIREFRAMES VISUAIS

```
ESTRUTURA DE PASTAS RECOMENDADA:

ward-academy/
├── index.html (Login)
├── dashboard.html
├── questionnaire/
│   ├── step1-basic-data.html
│   ├── step2-usmle-data.html
│   ├── step3-uworld-prep.html
│   ├── step4-uworld-progress.html
│   ├── step5-english.html
│   ├── step6-anki.html
│   ├── step7-research-1.html
│   ├── step8-research-2.html
│   ├── step9-research-3.html
│   ├── step10-observerships.html
│   ├── step11-background.html
├── profile.html
├── landmarks.html
├── schedule.html
├── links.html
├── blog.html
├── research.html
├── diary-study.html (condicional)
├── diary-uworld.html (condicional)
├── mentor-dashboard-iria.html
├── mentor-dashboard-marcos.html
├── mentor-dashboard-guilherme.html
├── mentor-dashboard-romulo.html
├── admin-members.html (Marcos)
├── css/
│   └── style.css
├── js/
│   └── app.js
└── assets/
    └── logo.png
```

---

# 🎯 FLUXO DE NAVEGAÇÃO

```
Login → Primeiro acesso? 
  ├─ SIM → Questionário (11 páginas)
  │        └─ Concluiu? → Dashboard
  │        └─ Não concluiu? → Salva progresso
  │                          → Pode continuar depois
  │                          → Pode ir para Dashboard
  │
  └─ NÃO → Dashboard
           ├─ Check-in modal (pode pular)
           ├─ Ver recados
           ├─ Acessar todas as páginas
           └─ Landmarks, Cronograma, Links, etc.

Mentores → Login → Dashboard específico do mentor
                 ├─ Dra. Iria: Foco em chamadas e linha do tempo
                 ├─ Marcos: Admin completo + pesquisas
                 ├─ Guilherme: Foco em chamadas Anki
                 └─ Rômulo: Foco em pesquisas
```

---

# ✅ FUNCIONALIDADES PRINCIPAIS

## PARA ALUNOS:
- ✅ Cadastro completo via questionário de 11 páginas
- ✅ Dashboard com status e acesso rápido
- ✅ Sistema de Landmarks (chamadas e marcos)
- ✅ Cronograma personalizado
- ✅ Repositório de links
- ✅ Blog com posts e comentários
- ✅ Gestão de pesquisas
- ✅ Diários opcionais (Estudos e UWorld)
- ✅ Check-in diário
- ✅ Edição de perfil

## PARA MENTORES:
### Dra. Iria:
- ✅ Dashboard com linha do tempo
- ✅ Chamadas urgentes destacadas
- ✅ Ver todos os alunos
- ✅ Editar Landmarks
- ✅ Posts no blog sem limite

### Marcos (Admin):
- ✅ Gerenciar membros (adicionar/remover)
- ✅ Editar qualquer perfil
- ✅ Trocar senhas
- ✅ Colar cronogramas
- ✅ Acesso completo a tudo

### Guilherme:
- ✅ Dashboard focado em chamadas Anki
- ✅ Editar Landmarks do Anki

### Rômulo:
- ✅ Dashboard focado em pesquisas
- ✅ Ver/editar todas as pesquisas
- ✅ Acompanhar deadlines

---

# 🎨 ELEMENTOS DE DESIGN

## CORES:
- **Primária:** #FFFFFF (Branco)
- **Texto:** #000000 (Preto)
- **Destaque:** #C45700 (Laranja queimado)
- **Sucesso:** #28a745
- **Alerta:** #ffc107
- **Perigo:** #dc3545
- **Info:** #17a2b8

## ÍCONES:
- 🎓 Ward Academy
- 👤 Perfil
- 📅 Cronograma
- 🔗 Links
- 💬 Blog
- 🔬 Pesquisa
- 📝 Diário
- 📊 UWorld
- ⚠️ Urgente
- ✅ Concluído
- ⏳ Pendente

## TIPOGRAFIA:
- **Headers:** 24-32px, Bold
- **Subheaders:** 18-20px, Semi-bold
- **Body:** 14-16px, Regular
- **Small:** 12px, Regular

---

**FIM DO PROTÓTIPO**

Este documento serve como blueprint completo para desenvolvimento.
Todas as funcionalidades, páginas, fluxos e estruturas de dados
estão detalhados para facilitar a implementação.
