const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const projectDiscussionRoutes = require('./routes/projectDiscussionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Required for secure cookies + correct client IPs (for rate limiting) behind a
// reverse proxy / load balancer (Heroku, Render, Nginx, etc.) in production.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(hpp()); // strips duplicate query params (?role=ADMIN&role=x) that could confuse filters
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// General API rate limit — generous, mainly to blunt scraping/DoS-style abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down and try again shortly.' },
});
app.use('/api', apiLimiter);

// Strict limiter on credential-guessing endpoints specifically (login/register).
// Kept separate from the general limiter so legitimate refresh/logout traffic
// from one user never gets caught up in someone else's brute-force attempt.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only counts failed attempts against the limit
  message: { success: false, message: 'Too many login attempts. Please try again in a few minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/invites/accept', authLimiter); // same credential-guessing concern as login/register

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PM Platform API is running.', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/discussions', projectDiscussionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/:id/discussions', discussionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;