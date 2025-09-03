require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const applicationFormRoutes = require('./routes/applicationFormsRoute'); 
const agentListRoutes = require('./routes/agentListRoutes');
const authRoutes = require('./routes/dahboardRoutes/authRoutes');

const app = express();

connectDB(); // open joviDB + jovi_staff
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use explicit origin for cookies/credentials
app.use(
  cors({
    origin: process.env.DASHBOARD_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// test route
app.get('/ping', (req, res) => res.json({ message: 'pong' }));

// ---- Routes ----
app.use('/v1/auth', authRoutes);  // superadmin login/refresh/logout/me
app.use('/api', agentListRoutes); // agent list routes
app.use('/api', applicationFormRoutes); // application form routes

// error Handler
app.use(errorHandler);

const PORT =  process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`port listening on ${PORT}`));