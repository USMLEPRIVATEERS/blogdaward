// ============================================
// WARD ACADEMY - RESEARCH FOLDERS & FILE UPLOAD API
// Google Apps Script Backend - v2.5 COM SUBMISSION SUBFOLDERS + CHECK MISSING
// ============================================
//
// INSTRUÇÕES DE INSTALAÇÃO:
// 1. Acesse: https://script.google.com
// 2. Abra o projeto existente
// 3. DELETE TODO o código antigo (Ctrl+A → Delete)
// 4. COLE este código completo
// 5. Ctrl+S para salvar
// 6. Implantar > Gerenciar implantações > Editar
// 7. Versão: "Nova versão"
// 8. Executar como: "Eu"
// 9. Quem tem acesso: "Qualquer pessoa"
// 10. Clique em "Implantar"

// ============================================
// CONFIGURAÇÕES
// ============================================

// Pasta pai onde serão criados os projetos de pesquisa
const RESEARCH_PARENT_FOLDER_ID = '1gXmR5nUm6B54v8zbs1L_ni57VJ_p5ffs';

// Pasta para uploads gerais (compatibilidade)
const GENERAL_UPLOAD_FOLDER_ID = '1taSg22f7FCMJAuAeIYReRHpozBnpdQ_m';

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// HANDLER PARA GET REQUESTS
// ============================================

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    // DELETAR ARQUIVO
    if (action === 'deleteFile' && e.parameter.fileId) {
      const file = DriveApp.getFileById(e.parameter.fileId);
      file.setTrashed(true);
      
      result = {
        success: true,
        message: 'Arquivo movido para lixeira'
      };
    }
    
    // LISTAR ARQUIVOS DE UMA PASTA
    else if (action === 'list') {
      const folderId = e.parameter.folderId || GENERAL_UPLOAD_FOLDER_ID;
      const folder = DriveApp.getFolderById(folderId);
      const files = folder.getFiles();
      const fileList = [];

      while (files.hasNext()) {
        const file = files.next();
        fileList.push(getFileInfo(file));
      }

      fileList.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

      result = {
        success: true,
        count: fileList.length,
        files: fileList
      };
    }
    
    // STATUS DA API
    else {
      result = {
        success: true,
        message: 'Ward Academy Research Folders API v2.5',
        status: 'Working - Includes SUBMISSION subfolders + check missing',
        timestamp: new Date().toISOString(),
        endpoints: {
          'POST createProjectFolder': 'Cria estrutura de pastas para projeto (com PROTOCOL + SUBMISSION subfolders)',
          'POST checkAndCreateMissingFolders': 'Verifica e cria pastas faltantes em projeto existente',
          'POST uploadToFolder': 'Upload de arquivo para pasta específica',
          'GET deleteFile': 'Deleta um arquivo',
          'GET list': 'Lista arquivos de uma pasta'
        }
      };
    }

    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

// ============================================
// HANDLER PARA POST REQUESTS
// ============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    // CRIAR ESTRUTURA DE PASTAS PARA PROJETO
    if (action === 'createProjectFolder') {
      result = createProjectFolderStructure(data.projectTitle);
    }
    
    // VERIFICAR E CRIAR PASTAS FALTANTES
    else if (action === 'checkAndCreateMissingFolders') {
      result = checkAndCreateMissingFolders(data.mainFolderId);
    }

    // FAZER UPLOAD DE ARQUIVO PARA PASTA ESPECÍFICA
    else if (action === 'uploadToFolder') {
      result = uploadFileToFolder(
        data.folderId,
        data.fileName,
        data.fileContent,
        data.mimeType
      );
    }
    
    // UPLOAD PARA PASTA GERAL (compatibilidade)
    else {
      result = uploadFileToFolder(
        GENERAL_UPLOAD_FOLDER_ID,
        data.fileName,
        data.fileContent,
        data.mimeType
      );
    }

    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

// ============================================
// CRIAR ESTRUTURA DE PASTAS PARA PROJETO
// ============================================

function createProjectFolderStructure(projectTitle) {
  try {
    // Acessar pasta pai
    const parentFolder = DriveApp.getFolderById(RESEARCH_PARENT_FOLDER_ID);
    
    // Criar pasta principal do projeto
    const mainFolder = parentFolder.createFolder(projectTitle);
    mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);

    const subfolders = {};

    // ========================================
    // CRIAR SUBPASTAS NA ORDEM CORRETA
    // ========================================

    // 1. PROTOCOL
    const protocol = mainFolder.createFolder('PROTOCOL');
    protocol.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['PROTOCOL'] = {
      id: protocol.getId(),
      url: protocol.getUrl()
    };

    // 2. DATABASES
    const databases = mainFolder.createFolder('DATABASES');
    databases.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['DATABASES'] = {
      id: databases.getId(),
      url: databases.getUrl()
    };

    // 3. FULL TEXT REVIEW
    const fullText = mainFolder.createFolder('FULL TEXT REVIEW');
    fullText.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['FULL TEXT REVIEW'] = {
      id: fullText.getId(),
      url: fullText.getUrl()
    };

    // 4. INCLUDED
    const included = mainFolder.createFolder('INCLUDED');
    included.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['INCLUDED'] = {
      id: included.getId(),
      url: included.getUrl()
    };

    // 5. DATA EXTRACTION (com subpasta)
    const dataExtraction = mainFolder.createFolder('DATA EXTRACTION');
    dataExtraction.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['DATA EXTRACTION'] = {
      id: dataExtraction.getId(),
      url: dataExtraction.getUrl(),
      subfolders: {}
    };

    // 5.1. DATA EXTRACTION > FOREST PLOTS
    const forestPlots = dataExtraction.createFolder('FOREST PLOTS');
    forestPlots.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['DATA EXTRACTION'].subfolders['FOREST PLOTS'] = {
      id: forestPlots.getId(),
      url: forestPlots.getUrl()
    };

    // 6. RISK OF BIAS
    const riskOfBias = mainFolder.createFolder('RISK OF BIAS');
    riskOfBias.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['RISK OF BIAS'] = {
      id: riskOfBias.getId(),
      url: riskOfBias.getUrl()
    };

    // 7. SUBMISSION (com subpastas)
    const submission = mainFolder.createFolder('SUBMISSION');
    submission.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'] = {
      id: submission.getId(),
      url: submission.getUrl(),
      subfolders: {}
    };

    // 7.1. SUBMISSION > TABLES
    const tables = submission.createFolder('TABLES');
    tables.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['TABLES'] = {
      id: tables.getId(),
      url: tables.getUrl()
    };

    // 7.2. SUBMISSION > FIGURES
    const figures = submission.createFolder('FIGURES');
    figures.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['FIGURES'] = {
      id: figures.getId(),
      url: figures.getUrl()
    };

    // 7.3. SUBMISSION > ABSTRACT
    const abstract = submission.createFolder('ABSTRACT');
    abstract.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['ABSTRACT'] = {
      id: abstract.getId(),
      url: abstract.getUrl()
    };

    // 7.4. SUBMISSION > MANUSCRIPT
    const manuscript = submission.createFolder('MANUSCRIPT');
    manuscript.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['MANUSCRIPT'] = {
      id: manuscript.getId(),
      url: manuscript.getUrl()
    };

    // 7.5. SUBMISSION > SUPPLEMENTARY
    const supplementary = submission.createFolder('SUPPLEMENTARY');
    supplementary.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['SUPPLEMENTARY'] = {
      id: supplementary.getId(),
      url: supplementary.getUrl()
    };

    // 7.6. SUBMISSION > COVER LETTER
    const coverLetter = submission.createFolder('COVER LETTER');
    coverLetter.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['COVER LETTER'] = {
      id: coverLetter.getId(),
      url: coverLetter.getUrl()
    };

    // ========================================
    // RETORNAR ESTRUTURA CRIADA
    // ========================================

    return {
      success: true,
      folderStructure: {
        mainFolderName: projectTitle,
        mainFolderId: mainFolder.getId(),
        mainFolderUrl: mainFolder.getUrl(),
        subfolders: subfolders
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// ============================================
// VERIFICAR E CRIAR PASTAS FALTANTES
// ============================================

function checkAndCreateMissingFolders(mainFolderId) {
  try {
    const mainFolder = DriveApp.getFolderById(mainFolderId);

    // Estrutura esperada: pasta -> subpastas esperadas
    const expectedStructure = {
      'PROTOCOL': [],
      'DATABASES': [],
      'FULL TEXT REVIEW': [],
      'INCLUDED': [],
      'DATA EXTRACTION': ['FOREST PLOTS'],
      'RISK OF BIAS': [],
      'SUBMISSION': ['TABLES', 'FIGURES', 'ABSTRACT', 'MANUSCRIPT', 'SUPPLEMENTARY', 'COVER LETTER']
    };

    // Listar pastas existentes no nivel principal
    const existingMainFolders = {};
    const mainFolders = mainFolder.getFolders();
    while (mainFolders.hasNext()) {
      const f = mainFolders.next();
      existingMainFolders[f.getName().toUpperCase()] = f;
    }

    const created = [];
    const alreadyExists = [];

    // Verificar cada pasta esperada
    for (const [folderName, expectedSubfolders] of Object.entries(expectedStructure)) {
      let folder;

      if (existingMainFolders[folderName.toUpperCase()]) {
        folder = existingMainFolders[folderName.toUpperCase()];
        alreadyExists.push(folderName);
      } else {
        // Criar pasta faltante
        folder = mainFolder.createFolder(folderName);
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
        created.push({
          name: folderName,
          id: folder.getId(),
          url: folder.getUrl(),
          parent: mainFolder.getName()
        });
      }

      // Verificar subpastas
      if (expectedSubfolders.length > 0) {
        const existingSubs = {};
        const subs = folder.getFolders();
        while (subs.hasNext()) {
          const s = subs.next();
          existingSubs[s.getName().toUpperCase()] = s;
        }

        for (const subName of expectedSubfolders) {
          if (existingSubs[subName.toUpperCase()]) {
            alreadyExists.push(folderName + ' > ' + subName);
          } else {
            const sub = folder.createFolder(subName);
            sub.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
            created.push({
              name: subName,
              id: sub.getId(),
              url: sub.getUrl(),
              parent: folderName
            });
          }
        }
      }
    }

    return {
      success: true,
      created: created,
      createdCount: created.length,
      alreadyExistsCount: alreadyExists.length,
      alreadyExists: alreadyExists
    };

  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// ============================================
// FAZER UPLOAD DE ARQUIVO PARA PASTA
// ============================================

function uploadFileToFolder(folderId, fileName, fileContent, mimeType) {
  try {
    // Decodificar Base64
    const decoded = Utilities.base64Decode(fileContent);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    
    // Acessar pasta
    const folder = DriveApp.getFolderById(folderId);
    
    // Criar arquivo na pasta
    const file = folder.createFile(blob);
    
    // Configurar permissões
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      viewLink: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      mimeType: file.getMimeType(),
      size: file.getSize(),
      dateCreated: file.getDateCreated().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// ============================================
// OBTER INFORMAÇÕES DE UM ARQUIVO
// ============================================

function getFileInfo(file) {
  const mimeType = file.getMimeType();
  return {
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getUrl(),
    viewLink: 'https://drive.google.com/file/d/' + file.getId() + '/view',
    mimeType: mimeType,
    size: file.getSize(),
    dateCreated: file.getDateCreated().toISOString(),
    isImage: mimeType.startsWith('image/'),
    isPDF: mimeType === 'application/pdf',
    isVideo: mimeType.startsWith('video/')
  };
}

// ============================================
// ESTRUTURA DE PASTAS CRIADA
// ============================================
/*
Quando você chamar createProjectFolder, será criada esta estrutura:

📁 [Nome do Projeto]
├── 📁 PROTOCOL
├── 📁 DATABASES
├── 📁 FULL TEXT REVIEW
├── 📁 INCLUDED
├── 📁 DATA EXTRACTION
│   └── 📁 FOREST PLOTS
├── 📁 RISK OF BIAS
└── 📁 SUBMISSION
    ├── 📁 TABLES
    ├── 📁 FIGURES
    ├── 📁 ABSTRACT
    ├── 📁 MANUSCRIPT
    ├── 📁 SUPPLEMENTARY
    └── 📁 COVER LETTER

Todas as pastas com permissão: "Qualquer pessoa com o link pode editar"

Actions disponíveis (POST):
- createProjectFolder: Cria a estrutura completa de pastas
- checkAndCreateMissingFolders: Verifica e cria pastas faltantes (requer mainFolderId)
- uploadToFolder: Upload de arquivo para pasta específica
*/

// ============================================
// FIM DO SCRIPT
// ============================================
