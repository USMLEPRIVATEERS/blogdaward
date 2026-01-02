# 🔍 DEBUG: View As no Questionário

## 1️⃣ LIMPE O CACHE COMPLETAMENTE

### Chrome/Edge:
1. Pressione `F12` para abrir DevTools
2. Clique com botão direito no botão de **Reload**
3. Selecione **"Empty Cache and Hard Reload"**

### Firefox:
1. Pressione `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Selecione "Cache"
3. Clique em "Clear Now"
4. Depois pressione `Ctrl + F5` para reload

## 2️⃣ VERIFIQUE SE O CÓDIGO ESTÁ CARREGADO

1. Abra `https://wardacademy.org/questionnaire/step2-usmle-data.html?view_as=15`
2. Pressione `F12` para abrir o Console
3. Cole esse código no console:

```javascript
console.log('getViewAsParam exists:', typeof getViewAsParam);
console.log('view_as parameter:', getViewAsParam ? getViewAsParam() : 'FUNCTION NOT FOUND');
```

**Resultado esperado:**
```
getViewAsParam exists: function
view_as parameter: 15
```

**Se mostrar "undefined" ou "FUNCTION NOT FOUND":**
- O cache ainda está ativo, limpe novamente!

## 3️⃣ TESTE SE OS DADOS ESTÃO SENDO CARREGADOS

No console, cole:

```javascript
WardApp.loadQuestionnaireData(2).then(data => {
    console.log('Step 2 data:', data);
    if (!data) {
        console.error('❌ NO DATA RETURNED!');
    } else {
        console.log('✅ Data found:', Object.keys(data));
    }
});
```

**Se retornar NULL ou undefined:**
- O aluno não tem dados salvos no step 2, OU
- A função não está detectando o view_as corretamente

## 4️⃣ VERIFIQUE O BANCO DE DADOS

Execute no Supabase SQL Editor:

```sql
-- Ver todos os dados do questionário do aluno 15
SELECT
    step,
    data,
    created_at,
    updated_at
FROM questionnaire_data
WHERE user_id = 15
ORDER BY step;
```

**Isso vai mostrar:**
- Quais steps o aluno 15 realmente preencheu
- O conteúdo de cada step

## 5️⃣ VERIFIQUE SE O APP.JS FOI ATUALIZADO

No console:

```javascript
// Verificar se loadQuestionnaireData tem suporte view_as
console.log(WardApp.loadQuestionnaireData.toString());
```

**Procure por:**
- `viewAsData`
- `view_as_student`
- `targetUserId`

**Se NÃO encontrar essas palavras:**
- O app.js está em cache! Limpe o cache novamente!

## 6️⃣ TESTE MANUAL COMPLETO

1. Faça logout
2. Limpe TODO o cache do navegador
3. Faça login como mentor (Marcos ou Iria)
4. Clique em um aluno para "Ver como Aluno"
5. Verifique se a URL tem `?view_as=XX`
6. Clique em "Revisar Dados →"
7. Verifique:
   - URL deve ter `?view_as=XX`
   - Dados devem aparecer preenchidos
   - Console não deve ter erros (F12)

## 🆘 SE NADA FUNCIONAR

Execute no console:

```javascript
// Debug completo
const urlParams = new URLSearchParams(window.location.search);
const viewAs = urlParams.get('view_as');
const user = JSON.parse(localStorage.getItem('ward_user'));
const viewAsData = JSON.parse(localStorage.getItem('view_as_student') || 'null');

console.log('=== DEBUG INFO ===');
console.log('URL view_as param:', viewAs);
console.log('Current user:', user);
console.log('view_as_student localStorage:', viewAsData);
console.log('User is mentor:', user?.role?.startsWith('mentor'));

// Test data loading
WardApp.loadQuestionnaireData(2).then(data => {
    console.log('Loaded data for step 2:', data);
});
```

Envie o resultado desse debug!
