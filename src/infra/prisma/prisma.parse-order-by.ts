import { OrderBy } from '@/libs/application';

export const parsePrismaOrderBy = (
  orderBy: OrderBy,
  defaultField = 'createdAt',
) => {
  const field = orderBy.field === true ? defaultField : orderBy.field;
  return { [field]: orderBy.param };
};
