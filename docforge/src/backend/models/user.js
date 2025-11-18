const mongoose = require('mongoose');

const PreferencesSchema = new mongoose.Schema({
  defaultExportFormat: { type: String, enum: ['docx', 'pptx'], default: 'docx' },
  model: { type: String, default: 'gpt-4' },
});

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    lastLoginAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('User', UserSchema);
