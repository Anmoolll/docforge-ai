const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const SectionSchema = new mongoose.Schema(
  {
    id: { type: String, default: uuidv4, index: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    currentContent: { type: String, default: '' },
    draft: { type: String, default: '' },
    status: { type: String, enum: ['generated', 'edited', 'empty'], default: 'empty' },
    metadata: {
      wordCount: { type: Number, default: 0 },
      tokensEstimate: { type: Number, default: 0 },
    },
    feedback: { likes: { type: Number, default: 0 }, dislikes: { type: Number, default: 0 } },
    comments: { type: Array, default: [] },
    revisions: { type: Array, default: [] },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

const ProjectSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    topic: { type: String, default: '' },
    type: { type: String, enum: ['docx', 'pptx'], default: 'docx' },
    outline: { type: Array, default: [] },
    sections: { type: [SectionSchema], default: [] },
    sharedWith: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    settings: { type: Object, default: {} },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Project', ProjectSchema);
