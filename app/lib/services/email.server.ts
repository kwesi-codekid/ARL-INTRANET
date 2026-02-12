/**
 * Email Service using Resend API
 * Sends transactional emails including OTP verification
 */

interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

interface EmailConfig {
  apiKey: string;
  from: string;
  fromName: string;
  baseUrl: string;
}

const config: EmailConfig = {
  apiKey: process.env.EMAIL_API_KEY || "",
  from: process.env.EMAIL_FROM || "noreply@arl.com",
  fromName: process.env.EMAIL_FROM_NAME || "ARL Intranet",
  baseUrl: "https://api.resend.com/emails",
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResponse> {
  const { to, subject, html, text } = options;

  // In development mode, log to console instead of sending real email
  if (process.env.NODE_ENV === "development" || !config.apiKey) {
    console.log("=".repeat(50));
    console.log("EMAIL (DEV MODE)");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text || "(HTML only)"}`);
    console.log("HTML Preview:");
    console.log(html.replace(/<[^>]*>/g, "")); // Strip HTML for console
    console.log("=".repeat(50));
    return {
      success: true,
      message: "Email logged to console (dev mode)",
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.from}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      return {
        success: true,
        message: "Email sent successfully",
        messageId: data.id,
      };
    }

    return {
      success: false,
      message: data.message || "Failed to send email",
    };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Email service error",
    };
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<EmailResponse> {
  const subject = "Your ARL Intranet Verification Code";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1B365D 0%, #2A4D82 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #d2ab67; margin: 0; font-size: 24px;">ARL Intranet</h1>
        <p style="color: #fff; margin: 10px 0 0;">Adamus Resources Limited</p>
      </div>

      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1B365D; margin-top: 0;">Verification Code</h2>

        <p>Your one-time verification code is:</p>

        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1B365D;">${otp}</span>
        </div>

        <p style="color: #666; font-size: 14px;">
          This code will expire in <strong>5 minutes</strong>.<br>
          Do not share this code with anyone.
        </p>

        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

        <p style="color: #999; font-size: 12px; margin-bottom: 0;">
          If you didn't request this code, please ignore this email or contact IT support.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>Adamus Resources Limited<br>Internal Use Only</p>
      </div>
    </body>
    </html>
  `;

  const text = `Your ARL Intranet verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

  return sendEmail({ to: email, subject, html, text });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
