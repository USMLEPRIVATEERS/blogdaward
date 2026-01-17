# Análise de Calibração - Deduplicação por DOI

## Resumo do Problema Identificado

O app de screening está mostrando **3127 grupos de duplicados**, mas o esperado seria apenas **1796 grupos** se fossem carregados apenas os 4 arquivos originais.

**Causa raiz:** O arquivo `ENDNOTE.DEDUPLICATED.3708RESULTS.22DEC2025.RIS` foi carregado junto com os 4 arquivos originais, gerando duplicação artificial.

## Estatísticas dos Arquivos

### Arquivos Originais (4 fontes)

| Fonte | Total Registros | Com DOI | Sem DOI |
|-------|----------------|---------|---------|
| COCHRANE | 116 | 67 | 49 |
| EMBASE | 3404 | 2865 | 539 |
| PUBMED | 1606 | 1507 | 99 |
| SCOPUS | 1506 | 1428 | 78 |
| **TOTAL** | **6632** | **5867** | **765** |

### Análise de DOIs (apenas 4 fontes originais)

- **DOIs únicos:** 3163
- **Grupos com 2+ registros (duplicados reais):** 1796
- **Esperado após deduplicação por DOI:** 3928 registros
- **EndNote tem:** 3708 registros
- **Diferença (requer dedup por título):** ~220 registros

### Se incluir o arquivo EndNote (5 fontes) - O QUE ACONTECEU

- Total de registros com DOI: 8987
- DOIs únicos: 3163
- **Grupos com 2+ registros: 3127** (exatamente o que o app mostrou!)

## Distribuição de Ocorrências (5 fontes)

| Ocorrências | Quantidade de DOIs |
|-------------|-------------------|
| 1x (único) | 36 |
| 2x | 1337 |
| 3x | 1003 |
| 4x | 738 |
| 5x | 42 |
| 6x | 1 |

## Diagnóstico

A calibração do app de deduplicação está **CORRETA**. O problema é que foram carregados 5 arquivos em vez de 4:

1. COCHRANE.116RESULTS.22DEC2025.ris
2. EMBASE.3404RESULTS.22DEC2025.RIS
3. PUBMED.1606RESULTS.22DEC2025.NBIB
4. SCOPUS.1506RESULTS.22DEC2025.RIS
5. **ENDNOTE.DEDUPLICATED.3708RESULTS.22DEC2025.RIS** (já deduplicado!)

Quando o arquivo já deduplicado do EndNote é incluído junto com os originais, praticamente todos os DOIs aparecem duplicados (porque o EndNote contém os mesmos artigos das outras fontes, só que sem os duplicados entre si).

## Solução

### Opção 1: Usar apenas os 4 arquivos originais
Carregar apenas:
- COCHRANE
- EMBASE
- PUBMED
- SCOPUS

**Resultado esperado:** ~1796 grupos de duplicados por DOI, resultando em ~3928 registros únicos após deduplicação por DOI.

### Opção 2: Usar apenas o arquivo EndNote
Se preferir usar o resultado do EndNote:
- Carregar apenas ENDNOTE.DEDUPLICATED.3708RESULTS.22DEC2025.RIS

**Resultado:** 3708 registros já deduplicados, sem necessidade de deduplicação adicional.

## Validação do App

A lógica de deduplicação por DOI no app está funcionando corretamente:

1. **Normalização de DOI:** Remove prefixos (doi:, http://doi.org/, etc.) e converte para minúsculas
2. **Agrupamento:** Agrupa registros pelo DOI normalizado
3. **Detecção:** Identifica grupos com 2+ registros como duplicados

O código em `toolbox/screening.html` (linhas 2053-2094) implementa corretamente:
- `normalizeDOI()`: Normaliza o DOI para comparação
- `findDuplicatesByDOI()`: Encontra grupos de duplicados

## Melhorias Sugeridas para o App

1. **Avisar sobre arquivos já deduplicados:** Detectar se um arquivo parece ser resultado de deduplicação anterior (ex: nome contém "deduplicated" ou tem poucos duplicados internos)

2. **Mostrar estatísticas antes da deduplicação:**
   - Total de registros por fonte
   - Total de registros com/sem DOI
   - Número esperado de duplicados

3. **Permitir preview:** Mostrar quantos registros serão removidos antes de confirmar

---
*Análise realizada em 17/01/2026*
