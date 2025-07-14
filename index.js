require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
connectDB();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/homepage', require('./routes/indexForm'))

// error Handler
app.use(errorHandler);

const PORT =  process.env.PORT || 3000;
app.listen(PORT, () => console.log(`port listening on ${PORT}`));