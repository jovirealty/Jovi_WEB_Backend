const express = require('express');
const router = express.Router();
const { 
    submitIndexForm, 
    submitSellingInquiryForm, 
    submitBuyRentInquiryForm } = require('../controllers/FormsController');

router.post('/homepage', submitIndexForm);
router.post('/selling-inquiry', submitSellingInquiryForm);
router.post('/buy-rent-inquiry', submitBuyRentInquiryForm);

module.exports = router;