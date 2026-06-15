import { Prisma } from '@generated/client';
import { ROLE } from '@/libs/auth/roles.constants';

/**
 * Org-unit scoping for the "my subordinates" views.
 *
 * The position hierarchy alone is company-wide — the same position (e.g.
 * "Manager") is shared across every division — so walking it returns reports
 * from foreign divisions/departments. It must be intersected with the
 * manager's own org unit, by role:
 *   - admin            → everyone (no extra filter)
 *   - department_head  → employees in their department
 *   - division_head    → employees in their division
 *   - senior_manager   → employees in their division
 *   - manager / other  → none (no team view)
 *
 * Returns a `Prisma.EmployeeWhereInput` fragment meant to be spread alongside
 * the position-hierarchy filter (`{ positionId: { in: ... }, ...scope }`).
 */
export function subordinateOrgScope(
  role: string,
  divisionId: string | null,
  departmentId: string | null,
): Prisma.EmployeeWhereInput {
  switch (role) {
    case ROLE.ADMIN:
      return {};
    case ROLE.DEPARTMENT_HEAD:
      return departmentId ? { division: { departmentId } } : MATCH_NOTHING;
    case ROLE.DIVISION_HEAD:
    case ROLE.SENIOR_MANAGER:
      return divisionId ? { divisionId } : MATCH_NOTHING;
    default:
      return MATCH_NOTHING;
  }
}

/** A where-fragment that matches no employee (empty `in` list). */
const MATCH_NOTHING: Prisma.EmployeeWhereInput = { id: { in: [] } };
