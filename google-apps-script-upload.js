// ============================================
// WARD ACADEMY - FILE UPLOAD API
// Google Apps Script Backend
// ============================================
//
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 1. Acesse: https://script.google.com
// 2. Cole este código substituindo o existente
// 3. No menu "Implantar" > "Nova implantação"
// 4. Tipo: "Aplicativo da Web"
// 5. Executar como: "Eu (seu email)"
// 6. Quem tem acesso: "Qualquer pessoa"
// 7. Copie a URL gerada e use no código HTML
//
// IMPORTANTE: Este script precisa de permissões para acessar seu Google Drive

// ID da pasta no Google Drive
// Pasta: https://drive.google.com/drive/u/3/folders/1taSg22f7FCMJAuAeIYReRHpozBnpdQ_m
const FOLDER_ID = '1taSg22f7FCMJAuAeIYReRHpozBnpdQ_m';

// Configuração CORS para permitir requisições do GitHub Pages
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================
// POST - Recebe e salva arquivos
// ============================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const fileName = data.fileName;
    const fileContent = data.fileContent; // Base64
    const mimeType = data.mimeType;

    // Decodifica o Base64
    const decoded = Utilities.base64Decode(fileContent);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);

    // Salva na pasta do Drive
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(blob);

    // Configura permissão: qualquer pessoa com link pode ver
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Retorna os dados do arquivo
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl(),
      directLink: 'https://drive.google.com/uc?id=' + file.getId(),
      viewLink: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      mimeType: file.getMimeType(),
      size: file.getSize(),
      dateCreated: file.getDateCreated().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// GET - Lista arquivos ou retorna status
// ============================================
function doGet(e) {
  try {
    const action = e.parameter.action;

    // Listar todos os arquivos da pasta
    if (action === 'list') {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const files = folder.getFiles();
      const fileList = [];

      while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();

        fileList.push({
          fileId: file.getId(),
          fileName: file.getName(),
          fileUrl: file.getUrl(),
          directLink: 'https://drive.google.com/uc?id=' + file.getId(),
          viewLink: 'https://drive.google.com/file/d/' + file.getId() + '/view',
          downloadLink: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
          thumbnail: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400',
          mimeType: mimeType,
          size: file.getSize(),
          dateCreated: file.getDateCreated().toISOString(),
          isImage: mimeType.startsWith('image/'),
          isPDF: mimeType === 'application/pdf',
          isVideo: mimeType.startsWith('video/'),
          isAudio: mimeType.startsWith('audio/')
        });
      }

      // Ordena por data (mais recente primeiro)
      fileList.sort(function(a, b) {
        return new Date(b.dateCreated) - new Date(a.dateCreated);
      });

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: fileList.length,
        files: fileList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Deletar arquivo específico
    if (action === 'delete' && e.parameter.fileId) {
      const file = DriveApp.getFileById(e.parameter.fileId);
      file.setTrashed(true);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Arquivo movido para lixeira'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Resposta padrão - status da API
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Ward Academy File Upload API v1.0',
      endpoints: {
        'GET ?action=list': 'Lista todos os arquivos',
        'GET ?action=delete&fileId=XXX': 'Deleta um arquivo',
        'POST': 'Upload de arquivo (fileName, fileContent, mimeType)'
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
