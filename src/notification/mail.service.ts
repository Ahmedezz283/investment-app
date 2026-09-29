import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: { user, pass: password },
    });
  }

  sendNotification(
    recipient: string,
    subject: string,
    text: string,
  ): Promise<unknown> {
    this.assertSmtpConfigured();

    return this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? this.configService.get<string>('SMTP_USER'),
      to: recipient,
      subject,
      text,
    });
  }

  sendReportNotification(
    recipient: string,
    subject: string,
    text: string,
    pdf: Buffer,
    filename: string,
  ): Promise<unknown> {
    this.assertSmtpConfigured();

    return this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') ?? this.configService.get<string>('SMTP_USER'),
      to: recipient,
      subject,
      text,
      attachments: [{
        filename,
        content: pdf,
        contentType: 'application/pdf',
      }],
    });
  }

  private assertSmtpConfigured(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    if (!host || !user || !password) {
      throw new ServiceUnavailableException('SMTP configuration is incomplete');
    }
  }
}
