import { Entity } from '@/libs/ddd/entity.base';

export interface Mapper<
  DomainEntity extends Entity<any>,
  DbRecord,
  ResponseDto,
> {
  toDomain: (record: DbRecord) => DomainEntity;
  toPersistence: (entity: DomainEntity) => DbRecord;
  toResponse: (entity: DomainEntity) => ResponseDto;
}
