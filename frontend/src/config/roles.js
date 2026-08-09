// Mirrors the ENUM('ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER') on the User model in the backend.
export const ROLES = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  TEAM_MEMBER: 'TEAM_MEMBER',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.PROJECT_MANAGER]: 'Project Manager',
  [ROLES.TEAM_MEMBER]: 'Team Member',
};

// Where each role lands after login / which portal shell it sees.
export const ROLE_HOME = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.PROJECT_MANAGER]: '/pm',
  [ROLES.TEAM_MEMBER]: '/team',
};
