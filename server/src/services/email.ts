import nodemailer from 'nodemailer';

export const sendRealEmail = async (
  to: string,
  subject: string,
  body: string,
  attachments?: Array<{ filename: string; path: string }>
): Promise<any> => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  const isGmailConfigured = !!(smtpUser && smtpPass);
  let gmailMessageId = '';
  let previewUrl = '';
  let serviceUsed = 'Ethereal SMTP Test';

  // 1. Send via Gmail if configured
  if (isGmailConfigured) {
    try {
      console.log(`Dual Mode: Delivering real email via Gmail SMTP to: ${to}`);
      const gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions: any = {
        from: `"FlowGenius AI" <${smtpFrom}>`,
        to,
        subject,
        text: body,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      const info = await gmailTransporter.sendMail(mailOptions);
      gmailMessageId = info.messageId;
      serviceUsed = 'Gmail SMTP + Ethereal Preview';
    } catch (error: any) {
      console.error('Gmail SMTP send failed in Dual Mode:', error);
      throw new Error(`Gmail SMTP delivery failed: ${error.message}`);
    }
  }

  // 2. Always generate Ethereal preview for debugging (or fallback mode)
  try {
    console.log(`Ethereal Mode: Generating preview URL for: ${to}`);
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const mailOptions: any = {
      from: `"FlowGenius AI Debug" <flowgenius-test@ethereal.email>`,
      to,
      subject,
      text: body,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await etherealTransporter.sendMail(mailOptions);
    previewUrl = nodemailer.getTestMessageUrl(info) || '';
    console.log(`Ethereal Preview URL generated: ${previewUrl}`);
  } catch (error: any) {
    console.error('Ethereal SMTP send failed:', error);
    if (!isGmailConfigured) {
      // If no Gmail configured and Ethereal fails, throw the error
      throw new Error(`Ethereal SMTP delivery failed: ${error.message}`);
    }
  }

  const attachmentName = attachments && attachments.length > 0 ? attachments[0].filename : undefined;

  return {
    status: 'sent',
    to,
    subject,
    timestamp: new Date().toISOString(),
    attachmentName,
    attachments: attachments && attachments.length > 0
      ? attachments.map(a => ({ filename: a.filename, path: a.path }))
      : undefined,
    gmailMessageId: gmailMessageId || undefined,
    previewUrl: previewUrl || undefined,
    serviceUsed,
  };
};

