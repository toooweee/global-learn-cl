import { Injectable } from '@nestjs/common';
import type { Lesson as LessonRecord } from '@generated/client';
import { ToDomain } from '@/libs/ddd/mapper.interface';
import { LessonEntity } from '@/modules/education/lesson/domain/lesson.entity';

@Injectable()
export class LessonMapper implements ToDomain<LessonRecord, LessonEntity> {
  toDomain(row: LessonRecord): LessonEntity {
    return LessonEntity.recreate({
      id: row.id,
      props: {
        name: row.name,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  }
}
