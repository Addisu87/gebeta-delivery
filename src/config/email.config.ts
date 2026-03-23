export type EmailConfig = {
  provider: 'sendgrid' | 'smtp' | 'mailtrap';
  fromEmail: string;
  sendgridApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure: boolean;
};

export const emailConfig = () => ({
  email: {
    provider:
      (process.env.EMAIL_PROVIDER as 'sendgrid' | 'smtp' | 'mailtrap') ??
      'mailtrap',
    fromEmail:
      process.env.SMTP_FROM ??
      process.env.EMAIL_FROM ??
      'no-reply@gebeta.local',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    smtpHost:
      process.env.SMTP_HOST ??
      (process.env.EMAIL_PROVIDER === 'mailtrap'
        ? 'live.smtp.mailtrap.io'
        : undefined),
    smtpPort: process.env.SMTP_PORT
      ? Number.parseInt(process.env.SMTP_PORT, 10)
      : 587,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: (process.env.SMTP_SECURE ?? 'false') === 'true',
  } satisfies EmailConfig,
});
