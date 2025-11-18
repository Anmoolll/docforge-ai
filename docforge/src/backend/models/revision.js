const mongoose = require('mongoose');

const RevisionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sectionId: { type: String, required: true, index: true },
    content: { type: String, default: '' },
    prompt: { type: String, default: '' },
    systemPrompt: { type: String },
    model: { type: String },
    modelParams: { type: Object, default: {} },
    author: { type: mongoose.Schema.Types.Mixed, default: 'LLM' },
    parentRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Revision' },
  },
  { timestamps: { createdAt: 'createdAt' } }
);

module.exports = mongoose.model('Revision', RevisionSchema);
