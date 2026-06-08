import { Global, Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { OnboardingChatGateway } from './onboarding-chat.gateway';

@Global()
@Module({
  providers: [NotificationsGateway, OnboardingChatGateway],
  exports: [NotificationsGateway, OnboardingChatGateway],
})
export class GatewayModule {}
