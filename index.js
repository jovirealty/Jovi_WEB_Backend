// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS (unchanged from your version) ...
const isProd = process.env.NODE_ENV === 'production';
const parseList = (s = '') => s.split(',').map(x => x.trim()).filter(Boolean);
const allowList = new Set([
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
    if (!origin) return cb(null, true);
    if (!isProd) return cb(null, true);
    if (allowList.has(origin)) return cb(null, true);
    cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    if (req.headers.origin) res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    return res.sendStatus(204);
  }
  next();
});

app.get('/ping', (req, res) => res.json({ message: 'pong' }));

(async () => {
  // ✅ wait for joviDB + jovi_staff
  await connectDB();  // <-- this was the missing await  :contentReference[oaicite:4]{index=4}

  // require routes only after DB is ready
  const applicationFormRoutes = require('./routes/applicationRoutes/applicationFormsRoute');
  const agentListRoutes = require('./routes/applicationRoutes/agentListRoutes');
  const authRoutes = require('./routes/dahboardRoutes/authRoutes');

  app.use('/v1/auth', authRoutes);
  app.use('/api', agentListRoutes);
  app.use('/api', applicationFormRoutes);

  app.use(errorHandler);

  const PORT = process.env.PORT || 5050;
  app.listen(PORT, () => console.log(`port listening on ${PORT}`));
})();
