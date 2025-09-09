require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 1) Connect first (both joviDB + jovi_staff)
connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 2) CORS – include dev localhost + env, and allow Authorization header
const parseList = (s = '') => s.split(',').map(x => x.trim()).filter(Boolean);
const allowed = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.PUBLIC_SITE_ORIGIN,
  process.env.DASHBOARD_ORIGIN,
  process.env.LOCAL_ORIGIN,
  process.env.LOCAL_ORIGIN_IP,
  ...parseList(process.env.CORS_ALLOWED_ORIGINS || '')
].filter(Boolean));

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.has(origin)) return cb(null, true);
    cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health
app.get('/ping', (req, res) => res.json({ message: 'pong' }));

// 3) IMPORTANT: require routes AFTER connectDB so models bind to the right connection
const applicationFormRoutes = require('./routes/applicationFormsRoute');
const agentListRoutes = require('./routes/agentListRoutes');
const authRoutes = require('./routes/dahboardRoutes/authRoutes');

// 4) Mount routes
app.use('/v1/auth', authRoutes);        // superadmin login/refresh/logout/me
app.use('/api', agentListRoutes);       // public agent list
app.use('/api', applicationFormRoutes); // forms

// Errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`port listening on ${PORT}`));