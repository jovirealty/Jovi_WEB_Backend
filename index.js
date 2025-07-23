require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const applicationFormRoutes = require('./routes/applicationFormsRoute'); 

const app = express();
connectDB();
app.use(express.json());
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.get('/test', (req, res) => {
    res.send("I worked!");
});

// Routes
app.use('/api', applicationFormRoutes);


// error Handler
app.use(errorHandler);

const PORT =  process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`port listening on ${PORT}`));