const express = require('express');
const router = express.Router();
const path = require('path');
const { getClothes, getClothById, addCloth, updateCloth, deleteCloth } = require('../controllers/clothController');
const { protect, admin, approvedAccount } = require('../middleware/authMiddleware');
const { validateClothPayload, validateObjectIdParam } = require('../middleware/validationMiddleware');

const multer = require('multer');

// Setup multer storage (using local storage for simplicity right now unless Cloudinary is fully configured)
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.route('/')
  .get(getClothes)
  .post(protect, approvedAccount, admin, upload.single('image'), validateClothPayload, addCloth);

router.route('/:id')
  .get(validateObjectIdParam('id', 'cloth ID'), getClothById)
  .put(protect, approvedAccount, admin, validateObjectIdParam('id', 'cloth ID'), upload.single('image'), validateClothPayload, updateCloth)
  .delete(protect, approvedAccount, admin, validateObjectIdParam('id', 'cloth ID'), deleteCloth);

module.exports = router;
