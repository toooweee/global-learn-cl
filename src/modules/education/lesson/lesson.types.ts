export interface LessonProps {
  name: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateLessonProps {
  name: string;
  content?: string;
}
