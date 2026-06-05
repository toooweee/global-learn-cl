export interface OnboardingChatMessageProps {
  id: string;
  senderId: string;
  body: string;
  readAt?: Date;
  createdAt: Date;
}

export interface OnboardingChatProps {
  onboardingId: string;
  messages: OnboardingChatMessageProps[];
  createdAt: Date;
}
