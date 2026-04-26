const express = require('express');
const router = express.Router();
const { getReviewsForCloth, addReview } = require('../controllers/reviewController');
const { protect, approvedAccount } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validationMiddleware');

router.get('/cloth/:clothId', validateObjectIdParam('clothId', 'cloth ID'), getReviewsForCloth);
router.post('/', protect, approvedAccount, addReview);

module.exports = router;
