import nodemailer from 'nodemailer';

interface EmailParams {
  to: string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create email service that works with multiple providers
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.setupTransporter();
    console.log('Email service initialized. Configured:', this.isConfigured());
    if (this.isConfigured()) {
      console.log('SMTP configured with email:', process.env.SMTP_EMAIL);
    }
  }

  private setupTransporter() {
    // Check for Gmail SMTP configuration
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD, // App password, not regular password
        },
      });
    }
    // Check for general SMTP configuration
    else if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.transporter) {
      console.log('❌ Email service not configured - skipping email send');
      return false;
    }

    console.log('📧 Attempting to send email to:', params.to.join(', '));
    console.log('📧 Subject:', params.subject);

    try {
      const mailOptions = {
        from: params.from,
        to: params.to.join(', '),
        subject: params.subject,
        text: params.text,
        html: params.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully! Message ID:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendAssessmentInvitation(
    emails: string[],
    assessmentTitle: string,
    assessmentUrl: string,
    customMessage?: string,
    fromEmail: string = process.env.FROM_EMAIL || 'noreply@leantechnovations.com'
  ): Promise<boolean> {
    const subject = `You're invited to take "${assessmentTitle}" assessment`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">LeanTechnovAtions</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Assessment Invitation</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #374151; margin: 0 0 20px 0;">You're invited to take an assessment</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0;">
            You have been invited to take the <strong>"${assessmentTitle}"</strong> assessment.
          </p>
          
          ${customMessage ? `
            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #374151; margin: 0; line-height: 1.6;">${customMessage}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${assessmentUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Start Assessment
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #f59e0b;">${assessmentUrl}</span>
          </p>
        </div>
        
        <div style="text-align: center; margin: 20px 0; color: #9ca3af; font-size: 12px;">
          © 2025 LeanTechnovAtions. All rights reserved.
        </div>
      </div>
    `;

    const text = `
You're invited to take "${assessmentTitle}" assessment

${customMessage ? customMessage + '\n\n' : ''}

To start the assessment, visit: ${assessmentUrl}

© 2025 LeanTechnovAtions. All rights reserved.
    `;

    return await this.sendEmail({
      to: emails,
      from: fromEmail,
      subject,
      text,
      html,
    });
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }
}

export const emailService = new EmailService();