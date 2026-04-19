const express = require('express');
const router = express.Router();
const { createBooking, getBlockedDatesForCloth, getUserBookings, getAllBookings, returnCloth } = require('../controllers/bookingController');
const { protect, admin, approvedAccount } = require('../middleware/authMiddleware');
const { validateBookingPayload, validateObjectIdParam } = require('../middleware/validationMiddleware');

router.get('/cloth/:clothId/blocked', validateObjectIdParam('clothId', 'cloth ID'), getBlockedDatesForCloth);

router.route('/')
  .post(protect, approvedAccount, validateBookingPayload, createBooking)
  .get(protect, approvedAccount, admin, getAllBookings);

router.get('/my', protect, approvedAccount, getUserBookings);
router.put('/:id/return', protect, approvedAccount, admin, validateObjectIdParam('id', 'booking ID'), returnCloth);

module.exports = router;
