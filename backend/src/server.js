require('dotenv').config();
require('./config/validateEnv')();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const initSocket = require('./services/socketService');
const { attachSocketServer } = require('./services/notificationService');
const { startDeadlineScheduler } = require('./services/deadlineScheduler');
const { startMeetingReminderScheduler } = require('./services/meetingReminderScheduler');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Schema is owned by migrations (npm run db:migrate), not sync() — sync() doesn't
    // create foreign key constraints or track history, so it's not used past dev bootstrapping.
    const [pending] = await sequelize.query(
      "SELECT to_regclass('public.\"SequelizeMeta\"') AS exists"
    ).catch(() => [[{ exists: null }]]);
    if (!pending?.[0]?.exists && sequelize.getDialect() === 'postgres') {
      console.warn(
        'No migrations table found yet. Run `npm run db:migrate` before starting the server.'
      );
    }

    const httpServer = http.createServer(app);
    const io = initSocket(httpServer);
    attachSocketServer(io);

    startDeadlineScheduler();
    startMeetingReminderScheduler();

    httpServer.listen(PORT, () => {
      console.log(`PM Platform API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
