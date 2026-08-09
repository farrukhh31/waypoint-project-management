const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');
const TaskDiscussion = require('./TaskDiscussion');
const ProjectDiscussion = require('./ProjectDiscussion');
const Notification = require('./Notification');
const ActivityLog = require('./ActivityLog');
const RefreshToken = require('./RefreshToken');
const Invite = require('./Invite');
const TimeEntry = require('./TimeEntry');
const Meeting = require('./Meeting');
const TaskDependency = require('./TaskDependency');

// ---------------- Associations ----------------

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

// User (manager) <-> Project
User.hasMany(Project, { foreignKey: 'managerId', as: 'managedProjects' });
Project.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Project <-> User (many-to-many via ProjectMember)
Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members',
});
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'projects',
});
Project.hasMany(ProjectMember, { foreignKey: 'projectId', onDelete: 'CASCADE', as: 'memberLinks' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// User (assignee/creator) <-> Task
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'creatorId', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// Task <-> TaskDiscussion
Task.hasMany(TaskDiscussion, { foreignKey: 'taskId', onDelete: 'CASCADE', as: 'discussions' });
TaskDiscussion.belongsTo(Task, { foreignKey: 'taskId' });
User.hasMany(TaskDiscussion, { foreignKey: 'userId', as: 'discussionMessages' });
TaskDiscussion.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Project <-> ProjectDiscussion (comments on a project, incl. auto-posted
// submit/approve/request-changes entries)
Project.hasMany(ProjectDiscussion, { foreignKey: 'projectId', onDelete: 'CASCADE', as: 'discussions' });
ProjectDiscussion.belongsTo(Project, { foreignKey: 'projectId' });
User.hasMany(ProjectDiscussion, { foreignKey: 'userId', as: 'projectDiscussionMessages' });
ProjectDiscussion.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Task <-> Task (dependencies, self-referencing many-to-many via TaskDependency)
Task.belongsToMany(Task, {
  through: TaskDependency,
  foreignKey: 'taskId',
  otherKey: 'dependsOnTaskId',
  as: 'dependsOn',
});
Task.belongsToMany(Task, {
  through: TaskDependency,
  foreignKey: 'dependsOnTaskId',
  otherKey: 'taskId',
  as: 'blocks',
});
Task.hasMany(TaskDependency, { foreignKey: 'taskId', onDelete: 'CASCADE', as: 'dependencyLinks' });
TaskDependency.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
TaskDependency.belongsTo(Task, { foreignKey: 'dependsOnTaskId', as: 'dependsOnTask' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// ActivityLog relations
Project.hasMany(ActivityLog, { foreignKey: 'projectId', onDelete: 'CASCADE', as: 'activityLogs' });
ActivityLog.belongsTo(Project, { foreignKey: 'projectId' });
Task.hasMany(ActivityLog, { foreignKey: 'taskId', onDelete: 'CASCADE', as: 'activityLogs' });
ActivityLog.belongsTo(Task, { foreignKey: 'taskId' });
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'actor' });

// User (inviter) <-> Invite
User.hasMany(Invite, { foreignKey: 'invitedById', as: 'sentInvites' });
Invite.belongsTo(User, { foreignKey: 'invitedById', as: 'invitedBy' });

// Project <-> Invite (set when a PM invites someone into a specific project)
Project.hasMany(Invite, { foreignKey: 'projectId', onDelete: 'CASCADE', as: 'invites' });
Invite.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// User <-> TimeEntry (a personal work timer, optionally linked to a project/task)
User.hasMany(TimeEntry, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'timeEntries' });
TimeEntry.belongsTo(User, { foreignKey: 'userId' });
Project.hasMany(TimeEntry, { foreignKey: 'projectId', onDelete: 'SET NULL', as: 'timeEntries' });
TimeEntry.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Task.hasMany(TimeEntry, { foreignKey: 'taskId', onDelete: 'SET NULL', as: 'timeEntries' });
TimeEntry.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// User <-> Meeting (a personal agenda entry)
User.hasMany(Meeting, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'meetings' });
Meeting.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task,
  TaskDiscussion,
  ProjectDiscussion,
  Notification,
  ActivityLog,
  RefreshToken,
  Invite,
  TimeEntry,
  Meeting,
  TaskDependency,
};