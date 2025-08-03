require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const applicationFormRoutes = require('./routes/applicationFormsRoute'); 
const agentListRoutes = require('./routes/agentListRoutes');

const app = express();
app.use((req, res, next) => {
  console.log("Request received:", req.method, req.url, req.ip);
  next();
});

connectDB();
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.get('/test', (req, res) => {
    res.send("I worked!");
});

// Routes
app.use('/api', agentListRoutes);
app.use('/api', applicationFormRoutes);


// error Handler
app.use(errorHandler);

const PORT =  process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`port listening on ${PORT}`));