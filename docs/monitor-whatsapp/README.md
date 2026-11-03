# Monitor de alunos → WhatsApp

Especificação para o Claude local do Marcos montar um script que, a cada
15–30 minutos, avisa no WhatsApp quando um aluno:

1. **marcou uma chamada**;
2. **fez check-in com texto** ou **pedindo ajuda** (ou "parado");
3. **registrou questões com 40% ou menos de acertos**.

Cada aviso vai como **imagem igual ao "copiar imagem" da 🌐 Atividade Global
da Plataforma** (painel do Marcos), com uma legenda curta.

Arquivos desta pasta:

| Arquivo | O que é |
|---|---|
| `consultas.sql` | As três consultas, já testadas (somente leitura). |
| `cartao.js` | Monta o texto de cada aviso igual ao do painel e gera o PNG. Tem a função de decifrar nomes. |
| `decifrar_nome.py` | A mesma decifragem de nomes, em Python. |
| `usuario-somente-leitura.sql` | Cria um usuário do banco que só consegue ler o que o monitor precisa. |

---

## 1. Visão geral

```
a cada 20 min ─► consultas.sql (Supabase) ─► eventos novos? ─► PNG (cartao.js) ─► WhatsApp ─► guarda "já avisei"
```

- **Use um script comum, sem IA no meio.** Rodando a cada 20 minutos, um
  script não gasta crédito nenhum do Claude. O Claude local entra só para
  escrever e ajustar o script. Chamar o Claude a cada execução gastaria
  créditos à toa.
- Pode ser **um script só** com quatro etapas (consultar → montar eventos →
  gerar imagem → enviar). Não precisa de um script por tipo de aviso.
- Linguagem sugerida: **Node.js**, porque `cartao.js` já está pronto. Em Python
  também dá: as consultas são as mesmas, `decifrar_nome.py` está aqui e a
  imagem sai do mesmo HTML (`htmlDoCartao` em `cartao.js`) com o Playwright
  para Python.

## 2. Acesso ao Supabase

- O MCP do Supabase serve para o Claude conversar com o banco. O **script**
  agendado precisa da conexão direta com o Postgres.
- **Recomendado:** rodar `usuario-somente-leitura.sql` no SQL Editor do
  Supabase (troque a senha). Ele cria o usuário `monitor_ward`, que só lê
  `users`, `landmarks`, `scheduled_calls`, `daily_checkins` e `uworld_diary`
  e não consegue alterar nem apagar nada. Isso foi testado.
- A connection string está em *Project Settings → Database → Connection string*
  (use o **Session pooler**), com o usuário `monitor_ward` e a senha que você
  definiu.
- Guarde a conexão em **variável de ambiente** (ex.: `WARD_DB_URL`), nunca
  dentro do arquivo do script. **Não use a chave `service_role`** no script:
  ela pode tudo.

## 3. Onde olhar no banco

Só contam alunos: `users.role` em `('aluno', 'assessoria')`. Ficam de fora
mentores, `externo` e `parceiro_donato`.

### 3.1 Chamadas marcadas → `scheduled_calls`

| Coluna | Significado |
|---|---|
| `id` | Identificador do agendamento. |
| `student_id`, `mentor_id` | → `users.id`. |
| `landmark_id` | → `landmarks.id`. O **nome da chamada** é `landmarks.title`. Sem landmark, use "Call com mentor". |
| `scheduled_date`, `scheduled_time` | Dia e hora **no fuso do mentor** (`users.timezone` do mentor; vazio = `America/Sao_Paulo`). |
| `student_timezone` | Fuso do aluno. |
| `status` | `scheduled` (marcada), `completed`, `cancelled`. Avise só `scheduled`. |
| `notes` | Resposta do aluno na hora de marcar, quando a chamada pergunta algo (ex.: "NBME 28", "Cardiologia"). |
| `created_at` | Quando o aluno marcou. É por ela que se acha o que é novo. |

- **Reagendar** apaga a linha antiga e cria outra. Então um reagendamento
  aparece como chamada nova, o que é o desejado.
- Chamada de NBME e de system: o título já traz o mentor escolhido e o
  assunto (ex.: "Guilherme: avaliando o seu resultado no self assessment do
  Step 1 — NBME 28").

### 3.2 Check-ins → `daily_checkins`

| Coluna | Significado |
|---|---|
| `id`, `user_id`, `date` | Uma linha por aluno por dia (`UNIQUE(user_id, date)`). |
| `filled` | `NULL` = ainda não respondeu; `0` = pulou; `1` = **respondeu**. |
| `status` | `tranquilo`, `preciso_ajuda`, `parado`, `custom` (mensagem livre), `skipped`. |
| `message` | O texto que o aluno escreveu (pode vir vazio). |
| `uworld_questions_done`, `uworld_correct_answers` | Questões do dia informadas no check-in. |
| `anki_cards_today`, `anki_current_streak` | Anki do dia. |

**Regra do aviso:** `filled = 1` **e** pelo menos uma destas:
- `status` = `preciso_ajuda` ou `parado`;
- `message` com algum texto;
- UWorld do check-in com ≤ 40% de acertos.

O mesmo check-in vira **um aviso só**, mesmo que caia em mais de uma regra.

> **Atenção:** a linha do dia é criada **vazia às 3h da manhã**, e só é
> *preenchida* quando o aluno responde. `created_at` é a hora em que foi criada
> (3h), não a hora da resposta, e a tabela não tem `updated_at`. Então não
> dá para buscar "check-ins desde a última verificação". A consulta olha os
> **últimos 2 dias**, e o script avisa só o que ainda não avisou, pela
> **chave** (id + conteúdo). Se o aluno refizer o check-in do dia com outro
> texto, a chave muda e o aviso sai de novo.

### 3.3 Questões com ≤ 40% → `uworld_diary`

Gravada pelo **Diário UWorld** e pelo **"Registrar sessão" do Cronograma**.

| Coluna | Significado |
|---|---|
| `id`, `user_id`, `date`, `created_at` | `created_at` = quando registrou. |
| `total_questions`, `correct_answers` | % = `correct_answers / total_questions`. |
| `exam_type`, `subject`, `system`, `category` | Assunto da sessão. |
| `notes` | Observação do aluno (sai na caixa branca do cartão). |

- Regra: `total_questions ≥ MIN_QUESTOES` e `% ≤ 40`.
- `MIN_QUESTOES` é o parâmetro `$2` das consultas. Com `1`, qualquer sessão
  conta, até uma de 2 questões com 0 acertos. Se isso gerar ruído, use 10.
  Vale também para o UWorld do check-in.
- As colunas antigas (`questions_done`, `percentage_correct`) aparecem em SQLs
  velhos do repositório. A plataforma grava em `total_questions` e
  `correct_answers`.

As três consultas prontas estão em **`consultas.sql`** (parâmetros
`$1 = desde`, `$2 = MIN_QUESTOES`). Foram testadas num Postgres com as
mesmas colunas, cobrindo:
- chamada cancelada, antiga e de externo (ficam de fora);
- check-in pulado, não respondido, fora da janela ou sem texto (ficam de fora);
- sessão com exatamente 40% (entra), com 42,5% (fica de fora) e com 0 questões (não dá divisão por zero).

## 4. Nomes cifrados

`users.full_name`, `users.email` e `users.cpf` podem estar **cifrados** no
banco (o site decifra na tela com `_dn()` / `WardApp._prs`). O nome que sai da
consulta pode vir como `XyZ1aBc...==`.

- O formato é texto → XOR com uma chave → UTF-8 → base64.
- **A chave** é a de `_dfh._g()` em `js/src/app.js` (o array de códigos
  `_s`). Copie de lá **uma vez** para a variável de ambiente
  `WARD_NOME_CHAVE`. Não cole a chave em conversa, WhatsApp ou arquivo do
  script.
- Para decifrar: `decifrarNome()` em `cartao.js` (Node) ou `decifrar_nome()`
  em `decifrar_nome.py` (Python). As duas foram conferidas contra o código do
  site, e um nome que não está cifrado volta como está.
- `eventoDeChamada/Checkin/Sessao` (em `cartao.js`) já decifram os nomes
  sozinhos.

## 5. A imagem

É o mesmo cartão do feed (`.feed-item` do painel), com os mesmos textos, cores
e ícones, na mesma escala 2 do "copiar imagem". Foi comparado lado a lado com
o cartão do painel.

| Aviso | Cor da borda | Ícone | Frase | Título | Linha de baixo |
|---|---|---|---|---|---|
| Chamada | `#0ea5e9` | 📞 | "agendou call" | nome da chamada | "Mentor - dd/mm/aaaa às HH:MM" |
| Check-in ajuda | `#f59e0b` | 🟡 | "fez check-in" | "🟡 Precisa de Ajuda" | texto + UWorld/Anki em azul |
| Check-in parado | `#ef4444` | 🔴 | "fez check-in" | "🔴 Parado" | idem |
| Check-in com texto | `#10b981` | 🟢 / ✍️ | "fez check-in" | "🟢 Tranquilo" / "✍️ Mensagem personalizada" | idem |
| Questões ≤ 40% | `#6366f1` | 📊 | "registrou sessao UWorld" | "40 questoes - 35% acertos" | "System: … \| Category: …" + observação |

Com `cartao.js`:

```js
const c = require('./cartao');
const ev = c.eventoDeChamada(linha);       // ou eventoDeCheckin(linha) / eventoDeSessao(linha)
await c.gerarImagem(ev, 'aviso.png');      // PNG pronto
// ev.legenda -> ex.: "📞 Rodrigo marcou chamada com Guilherme: 05/11/2026 às 14:00"
// ev.chave   -> ex.: "chamada:123" (guardar depois de enviar)
```

Para conferir o visual antes de tudo: `npm install playwright`,
`npx playwright install chromium` e `node cartao.js`, que gera
`exemplo-chamada.png`, `exemplo-checkin.png` e `exemplo-sessao.png`.

## 6. O script, passo a passo

Estado em `estado.json`, ao lado do script:

```json
{ "ultima_verificacao": "2026-11-03T12:00:00Z", "avisados": { "chamada:123": "2026-11-03T12:01:00Z" } }
```

1. **Primeira execução:** `ultima_verificacao = agora`, para não mandar o
   histórico inteiro de uma vez.
2. `inicio = agora`; `desde = ultima_verificacao − 5 min` (folga contra
   relógio e transação; a chave impede aviso repetido).
3. Rodar as três consultas de `consultas.sql` com `$1 = desde` e
   `$2 = MIN_QUESTOES`.
4. Montar os eventos com `eventoDeChamada` / `eventoDeCheckin` /
   `eventoDeSessao`. Descartar os que já têm `chave` em `avisados`. Ordenar
   do mais antigo para o mais novo.
5. Para cada evento:
   - gerar o PNG (reaproveite um Chromium aberto: `gerarImagem(ev, arq, navegador)`);
   - **enviar no WhatsApp** (imagem + `ev.legenda`) pela mesma integração que
     o seu Claude já usa;
   - **só depois de enviar**, gravar `avisados[ev.chave] = agora` e apagar o PNG.
6. Gravar `ultima_verificacao = inicio`. Apagar de `avisados` o que tiver mais
   de 7 dias.
7. **Erros:**
   - se o banco falhar, não mexa em `ultima_verificacao` (a próxima rodada pega tudo);
   - se o envio de um aviso falhar, não marque como avisado (vai de novo na próxima).
8. **Limite por rodada** (sugestão: 10 imagens). Passou disso, mande o resto
   num texto único ("+ 7 avisos: …"), para não disparar dezenas de imagens
   seguidas.
9. **Opcional:** silêncio entre 23h e 7h. As consultas continuam pegando tudo
   (chamadas e sessões por `desde`, check-ins pela janela de 2 dias), e os
   avisos saem de manhã.

## 7. Agendar

- **Windows:** Agendador de Tarefas → Criar Tarefa → Disparador "Diariamente",
  repetir a cada 20 minutos por tempo indeterminado → Ação
  `node C:\caminho\monitor.js`. Configure as variáveis de ambiente
  `WARD_DB_URL` e `WARD_NOME_CHAVE` no usuário.
- **Mac/Linux:** `crontab -e` → `*/20 * * * * cd /caminho && node monitor.js >> monitor.log 2>&1`.
- O PC precisa estar ligado e com a integração do WhatsApp rodando.

## 8. Testar antes de ligar

1. `node cartao.js`: confira as três imagens de exemplo.
2. Rode o monitor uma vez em **modo teste**, com `desde = 24h atrás`, mandando
   só para o seu número.
3. Compare com a 🌐 Atividade Global do painel, no período "Semana", filtrando
   "Somente check-ins" e "Somente sessões de UWorld". Tem que bater.

## 9. Privacidade

As imagens têm **nome do aluno e o que ele escreveu** no check-in. Envie só
para o seu número (ou um grupo só de mentores). Não guarde os PNGs depois de
enviar.

## 10. Se quiser melhorar depois (no site)

Uma coluna `updated_at` em `daily_checkins` (com gatilho que a atualiza
quando o aluno responde) permitiria buscar check-ins por "desde", como as
outras duas consultas. Não é necessário: a janela de 2 dias com a chave já
resolve.
