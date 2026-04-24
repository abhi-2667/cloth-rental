const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	requestLoginLink,
	verifyLoginLink,
	verifyLoginOtp,
} = require('../controllers/authController');
const {
	validateRegisterPayload,
	validateLoginPayload,
} = require('../middleware/validationMiddleware');

router.post('/register', validateRegisterPayload, registerUser);
router.post('/login', validateLoginPayload, loginUser);
router.post('/login/link/request', requestLoginLink);
router.post('/login/link/verify', verifyLoginLink);
router.post('/login/otp/verify', verifyLoginOtp);

module.exports = router;
