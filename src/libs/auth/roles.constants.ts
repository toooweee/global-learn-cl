export const ROLE = {
  ADMIN: 'admin',
  DEPARTMENT_HEAD: 'department_head',
  DIVISION_HEAD: 'division_head',
  SENIOR_MANAGER: 'senior_manager',
  MANAGER: 'manager',
} as const;

export type AppRole = (typeof ROLE)[keyof typeof ROLE];

/** Roles that can create courses and onboarding templates */
export const COURSE_CREATOR_ROLES: AppRole[] = [
  ROLE.ADMIN,
  ROLE.DEPARTMENT_HEAD,
  ROLE.DIVISION_HEAD,
];

/** Roles that can assign courses / onboarding to employees */
export const COURSE_ASSIGNER_ROLES: AppRole[] = [
  ROLE.ADMIN,
  ROLE.DEPARTMENT_HEAD,
  ROLE.DIVISION_HEAD,
  ROLE.SENIOR_MANAGER,
];

/** Any role with managerial responsibility (has subordinates) */
export const MANAGERIAL_ROLES: AppRole[] = [
  ROLE.DEPARTMENT_HEAD,
  ROLE.DIVISION_HEAD,
  ROLE.SENIOR_MANAGER,
];

/** Maps position name (from seed) to the role the employee should receive */
export function roleFromPositionName(
  positionName: string | null | undefined,
): AppRole {
  switch (positionName) {
    case 'Руководитель Департамента':
      return ROLE.DEPARTMENT_HEAD;
    case 'Руководитель отдела':
      return ROLE.DIVISION_HEAD;
    case 'Старший Менеджер':
      return ROLE.SENIOR_MANAGER;
    default:
      return ROLE.MANAGER;
  }
}
