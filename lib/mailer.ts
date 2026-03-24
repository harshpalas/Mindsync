import nodemailer from "nodemailer"

type SendResetEmailInput = {
  to: string
  resetUrl: string
}

function isConfigured(value?: string): value is string {
  return Boolean(value && !value.startsWith("your-"))
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const portRaw = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!isConfigured(host) || !isConfigured(portRaw) || !isConfigured(user) || !isConfigured(pass)) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local")
  }

  const port = Number.parseInt(portRaw, 10)
  if (!Number.isFinite(port)) {
    throw new Error("Invalid SMTP_PORT. It must be a number.")
  }

  const secure = process.env.SMTP_SECURE === "true" || port === 465

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail({ to, resetUrl }: SendResetEmailInput): Promise<void> {
  const from = process.env.SMTP_FROM
  if (!isConfigured(from)) {
    throw new Error("SMTP_FROM is not configured in .env.local")
  }

  const transporter = getTransporter()

  await transporter.sendMail({
    from,
    to,
    subject: "MindSync Password Reset",
    text: `Use this link to reset your password: ${resetUrl}\n\nThis link expires in 15 minutes.`,
    html: `
      <p>Use the link below to reset your MindSync password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  })
}
