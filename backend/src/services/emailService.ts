import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface PriceAlertData {
  tokenSymbol: string;
  currentPrice: number;
  threshold: number;
  condition: 'above' | 'below' | 'equal';
}

interface PredictionAlertData {
  tokenSymbol: string;
  predictedPrice: number;
  currentPrice: number;
  confidence: number;
  timeframe: string;
}

interface RiskAlertData {
  tokenSymbol: string;
  riskScore: number;
  riskLevel: string;
  previousScore?: number;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (process.env.NODE_ENV === 'production') {
      // Production: Use SMTP service (e.g., SendGrid, AWS SES, Gmail)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      logger.info('Email service initialized with SMTP transporter');
    } else {
      // Development: Use Ethereal email (fake SMTP service for testing)
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      logger.info('Email service initialized with Ethereal test account', {
        user: testAccount.user,
        pass: testAccount.pass,
      });
    } catch (error) {
      logger.error('Failed to create test email account:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Email transporter not initialized, skipping email');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"CryptoSense" <noreply@cryptosense.io>',
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html: options.html,
      });

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Email sent (preview):', {
          messageId: info.messageId,
          previewUrl: nodemailer.getTestMessageUrl(info),
        });
      } else {
        logger.info('Email sent successfully', {
          messageId: info.messageId,
          to: options.to,
        });
      }

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendPriceAlert(to: string, data: PriceAlertData): Promise<boolean> {
    const conditionText =
      data.condition === 'above' ? 'risen above' : data.condition === 'below' ? 'fallen below' : 'reached';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; color: #3B82F6; margin-bottom: 20px; }
            .content { margin-bottom: 20px; }
            .price-box { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .price { font-size: 36px; font-weight: bold; color: #3B82F6; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); font-size: 14px; }
            .btn { display: inline-block; background: #3B82F6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔮</div>
              <div class="title">Price Alert Triggered</div>
            </div>
            <div class="content">
              <p>Your price alert for <strong>${data.tokenSymbol}</strong> has been triggered!</p>
              <p>The price has <strong>${conditionText}</strong> your threshold of <strong>$${data.threshold.toLocaleString()}</strong>.</p>
              <div class="price-box">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 10px;">Current Price</div>
                <div class="price">$${data.currentPrice.toLocaleString()}</div>
              </div>
              <p>View your portfolio and manage your alerts in the CryptoSense dashboard.</p>
              <center>
                <a href="${config.appUrl}/alerts" class="btn">Manage Alerts</a>
              </center>
            </div>
            <div class="footer">
              <p>This alert was sent from CryptoSense. You can disable this alert in your <a href="${config.appUrl}/alerts" style="color: #3B82F6;">alert settings</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `🚨 ${data.tokenSymbol} Price Alert: $${data.currentPrice.toLocaleString()}`,
      html,
    });
  }

  async sendPredictionAlert(to: string, data: PredictionAlertData): Promise<boolean> {
    const changePercent = ((data.predictedPrice - data.currentPrice) / data.currentPrice) * 100;
    const direction = changePercent > 0 ? 'increase' : 'decrease';
    const color = changePercent > 0 ? '#10B981' : '#EF4444';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; color: #10B981; margin-bottom: 20px; }
            .prediction-box { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; }
            .confidence { font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); font-size: 14px; }
            .btn { display: inline-block; background: #10B981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🤖</div>
              <div class="title">AI Prediction Alert</div>
            </div>
            <div class="content">
              <p>Our AI model has generated a new prediction for <strong>${data.tokenSymbol}</strong> with high confidence!</p>
              <div class="prediction-box">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">Predicted ${data.timeframe} Price</div>
                <div style="font-size: 36px; font-weight: bold; color: ${color}; margin: 10px 0;">$${data.predictedPrice.toLocaleString()}</div>
                <div style="font-size: 18px; color: ${color};">${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}% ${direction}</div>
                <div class="confidence">Confidence: ${(data.confidence * 100).toFixed(1)}%</div>
              </div>
              <p><strong>Current Price:</strong> $${data.currentPrice.toLocaleString()}</p>
              <center>
                <a href="${config.appUrl}/dashboard" class="btn">View Dashboard</a>
              </center>
            </div>
            <div class="footer">
              <p>This is not financial advice. Always do your own research before making investment decisions.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `🤖 ${data.tokenSymbol} AI Prediction: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}% (${data.timeframe})`,
      html,
    });
  }

  async sendRiskAlert(to: string, data: RiskAlertData): Promise<boolean> {
    const riskColor =
      data.riskScore < 30 ? '#10B981' : data.riskScore < 50 ? '#3B82F6' : data.riskScore < 70 ? '#F59E0B' : '#EF4444';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 32px; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; color: #EF4444; margin-bottom: 20px; }
            .risk-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .risk-score { font-size: 48px; font-weight: bold; color: ${riskColor}; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); font-size: 14px; }
            .btn { display: inline-block; background: #EF4444; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚠️</div>
              <div class="title">Risk Score Alert</div>
            </div>
            <div class="content">
              <p>The risk score for <strong>${data.tokenSymbol}</strong> has changed significantly!</p>
              <div class="risk-box">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 10px;">Degen Risk Score</div>
                <div class="risk-score">${data.riskScore}/100</div>
                <div style="font-size: 18px; color: rgba(255, 255, 255, 0.7); margin-top: 10px;">${data.riskLevel}</div>
                ${
                  data.previousScore
                    ? `<div style="font-size: 14px; color: rgba(255, 255, 255, 0.5); margin-top: 10px;">Previous: ${data.previousScore}/100</div>`
                    : ''
                }
              </div>
              <p>Review your portfolio and consider adjusting your position based on this risk assessment.</p>
              <center>
                <a href="${config.appUrl}/dashboard" class="btn">View Portfolio</a>
              </center>
            </div>
            <div class="footer">
              <p>This is not financial advice. Risk scores are calculated based on multiple factors and should be used as one of many tools for investment decisions.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `⚠️ ${data.tokenSymbol} Risk Score: ${data.riskScore}/100 (${data.riskLevel})`,
      html,
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 48px; margin-bottom: 10px; }
            .title { font-size: 28px; font-weight: bold; color: #3B82F6; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); font-size: 14px; }
            .btn { display: inline-block; background: #3B82F6; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
            .warning { background: rgba(245, 158, 11, 0.1); border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✉️</div>
              <div class="title">Verify Your Email</div>
            </div>
            <div class="content">
              <p>Welcome to Coinsphere! To complete your registration and access all features, please verify your email address.</p>
              <center>
                <a href="${verificationUrl}" class="btn">Verify Email Address</a>
              </center>
              <p style="margin-top: 20px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 4px; font-size: 12px;">${verificationUrl}</p>
              <div class="warning">
                <strong>⏰ Expires in 24 hours</strong> - This verification link will expire in 24 hours for security.
              </div>
              <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">If you didn't create a Coinsphere account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Coinsphere. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: '✉️ Verify your email address - Coinsphere',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 48px; margin-bottom: 10px; }
            .title { font-size: 28px; font-weight: bold; color: #EF4444; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); font-size: 14px; }
            .btn { display: inline-block; background: #EF4444; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
            .warning { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐</div>
              <div class="title">Password Reset</div>
            </div>
            <div class="content">
              <p>We received a request to reset your password for your Coinsphere account.</p>
              <center>
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </center>
              <p style="margin-top: 20px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 4px; font-size: 12px;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>© 2025 Coinsphere. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: '🔐 Reset your password - Coinsphere',
      html,
    });
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 48px; margin-bottom: 10px; }
            .title { font-size: 28px; font-weight: bold; color: #3B82F6; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); font-size: 14px; }
            .btn { display: inline-block; background: #3B82F6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            .feature { margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔮</div>
              <div class="title">Welcome to CryptoSense!</div>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Welcome to <strong>CryptoSense</strong> - your AI-powered crypto portfolio tracker! We're excited to have you on board.</p>
              <h3 style="color: #3B82F6; margin-top: 30px;">What you can do:</h3>
              <div class="feature">📊 Track your portfolio across multiple blockchains</div>
              <div class="feature">🤖 Get AI-powered price predictions with 70%+ accuracy</div>
              <div class="feature">⚠️ Monitor risk scores (0-100 Degen Scale)</div>
              <div class="feature">🔔 Set intelligent price and risk alerts</div>
              <div class="feature">📈 Visualize performance with beautiful charts</div>
              <center>
                <a href="${config.appUrl}/dashboard" class="btn">Go to Dashboard</a>
              </center>
            </div>
            <div class="footer">
              <p>Need help? Check out our <a href="${config.appUrl}/docs" style="color: #3B82F6;">documentation</a> or contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: '🎉 Welcome to CryptoSense!',
      html,
    });
  }
}

export const emailService = new EmailService();
