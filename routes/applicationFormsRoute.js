const express = require('express');
const router = express.Router();
const { 
    submitIndexForm, 
    submitSellingInquiryForm, 
    submitBuyRentInquiryForm,
    submitRentalServiceInquiryForm,
    submitJoinJoviInquiryForm,
    submitContactForm } = require('../controllers/FormsController');
const verifyCaptcha = require('../middlewares/verifyCaptcha');

router.post('/homepage', verifyCaptcha, submitIndexForm);
router.post('/selling-inquiry', verifyCaptcha, submitSellingInquiryForm);
router.post('/buy-rent-inquiry', verifyCaptcha, submitBuyRentInquiryForm);
router.post('/rental-service', verifyCaptcha, submitRentalServiceInquiryForm);
router.post('/join-jovi', verifyCaptcha, submitJoinJoviInquiryForm);
router.post('/contact-form', verifyCaptcha, submitContactForm);

module.exports = router;