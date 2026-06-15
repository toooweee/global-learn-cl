import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;

  constructor(private readonly envService: EnvService) {}

  onModuleInit(): void {
    const port = this.envService.get('SMTP_PORT');
    const user = this.envService.get('SMTP_USER');
    const pass = this.envService.get('SMTP_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host: this.envService.get('SMTP_HOST'),
      port,
      // Port 465 = implicit TLS; 587/others negotiate STARTTLS.
      secure: port === 465,
      // No auth for local MailHog; real SMTP requires credentials.
      auth: user && pass ? { user, pass } : undefined,
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
    data: { fullname: string; inviteLink: string },
  ): Promise<void> {
    return this.send(
      to,
      'Добро пожаловать в GlobalLearn',
      `<p>Здравствуйте, <strong>${data.fullname}</strong>!</p>
       <p>Для вас создан аккаунт в системе обучения GlobalLearn.</p>
       <p>Для завершения регистрации и установки пароля перейдите по ссылке:</p>
       <p><a href="${data.inviteLink}">${data.inviteLink}</a></p>
       <p>Ссылка действительна 7 дней.</p>`,
    );
  }

  sendPasswordReset(to: string, data: { resetLink: string }): Promise<void> {
    return this.send(
      to,
      'Сброс пароля GlobalLearn',
      `<p>Вы запросили сброс пароля.</p>
       <p>Перейдите по ссылке для установки нового пароля:</p>
       <p><a href="${data.resetLink}">${data.resetLink}</a></p>
       <p>Ссылка действительна 1 час. Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>`,
    );
  }

  sendOnboardingCompleted(
    to: string,
    data: { onboardingName: string },
  ): Promise<void> {
    return this.send(
      to,
      'Онбординг завершён',
      `<p>Поздравляем! Вы успешно завершили онбординг <strong>${data.onboardingName}</strong>.</p>`,
    );
  }

  sendEmployeePromoted(
    to: string,
    data: { fullname: string; positionName: string },
  ): Promise<void> {
    return this.send(
      to,
      'Изменение должности',
      `<p>Уважаемый(ая) <strong>${data.fullname}</strong>!</p>
       <p>Ваша должность изменена на <strong>${data.positionName}</strong>.</p>`,
    );
  }
}
