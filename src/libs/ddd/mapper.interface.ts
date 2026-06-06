import { Entity } from '@/libs/ddd/entity.base';

export interface ToDomain<DbRecord, DomainEntity> {
  toDomain(record: DbRecord): DomainEntity;
}

export interface ToPersistence<DomainEntity, DbRecord> {
  toPersistence(entity: DomainEntity): DbRecord;
}

export interface ToResponse<DomainEntity, ResponseDto> {
  toResponse(entity: DomainEntity): ResponseDto;
}

export interface Mapper<DomainEntity extends Entity<any>, DbRecord, ResponseDto>
  extends
    ToDomain<DbRecord, DomainEntity>,
    ToPersistence<DomainEntity, DbRecord>,
    ToResponse<DomainEntity, ResponseDto> {}
