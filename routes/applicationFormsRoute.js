const express = require('express');
const router = express.Router();
const { 
    submitIndexForm, 
    submitSellingInquiryForm, 
    submitBuyRentInquiryForm,
    submitRentalServiceInquiryForm,
    submitJoinJoviInquiryForm } = require('../controllers/FormsController');

router.post('/homepage', submitIndexForm);
router.post('/selling-inquiry', submitSellingInquiryForm);
router.post('/buy-rent-inquiry', submitBuyRentInquiryForm);
router.post('/rental-service', submitRentalServiceInquiryForm);
// router.post('/join-jovi', submitJoinJoviInquiryForm);

module.exports = router;