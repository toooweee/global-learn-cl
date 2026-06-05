import { Command } from '@/libs/application/command.base';

export class CompleteOnboardingStepCommand extends Command {
  readonly onboardingId: string;
  readonly stepId: string;
  readonly selectedOptionIds: string[];
  readonly feedbackText?: string;

  constructor(props: {
    onboardingId: string;
    stepId: string;
    selectedOptionIds: string[];
    feedbackText?: string;
  }) {
    super(props);
    this.onboardingId = props.onboardingId;
    this.stepId = props.stepId;
    this.selectedOptionIds = props.selectedOptionIds;
    this.feedbackText = props.feedbackText;
  }
}
