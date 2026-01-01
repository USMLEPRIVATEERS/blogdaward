/**
 * Google Apps Script para Upload de Arquivos para Google Drive
 *
 * INSTRUÇÕES DE CONFIGURAÇÃO:
 * 1. Acesse: https://script.google.com
 * 2. Cole este código substituindo o existente
 * 3. No menu "Implantar" > "Nova implantação"
 * 4. Tipo: "Aplicativo da Web"
 * 5. Executar como: "Eu (seu email)"
 * 6. Quem tem acesso: "Qualquer pessoa"
 * 7. Copie a URL gerada e use no código HTML
 *
 * IMPORTANTE: Este script precisa de permissões para acessar seu Google Drive
 */

// ID da pasta do Google Drive onde os arquivos serão salvos
// Pasta: https://drive.google.com/drive/u/3/folders/1taSg22f7FCMJAuAeIYReRHpozBnpdQ_m
const FOLDER_ID = '1taSg22f7FCMJAuAeIYReRHpozBnpdQ_m';

function doPost(e) {
  try {
    // Obter dados do JSON payload
    const payload = JSON.parse(e.postData.contents);
    const fileName = payload.fileName;
    const fileData = payload.fileData;
    const mimeType = payload.mimeType;

    // Validar dados
    if (!fileName || !fileData) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Dados incompletos'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Decodificar Base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );

    // Obter pasta do Drive
    const folder = DriveApp.getFolderById(FOLDER_ID);

    // Criar arquivo no Drive
    const file = folder.createFile(blob);

    // Configurar permissões (Qualquer pessoa com o link pode visualizar)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Obter ID do arquivo
    const fileId = file.getId();

    // Construir URLs
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    const downloadUrl = `https://drive.google.com/uc?id=${fileId}`;

    // Retornar resposta com CORS habilitado
    const output = ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      fileName: fileName,
      viewUrl: viewUrl,
      downloadUrl: downloadUrl,
      message: 'Arquivo enviado com sucesso'
    }));

    output.setMimeType(ContentService.MimeType.JSON);

    return output;

  } catch (error) {
    // Retornar erro
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Para testes via GET
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script está funcionando!',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
