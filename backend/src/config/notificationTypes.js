// Mirrors the Notification.type ENUM in src/models/Notification.js.
// Centralized here so validators (and anywhere else that needs the list)
// don't drift from the model definition.
const NOTIFICATION_TYPES = [
  'TASK_ASSIGNED',
  'TASK_STATUS_CHANGED',
  'DISCUSSION_ADDED',
  'DEADLINE_APPROACHING',
  'PROJECT_ASSIGNED',
  'MEMBER_ADDED',
  'TASK_SUBMITTED',
  'TASK_APPROVED',
  'TASK_CHANGES_REQUESTED',
  'PROJECT_SUBMITTED',
  'PROJECT_APPROVED',
  'PROJECT_CHANGES_REQUESTED',
];

module.exports = { NOTIFICATION_TYPES };
