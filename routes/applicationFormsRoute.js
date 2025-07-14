const express = require('express');
const router = express.Router();
const { submitIndexForm, submitSellingInquiryForm } = require('../controllers/FormsController');

router.post('/homepage', submitIndexForm);
router.post('/selling-inquiry', submitSellingInquiryForm);

module.exports = router;