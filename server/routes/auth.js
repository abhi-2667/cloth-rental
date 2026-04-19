const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	requestSignupLink,
	verifySignupLink,
	requestLoginLink,
	verifyLoginLink,
} = require('../controllers/authController');
const {
	validateRegisterPayload,
	validateLoginPayload,
	validateLoginLinkRequestPayload,
	validateVerifyLoginLinkPayload,
} = require('../middleware/validationMiddleware');

router.post('/register/request-link', requestSignupLink);
router.post('/register/verify-link', verifySignupLink);
router.post('/login/request-link', validateLoginLinkRequestPayload, requestLoginLink);
router.post('/login/verify-link', validateVerifyLoginLinkPayload, verifyLoginLink);
router.post('/register', validateRegisterPayload, registerUser);
router.post('/login', validateLoginPayload, loginUser);

module.exports = router;
