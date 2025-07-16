const express = require('express');
const router = express.Router();
const { 
    submitIndexForm, 
    submitSellingInquiryForm, 
    submitBuyRentInquiryForm,
    submitRentalServiceInquiryForm,
    submitJoinJoviInquiryForm,
    submitContactForm } = require('../controllers/FormsController');

router.post('/homepage', submitIndexForm);
router.post('/selling-inquiry', submitSellingInquiryForm);
router.post('/buy-rent-inquiry', submitBuyRentInquiryForm);
router.post('/rental-service', submitRentalServiceInquiryForm);
router.post('/join-jovi', submitJoinJoviInquiryForm);
router.post('/contact-form', submitContactForm);

module.exports = router;