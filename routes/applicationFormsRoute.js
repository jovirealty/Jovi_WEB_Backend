const express = require('express');
const router = express.Router();
const { submitIndexForm } = require('../controllers/FormsController');

router.post('/', submitIndexForm);

module.exports = router;