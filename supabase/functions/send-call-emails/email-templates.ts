// =====================================================
// EMAIL TEMPLATES FOR SCHEDULED CALLS
// =====================================================

interface CallData {
  student_name: string;
  student_email: string;
  student_whatsapp: string;
  mentor_name: string;
  mentor_email: string;
  mentor_whatsapp: string;
  scheduled_date: string;
  scheduled_time: string;
  call_notes: string;
  landmark_title: string;
}

// Format WhatsApp link
function formatWhatsApp(phone: string): string {
  if (!phone) return 'Não informado';
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  return `<a href="https://wa.me/${cleanPhone}" style="color: #25D366; text-decoration: none;">https://wa.me/${cleanPhone}</a>`;
}

// Format date in Brazilian format
function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// =====================================================
// MENTOR EMAIL TEMPLATES
// =====================================================

export function getMentorImmediateEmail(data: CallData): { subject: string; html: string } {
  return {
    subject: `📞 Nova Chamada Agendada - ${data.student_name} - ${formatDate(data.scheduled_date)}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 4px; }
    .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
    .value { color: #374151; margin-bottom: 15px; }
    .highlight { background: #fef3c7; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .footer { background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎓 Ward Academy</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Nova Chamada Agendada</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #374151;">Olá, <strong>${data.mentor_name}</strong>!</p>
      <p>Uma nova chamada foi agendada com você:</p>

      <div class="info-box">
        <div class="label">📅 DATA E HORÁRIO</div>
        <div class="value" style="font-size: 18px; font-weight: bold; color: #667eea;">
          ${formatDate(data.scheduled_date)} às ${data.scheduled_time}
        </div>

        <div class="label">👤 ALUNO</div>
        <div class="value">${data.student_name}</div>

        <div class="label">📧 EMAIL DO ALUNO</div>
        <div class="value">${data.student_email}</div>

        <div class="label">📱 WHATSAPP DO ALUNO</div>
        <div class="value">${formatWhatsApp(data.student_whatsapp)}</div>

        <div class="label">📚 TEMA DA CHAMADA</div>
        <div class="value">${data.landmark_title || 'Não especificado'}</div>

        ${data.call_notes ? `
        <div class="label">📝 OBSERVAÇÕES</div>
        <div class="value" style="white-space: pre-wrap;">${data.call_notes}</div>
        ` : ''}
      </div>

      <div class="highlight">
        <strong>⏰ Lembretes:</strong><br>
        • Você receberá um lembrete 24 horas antes<br>
        • Você receberá outro lembrete 12 horas antes
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0; font-size: 14px;">Ward Academy - Sistema de Agendamento de Chamadas</p>
    </div>
  </div>
</body>
</html>
    `
  };
}

export function getMentor24hReminderEmail(data: CallData): { subject: string; html: string } {
  return {
    subject: `⏰ LEMBRETE: Chamada amanhã com ${data.student_name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fffbeb; padding: 30px; border: 1px solid #fde68a; }
    .alert { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }
    .label { font-weight: bold; color: #f59e0b; margin-bottom: 5px; }
    .value { color: #374151; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">⏰ LEMBRETE</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Chamada em 24 horas</p>
    </div>

    <div class="content">
      <div class="alert">
        <h2 style="margin: 0 0 10px 0; color: #92400e;">Chamada amanhã!</h2>
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">
          ${formatDate(data.scheduled_date)} às ${data.scheduled_time}
        </p>
      </div>

      <div class="info-box">
        <div class="label">👤 ALUNO</div>
        <div class="value">${data.student_name}</div>

        <div class="label">📧 EMAIL</div>
        <div class="value">${data.student_email}</div>

        <div class="label">📱 WHATSAPP</div>
        <div class="value">${formatWhatsApp(data.student_whatsapp)}</div>

        <div class="label">📚 TEMA</div>
        <div class="value">${data.landmark_title || 'Não especificado'}</div>

        ${data.call_notes ? `
        <div class="label">📝 OBSERVAÇÕES</div>
        <div class="value" style="white-space: pre-wrap;">${data.call_notes}</div>
        ` : ''}
      </div>

      <p style="text-align: center; margin: 20px 0;">
        <em>Você receberá mais um lembrete 12 horas antes da chamada.</em>
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

export function getMentor12hReminderEmail(data: CallData): { subject: string; html: string } {
  return {
    subject: `🔔 ÚLTIMO LEMBRETE: Chamada HOJE com ${data.student_name} às ${data.scheduled_time}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fef2f2; padding: 30px; border: 1px solid #fecaca; }
    .urgent { background: #fee2e2; border: 3px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 4px; }
    .label { font-weight: bold; color: #dc2626; margin-bottom: 5px; }
    .value { color: #374151; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🔔 ÚLTIMO LEMBRETE</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Chamada em algumas horas!</p>
    </div>

    <div class="content">
      <div class="urgent">
        <h2 style="margin: 0 0 10px 0; color: #7f1d1d;">Chamada HOJE!</h2>
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #7f1d1d;">
          ${data.scheduled_time}
        </p>
      </div>

      <div class="info-box">
        <div class="label">👤 ALUNO</div>
        <div class="value">${data.student_name}</div>

        <div class="label">📧 EMAIL</div>
        <div class="value">${data.student_email}</div>

        <div class="label">📱 WHATSAPP</div>
        <div class="value">${formatWhatsApp(data.student_whatsapp)}</div>

        <div class="label">📚 TEMA</div>
        <div class="value">${data.landmark_title || 'Não especificado'}</div>

        ${data.call_notes ? `
        <div class="label">📝 OBSERVAÇÕES</div>
        <div class="value" style="white-space: pre-wrap;">${data.call_notes}</div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
    `
  };
}

// =====================================================
// STUDENT EMAIL TEMPLATES
// =====================================================

export function getStudentImmediateEmail(data: CallData): { subject: string; html: string } {
  return {
    subject: `✅ Chamada Confirmada com ${data.mentor_name} - ${formatDate(data.scheduled_date)}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f0fdf4; padding: 30px; border: 1px solid #bbf7d0; }
    .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #10b981; border-radius: 4px; }
    .label { font-weight: bold; color: #10b981; margin-bottom: 5px; }
    .value { color: #374151; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Chamada Confirmada!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Sua chamada foi agendada com sucesso</p>
    </div>

    <div class="content">
      <div class="success-box">
        <p style="margin: 0; font-size: 20px; font-weight: bold; color: #065f46;">
          ${formatDate(data.scheduled_date)} às ${data.scheduled_time}
        </p>
      </div>

      <div class="info-box">
        <div class="label">👨‍⚕️ MENTOR</div>
        <div class="value" style="font-size: 18px; font-weight: bold;">${data.mentor_name}</div>

        <div class="label">📱 WHATSAPP DO MENTOR</div>
        <div class="value">${formatWhatsApp(data.mentor_whatsapp)}</div>

        <div class="label">📚 TEMA DA CHAMADA</div>
        <div class="value">${data.landmark_title || 'Não especificado'}</div>

        ${data.call_notes ? `
        <div class="label">📝 OBSERVAÇÕES</div>
        <div class="value" style="white-space: pre-wrap;">${data.call_notes}</div>
        ` : ''}
      </div>

      <p style="background: #ecfdf5; padding: 15px; border-radius: 4px; text-align: center;">
        <strong>⏰ Você receberá lembretes:</strong><br>
        24 horas antes e 12 horas antes da chamada
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

export function getStudent24hReminderEmail(data: CallData): { subject: string; html: string } {
  return {
    subject: `⏰ Lembrete: Chamada amanhã com ${data.mentor_name}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #eff6ff; padding: 30px; border: 1px solid #bfdbfe; }
    .reminder-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 4px; }
    .label { font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
    .value { color: #374151; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⏰ Lembrete de Chamada</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Sua chamada é amanhã!</p>
    </div>

    <div class="content">
      <div class="reminder-box">
        <h2 style="margin: 0 0 10px 0; color: #1e40af;">Chamada Amanhã</h2>
        <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1e40af;">
          ${formatDate(data.scheduled_date)} às ${data.scheduled_time}
        </p>
      </div>

      <div class="info-box">
        <div class="label">👨‍⚕️ MENTOR</div>
        <div class="value" style="font-size: 18px; font-weight: bold;">${data.mentor_name}</div>

        <div class="label">📱 WHATSAPP DO MENTOR</div>
        <div class="value">${formatWhatsApp(data.mentor_whatsapp)}</div>

        <div class="label">📚 TEMA</div>
        <div class="value">${data.landmark_title || 'Não especificado'}</div>
      </div>

      <p style="text-align: center; margin: 20px 0;">
        <em>Você receberá mais um lembrete 12 horas antes da chamada.</em>
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

export function getStudent12hReminderEmail(data: CallData): { subject: string; html: string } {
  return {
    subject: `🔔 HOJE: Chamada com ${data.mentor_name} às ${data.scheduled_time}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #faf5ff; padding: 30px; border: 1px solid #e9d5ff; }
    .urgent-box { background: #ede9fe; border: 3px solid #8b5cf6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #8b5cf6; border-radius: 4px; }
    .label { font-weight: bold; color: #8b5cf6; margin-bottom: 5px; }
    .value { color: #374151; margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 32px;">🔔 Chamada Hoje!</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Prepare-se para sua chamada</p>
    </div>

    <div class="content">
      <div class="urgent-box">
        <h2 style="margin: 0 0 10px 0; color: #5b21b6;">Chamada em Breve!</h2>
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #5b21b6;">
          Hoje às ${data.scheduled_time}
        </p>
      </div>

      <div class="info-box">
        <div class="label">👨‍⚕️ MENTOR</div>
        <div class="value" style="font-size: 18px; font-weight: bold;">${data.mentor_name}</div>

        <div class="label">📱 WHATSAPP DO MENTOR</div>
        <div class="value">${formatWhatsApp(data.mentor_whatsapp)}</div>

        <div class="label">📚 TEMA</div>
        <div class="value">${data.landmark_title || 'Não especificado'}</div>

        ${data.call_notes ? `
        <div class="label">📝 OBSERVAÇÕES</div>
        <div class="value" style="white-space: pre-wrap;">${data.call_notes}</div>
        ` : ''}
      </div>

      <p style="background: #f5f3ff; padding: 15px; border-radius: 4px; text-align: center; font-weight: bold;">
        Não esqueça de se preparar! 📚
      </p>
    </div>
  </div>
</body>
</html>
    `
  };
}

// =====================================================
// TEMPLATE SELECTOR
// =====================================================
export function getEmailTemplate(recipientType: string, emailType: string, data: CallData): { subject: string; html: string } {
  if (recipientType === 'mentor') {
    switch (emailType) {
      case 'immediate':
        return getMentorImmediateEmail(data);
      case '24h_before':
        return getMentor24hReminderEmail(data);
      case '12h_before':
        return getMentor12hReminderEmail(data);
      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }
  } else if (recipientType === 'student') {
    switch (emailType) {
      case 'immediate':
        return getStudentImmediateEmail(data);
      case '24h_before':
        return getStudent24hReminderEmail(data);
      case '12h_before':
        return getStudent12hReminderEmail(data);
      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }
  } else {
    throw new Error(`Unknown recipient type: ${recipientType}`);
  }
}
