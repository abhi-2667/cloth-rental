const Review = require('../models/Review');
const Booking = require('../models/Booking');
const devStore = require('../utils/devStore');

const useDevStore = !process.env.MONGO_URI;

const getReviewsForCloth = async (req, res) => {
  try {
    if (useDevStore) {
      return res.json(devStore.getReviewsForCloth(req.params.clothId));
    }

    const reviews = await Review.find({ clothId: req.params.clothId })
      .populate('userId', 'name')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { clothId, rating, comment } = req.body;
    
    if (useDevStore) {
      // Basic validation: must have returned the item
      const userBookings = devStore.listBookings().filter(b => b.userId === req.user.id && b.clothId === clothId && b.status === 'returned');
      if (userBookings.length === 0) {
        return res.status(400).json({ message: 'You can only review items you have successfully returned.' });
      }

      const existing = devStore.getReviewsForCloth(clothId).find(r => r.userId === req.user.id);
      if (existing) {
        return res.status(400).json({ message: 'You have already reviewed this item.' });
      }

      const review = devStore.addReview({
        userId: req.user.id,
        clothId,
        rating: Number(rating),
        comment,
        createdAt: new Date()
      });
      return res.status(201).json(review);
    }

    const hasReturned = await Booking.findOne({ userId: req.user.id, clothId, status: 'returned' });
    if (!hasReturned) {
      return res.status(400).json({ message: 'You can only review items you have successfully returned.' });
    }

    const existingReview = await Review.findOne({ userId: req.user.id, clothId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this item.' });
    }

    const review = await Review.create({
      userId: req.user.id,
      clothId,
      rating: Number(rating),
      comment
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReviewsForCloth, addReview };
