# Google Drive Integration Guide para Projetos de Pesquisa

## Status Atual
✅ **Implementado**:
- Correção do bug de task status (agora restaura para o stage original ao desmarcar)
- Modal de projeto ampliado (modal-xxl com 1200px de largura)
- Coluna `original_stage` adicionada à tabela `research_tasks`

⏳ **Pendente** (requer setup adicional):
- Criação automática de pastas no Google Drive
- Upload de arquivos para subpastas específicas
- Listagem e gerenciamento de arquivos

---

## Arquitetura Proposta

### 1. Google Apps Script
**Arquivo**: `/google-apps-script-research-folders.js` (criar novo)

**Pasta Pai**: `1gXmR5nUm6B54v8zbs1L_ni57VJ_p5ffs`

**Estrutura de Pastas a Criar**:
```
[Nome do Projeto]
├── DATABASES
├── FULL TEXT REVIEW
├── INCLUDED
├── DATA EXTRACTION
│   └── FOREST PLOTS
├── RISK OF BIAS
└── SUBMISSION
    ├── TABLES
    └── FIGURES
```

**Endpoints Necessários**:
```javascript
// POST ?action=createProjectFolder
// Body: { projectTitle: "STATINS VS PLACEBO FOR DIABETES" }
// Retorna: { success: true, folderStructure: {...} }

// POST ?action=uploadToFolder
// Body: { folderId, fileName, fileContent (base64), mimeType }
// Retorna: { success: true, fileId, viewLink, ... }

// GET ?action=listFolderFiles&folderId=XXX
// Retorna: { success: true, files: [...] }

// POST ?action=deleteFile&fileId=XXX
// Retorna: { success: true }
```

### 2. Tabelas do Banco de Dados

**Executar**: `/home/user/blogdaward/sql/40_google_drive_integration.sql`

```sql
-- Tabela para armazenar estrutura de pastas
CREATE TABLE research_project_folders (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES research_projects(id) ON DELETE CASCADE,
    folder_name VARCHAR(255) NOT NULL,
    folder_id VARCHAR(255) NOT NULL, -- Google Drive folder ID
    parent_folder_name VARCHAR(255), -- NULL para pasta raiz do projeto
    folder_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, folder_name, parent_folder_name)
);

-- Tabela para armazenar arquivos
CREATE TABLE research_project_files (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES research_projects(id) ON DELETE CASCADE,
    folder_id BIGINT REFERENCES research_project_folders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_id VARCHAR(255) NOT NULL, -- Google Drive file ID
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by BIGINT REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_folders_project ON research_project_folders(project_id);
CREATE INDEX idx_project_files_project ON research_project_files(project_id);
CREATE INDEX idx_project_files_folder ON research_project_files(folder_id);
```

### 3. Frontend - Modal de Criar Projeto

**Adicionar em `/home/user/blogdaward/pesquisa.html`** (após linha 156):

```html
<div class="form-group">
    <label class="form-check">
        <input type="checkbox" id="create-drive-folder" checked>
        <span class="form-check-label">
            📁 Criar estrutura de pastas no Google Drive automaticamente
        </span>
    </label>
    <span class="form-hint">
        Cria pasta do projeto com subpastas organizadas para todos os arquivos da pesquisa
    </span>
</div>
```

**Modificar função `createProject()`**:

```javascript
async function createProject() {
    // ... código existente de validação ...

    const createDriveFolder = document.getElementById('create-drive-folder').checked;
    let driveLink = document.getElementById('project-drive-link').value.trim() || null;

    WardApp.showLoading();

    // Criar estrutura no Drive se solicitado
    let folderStructure = null;
    if (createDriveFolder) {
        try {
            folderStructure = await createProjectDriveFolder(title);
            driveLink = folderStructure.mainFolderUrl;
        } catch (error) {
            console.error('Drive folder creation error:', error);
            WardApp.showToast('Erro ao criar pastas no Drive. Continuando sem integração.', 'warning');
        }
    }

    // Inserir projeto
    const { data: project, error } = await WardApp.db
        .from('research_projects')
        .insert({
            title, description, project_type: projectType,
            deadline, drive_link: driveLink, participants,
            status: 'active', created_by: userData.id
        })
        .select()
        .single();

    if (error) {
        WardApp.hideLoading();
        WardApp.showToast('Erro ao criar projeto', 'error');
        return;
    }

    // Salvar estrutura de pastas no banco
    if (folderStructure) {
        await saveFolderStructure(project.id, folderStructure);
    }

    WardApp.hideLoading();
    closeModal('new-project-modal');
    WardApp.showToast('Projeto criado!');
    await loadProjects();
}
```

### 4. Frontend - Seção de Arquivos no Modal de Projeto

**Adicionar após linha 217 em `/home/user/blogdaward/pesquisa.html`**:

```html
<!-- Seção de Arquivos do Drive -->
<div class="mb-4" id="drive-files-section" style="display: none;">
    <div class="d-flex justify-between align-center mb-2">
        <h4>📁 Arquivos do Projeto</h4>
    </div>

    <div id="drive-folders-container" class="folders-accordion">
        <!-- Preenchido por JavaScript -->
    </div>
</div>
```

**CSS para folders/files** (adicionar ao style):

```css
.folders-accordion {
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.folder-item {
    border-bottom: 1px solid var(--gray-200);
}

.folder-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--gray-50);
    cursor: pointer;
    transition: background 0.2s;
}

.folder-header:hover {
    background: var(--gray-100);
}

.folder-content {
    padding: 1rem;
    display: none;
    background: white;
}

.folder-item.open .folder-content {
    display: block;
}

.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--gray-50);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
}

.file-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--text-dark);
}

.file-link:hover {
    color: var(--primary-color);
}
```

### 5. Funções JavaScript Necessárias

**Constantes** (adicionar no início do script):

```javascript
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

**Funções para implementar**:

```javascript
// Criar estrutura de pastas no Drive
async function createProjectDriveFolder(projectTitle) {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'createProjectFolder',
            projectTitle: projectTitle
        })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.folderStructure;
}

// Salvar estrutura de pastas no banco
async function saveFolderStructure(projectId, folderStructure) {
    const folderRecords = flattenFolderStructure(projectId, folderStructure);
    await WardApp.db.from('research_project_folders').insert(folderRecords);
}

// Carregar pastas/arquivos do projeto
async function loadProjectDriveFolders(projectId) {
    const { data: folders } = await WardApp.db
        .from('research_project_folders')
        .select('*')
        .eq('project_id', projectId)
        .order('folder_name');

    if (!folders || folders.length === 0) {
        document.getElementById('drive-files-section').style.display = 'none';
        return;
    }

    const { data: files } = await WardApp.db
        .from('research_project_files')
        .select('*')
        .eq('project_id', projectId);

    document.getElementById('drive-files-section').style.display = 'block';
    renderDriveFolders(folders, files);
}

// Renderizar pastas com arquivos
function renderDriveFolders(folders, files) {
    // Implementação do accordion de pastas com arquivos
}

// Upload de arquivo
async function handleProjectFileUpload(file, folderId) {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Arquivo muito grande (máximo 10MB)');
    }

    const base64 = await fileToBase64(file);

    // Obter folder_id do Google Drive
    const { data: folder } = await WardApp.db
        .from('research_project_folders')
        .select('folder_id')
        .eq('id', folderId)
        .single();

    // Upload para Google Drive
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
            action: 'uploadToFolder',
            folderId: folder.folder_id,
            fileName: file.name,
            fileContent: base64,
            mimeType: file.type
        })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    // Salvar referência no banco
    await WardApp.db.from('research_project_files').insert({
        project_id: currentProject.id,
        folder_id: folderId,
        file_name: data.fileName,
        file_id: data.fileId,
        file_url: data.viewLink,
        mime_type: data.mimeType,
        file_size: data.size,
        uploaded_by: userData.id
    });
}

// Deletar arquivo
async function deleteProjectFile(fileId) {
    const { data: file } = await WardApp.db
        .from('research_project_files')
        .select('file_id')
        .eq('id', fileId)
        .single();

    // Deletar do Google Drive
    await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=deleteFile&fileId=${file.file_id}`);

    // Deletar do banco
    await WardApp.db.from('research_project_files').delete().eq('id', fileId);
}

// Converter arquivo para Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
```

---

## Passos para Implementação Completa

### Passo 1: Executar SQL
```bash
# Já executado automaticamente:
sql/39_add_original_stage_to_tasks.sql

# Criar e executar:
sql/40_google_drive_integration.sql
```

### Passo 2: Google Apps Script
1. Abrir: https://script.google.com
2. Criar novo projeto: "Ward Academy - Research Folders"
3. Copiar código do template acima
4. Configurar:
   - `RESEARCH_PARENT_FOLDER_ID = '1gXmR5nUm6B54v8zbs1L_ni57VJ_p5ffs'`
5. Deploy como Web App:
   - Execute as: Me
   - Who has access: Anyone
6. Copiar URL do deployment
7. Atualizar `GOOGLE_APPS_SCRIPT_URL` em pesquisa.html

### Passo 3: Adicionar UI em pesquisa.html
- Checkbox para criar pastas
- Seção de arquivos no modal
- Modal de upload
- CSS para folders/files

### Passo 4: Adicionar Funções JavaScript
- `createProjectDriveFolder()`
- `saveFolderStructure()`
- `loadProjectDriveFolders()`
- `renderDriveFolders()`
- `handleProjectFileUpload()`
- `deleteProjectFile()`

### Passo 5: Testar
1. Criar novo projeto com "Criar pastas" marcado
2. Verificar pastas criadas no Drive
3. Abrir projeto e ver seção de arquivos
4. Fazer upload de teste
5. Ver arquivo listado
6. Deletar arquivo

---

## Limitações e Considerações

1. **Tamanho de Arquivo**: Limite de 10MB por arquivo (Google Apps Script)
2. **Quota do Drive**: Verificar limites de espaço da conta
3. **Permissões**: Arquivos criados ficam visíveis para "anyone with link"
4. **Performance**: Upload de arquivos grandes pode demorar
5. **Sincronização**: Se alguém deletar arquivo manualmente no Drive, referência no banco fica órfã

---

## Custos e Manutenção

- **Google Drive**: Gratuito até 15GB (conta Google normal)
- **Google Apps Script**: Gratuito (quotas diárias aplicam)
- **Banco de Dados**: Novas tabelas ocupam espaço mínimo
- **Manutenção**: Baixa após implementação inicial

---

## Próximos Passos

1. ✅ Bug de task status corrigido
2. ✅ Modal ampliado
3. ⏳ Criar arquivo SQL para novas tabelas
4. ⏳ Implementar Google Apps Script
5. ⏳ Adicionar UI de gerenciamento de arquivos
6. ⏳ Testar fluxo completo

**Tempo Estimado para Implementação Completa**: 8-12 horas
