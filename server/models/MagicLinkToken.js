const mongoose = require('mongoose');

const magicLinkTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  purpose: { type: String, enum: ['signup', 'login'], required: true },
  expectedRole: { type: String, enum: ['user', 'admin', null], default: null },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

// Auto-delete expired link records.
magicLinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('MagicLinkToken', magicLinkTokenSchema);