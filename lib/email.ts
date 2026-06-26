import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVerificationEmailProps {
  to: string;
  token: string;
}

interface SendPasswordResetEmailProps {
  to: string;
  token: string;
}

export async function sendVerificationEmail({
  to,
  token,
}: SendVerificationEmailProps): Promise<void> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || "noreply@yourapp.com",
    to,
    subject: "Verify your email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi there! 👋
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Welcome to our app! Please verify your email address to complete your registration and start using all features.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #0066cc; word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                <strong>🔒 Security note:</strong> This link will expire in 1 hour for your security.
              </p>
              <p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">
                If you didn't create an account, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Calories Counter App. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail({
  to,
  token,
}: SendPasswordResetEmailProps): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || "noreply@yourapp.com",
    to,
    subject: "Reset your password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #0f766e 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password reset</h1>
          </div>

          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background: linear-gradient(135deg, #16a34a 0%, #0f766e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset password
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
              If the button doesn't work, paste this link in your browser:
            </p>
            <p style="font-size: 14px; color: #0066cc; word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                This link expires in 30 minutes. If you didn't request this, you can ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("Password reset email error:", error);
    throw new Error("Failed to send password reset email");
  }
}