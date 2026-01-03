// ============================================
// WARD ACADEMY - RESEARCH FOLDERS & FILE UPLOAD API
// Google Apps Script Backend
// ============================================
//
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 1. Acesse: https://script.google.com
// 2. Abra o projeto existente ou crie um novo
// 3. Cole este código substituindo o existente
// 4. No menu "Implantar" > "Gerenciar implantações" > "Editar"
//    OU "Nova implantação" se for novo projeto
// 5. Tipo: "Aplicativo da Web"
// 6. Executar como: "Eu (seu email)"
// 7. Quem tem acesso: "Qualquer pessoa"
// 8. Clique em "Implantar"
// 9. Copie a URL gerada (deve ser a mesma que você já tem)
//
// IMPORTANTE: Este script precisa de permissões para acessar seu Google Drive

// ============================================
// CONFIGURAÇÕES
// ============================================

// Pasta pai para PROJETOS DE PESQUISA
const RESEARCH_PARENT_FOLDER_ID = '1gXmR5nUm6B54v8zbs1L_ni57VJ_p5ffs';

// Pasta para uploads gerais (mantida para compatibilidade)
const GENERAL_UPLOAD_FOLDER_ID = '1taSg22f7FCMJAuAeIYReRHpozBnpdQ_m';

// ============================================
// CORS CONFIGURATION
// ============================================
// Google Apps Script automatically allows CORS when deployed as "Anyone"
// No need for custom headers - just return proper JSON responses

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================
// POST HANDLER
// ============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // CREATE PROJECT FOLDER STRUCTURE
    if (action === 'createProjectFolder') {
      const result = createProjectFolderStructure(data.projectTitle);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // UPLOAD FILE TO SPECIFIC FOLDER
    if (action === 'uploadToFolder') {
      const result = uploadFileToFolder(
        data.folderId,
        data.fileName,
        data.fileContent,
        data.mimeType
      );
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // LEGACY: Upload to general folder
    const result = uploadFileToFolder(
      GENERAL_UPLOAD_FOLDER_ID,
      data.fileName,
      data.fileContent,
      data.mimeType
    );
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// GET HANDLER
// ============================================

function doGet(e) {
  try {
    const action = e.parameter.action;

    // DELETE FILE
    if (action === 'deleteFile' && e.parameter.fileId) {
      const file = DriveApp.getFileById(e.parameter.fileId);
      file.setTrashed(true);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Arquivo movido para lixeira'
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    // LIST FILES IN FOLDER
    if (action === 'list') {
      const folderId = e.parameter.folderId || GENERAL_UPLOAD_FOLDER_ID;
      const folder = DriveApp.getFolderById(folderId);
      const files = folder.getFiles();
      const fileList = [];

      while (files.hasNext()) {
        const file = files.next();
        fileList.push(getFileInfo(file));
      }

      fileList.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: fileList.length,
        files: fileList
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    // API STATUS
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Ward Academy Research Folders API v2.0',
      endpoints: {
        'POST createProjectFolder': 'Cria estrutura de pastas para projeto',
        'POST uploadToFolder': 'Upload de arquivo para pasta específica',
        'GET deleteFile': 'Deleta um arquivo',
        'GET list': 'Lista arquivos de uma pasta'
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createProjectFolderStructure(projectTitle) {
  try {
    const parentFolder = DriveApp.getFolderById(RESEARCH_PARENT_FOLDER_ID);

    // Create main project folder
    const mainFolder = parentFolder.createFolder(projectTitle);
    mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);

    // Create subfolders
    const subfolders = {};

    // Level 1 folders
    const databases = mainFolder.createFolder('DATABASES');
    databases.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['DATABASES'] = {
      id: databases.getId(),
      url: databases.getUrl()
    };

    const fullText = mainFolder.createFolder('FULL TEXT REVIEW');
    fullText.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['FULL TEXT REVIEW'] = {
      id: fullText.getId(),
      url: fullText.getUrl()
    };

    const included = mainFolder.createFolder('INCLUDED');
    included.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['INCLUDED'] = {
      id: included.getId(),
      url: included.getUrl()
    };

    const dataExtraction = mainFolder.createFolder('DATA EXTRACTION');
    dataExtraction.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['DATA EXTRACTION'] = {
      id: dataExtraction.getId(),
      url: dataExtraction.getUrl(),
      subfolders: {}
    };

    // Subfolder of DATA EXTRACTION
    const forestPlots = dataExtraction.createFolder('FOREST PLOTS');
    forestPlots.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['DATA EXTRACTION'].subfolders['FOREST PLOTS'] = {
      id: forestPlots.getId(),
      url: forestPlots.getUrl()
    };

    const riskOfBias = mainFolder.createFolder('RISK OF BIAS');
    riskOfBias.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['RISK OF BIAS'] = {
      id: riskOfBias.getId(),
      url: riskOfBias.getUrl()
    };

    const submission = mainFolder.createFolder('SUBMISSION');
    submission.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'] = {
      id: submission.getId(),
      url: submission.getUrl(),
      subfolders: {}
    };

    // Subfolders of SUBMISSION
    const tables = submission.createFolder('TABLES');
    tables.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['TABLES'] = {
      id: tables.getId(),
      url: tables.getUrl()
    };

    const figures = submission.createFolder('FIGURES');
    figures.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    subfolders['SUBMISSION'].subfolders['FIGURES'] = {
      id: figures.getId(),
      url: figures.getUrl()
    };

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
      error: error.toString()
    };
  }
}

function uploadFileToFolder(folderId, fileName, fileContent, mimeType) {
  try {
    // Decode Base64
    const decoded = Utilities.base64Decode(fileContent);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);

    // Save to folder
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);

    // Set permissions
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
      error: error.toString()
    };
  }
}

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
