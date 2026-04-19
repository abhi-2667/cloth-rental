const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  linkExpiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
