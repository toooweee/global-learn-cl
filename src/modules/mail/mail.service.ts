import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;

  constructor(private readonly envService: EnvService) {}

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.envService.get('SMTP_HOST'),
      port: this.envService.get('SMTP_PORT'),
    });
  }

  private send(to: string, subject: string, html: string): Promise<void> {
    return this.transporter
      .sendMail({ from: this.envService.get('SMTP_FROM'), to, subject, html })
      .then(() => undefined);
  }

  sendOnboardingAssigned(
    to: string,
    data: { startDate: string; endDate: string },
  ): Promise<void> {
    return this.send(
      to,
      'Вам назначен онбординг',
      `<p>Вам назначен онбординг.</p>
       <p>Период: <strong>${data.startDate}</strong> — <strong>${data.endDate}</strong></p>`,
    );
  }

  sendCourseEnrollmentApproved(
    to: string,
    data: { courseName: string },
  ): Promise<void> {
    return this.send(
      to,
      'Заявка на курс одобрена',
      `<p>Ваша заявка на курс <strong>${data.courseName}</strong> одобрена.</p>`,
    );
  }

  sendEmployeeInvite(
    to: string,
    data: { email: string; tempPassword: string },
  ): Promise<void> {
    return this.send(
      to,
      'Добро пожаловать в GlobalLearn',
      `<p>Ваш аккаунт создан.</p>
       <p>Email: <strong>${data.email}</strong></p>
       <p>Пароль: <strong>${data.tempPassword}</strong></p>`,
    );
  }
}
