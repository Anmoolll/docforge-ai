const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const Revision = require('../models/revision');
const { authMiddleware } = require('../utils/jwt');
const { exportProject } = require('../utils/exporter');
const { callGemini } = require('../utils/llmClient');

// GET /api/projects?page=&limit=
router.get('/', authMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1'));
  const limit = Math.min(100, parseInt(req.query.limit || '20'));
  const skip = (page - 1) * limit;
  try {
    const [projects, total] = await Promise.all([
      Project.find({ ownerId: req.user.userId }).skip(skip).limit(limit).select('title topic type updatedAt').lean(),
      Project.countDocuments({ ownerId: req.user.userId }),
    ]);
    res.json({ projects, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/projects
router.post('/', authMiddleware, async (req, res) => {
  const { title, topic, type, outline } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const project = await Project.create({ ownerId: req.user.userId, title, topic, type, outline });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /api/projects/:projectId
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId }).lean();
    if (!project) return res.status(404).json({ error: 'not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// PUT /api/projects/:projectId
router.put('/:projectId', authMiddleware, async (req, res) => {
  const allowed = ['title', 'topic', 'settings'];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];
  try {
    const project = await Project.findOneAndUpdate({ _id: req.params.projectId, ownerId: req.user.userId }, update, { new: true });
    if (!project) return res.status(404).json({ error: 'not found' });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// DELETE /api/projects/:projectId
router.delete('/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/projects/:projectId/export
router.post('/:projectId/export', authMiddleware, async (req, res) => {
  const { format = 'docx', includeComments } = req.body || {};
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId }).lean();
    if (!project) return res.status(404).json({ error: 'not found' });

    // includeComments is reserved but not used in this simple exporter
    const { buffer, filename, contentType } = await exportProject(project, format);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('export error', err);
    res.status(500).json({ error: 'export failed' });
  }
});

// POST /api/projects/:projectId/sections/:sectionId/generate
router.post('/:projectId/sections/:sectionId/generate', authMiddleware, async (req, res) => {
  const { promptOptions } = req.body || {};
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const section = project.sections.find(s => s.id === req.params.sectionId || (s._id && s._id.toString() === req.params.sectionId));
    if (!section) return res.status(404).json({ error: 'section not found' });

    const basePrompt = `${project.topic}\nSection: ${section.title}`;
    const finalPrompt = promptOptions?.prompt || basePrompt;
    const llmResp = await callGemini(finalPrompt, promptOptions?.modelParams);
    const content = llmResp.content || llmResp.text || JSON.stringify(llmResp);

    const rev = await Revision.create({ projectId: project._id, sectionId: section.id, content, prompt: finalPrompt, model: promptOptions?.model || 'gemini', modelParams: promptOptions?.modelParams || {}, author: 'LLM' });
    section.currentContent = content;
    section.status = 'generated';
    section.revisions = section.revisions || [];
    section.revisions.push(rev._id);
    await project.save();

    res.json({ revisionId: rev._id, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/projects/:projectId/sections/:sectionId/refine
router.post('/:projectId/sections/:sectionId/refine', authMiddleware, async (req, res) => {
  const { instruction, style, params } = req.body || {};
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const section = project.sections.find(s => s.id === req.params.sectionId || (s._id && s._id.toString() === req.params.sectionId));
    if (!section) return res.status(404).json({ error: 'section not found' });

    const context = section.currentContent || '';
    const prompt = `Refine the following content with instruction: ${instruction}\nStyle: ${style || 'default'}\nContent:\n${context}`;
    const llmResp = await callGemini(prompt, params);
    const content = llmResp.content || llmResp.text || JSON.stringify(llmResp);

    const rev = await Revision.create({ projectId: project._id, sectionId: section.id, content, prompt, model: params?.model || 'gemini', modelParams: params || {}, author: 'LLM' });
    section.currentContent = content;
    section.status = 'generated';
    section.revisions = section.revisions || [];
    section.revisions.push(rev._id);
    await project.save();

    res.json({ revisionId: rev._id, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/projects/:projectId/sections/:sectionId/feedback
router.post('/:projectId/sections/:sectionId/feedback', authMiddleware, async (req, res) => {
  const { like, comment } = req.body || {};
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const section = project.sections.find(s => s.id === req.params.sectionId || (s._id && s._id.toString() === req.params.sectionId));
    if (!section) return res.status(404).json({ error: 'section not found' });

    section.feedback = section.feedback || { likes: 0, dislikes: 0 };
    if (like === true) section.feedback.likes = (section.feedback.likes || 0) + 1;
    else if (like === false) section.feedback.dislikes = (section.feedback.dislikes || 0) + 1;

    if (comment) {
      section.comments = section.comments || [];
      section.comments.push({ authorId: req.user.userId, text: comment, createdAt: new Date() });
    }

    await project.save();
    res.json({ success: true, feedback: section.feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /api/projects/:projectId/sections/:sectionId/revisions
router.get('/:projectId/sections/:sectionId/revisions', authMiddleware, async (req, res) => {
  try {
    const revisions = await Revision.find({ projectId: req.params.projectId, sectionId: req.params.sectionId }).sort({ createdAt: -1 }).lean();
    res.json({ revisions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/projects/:projectId/sections/:sectionId/revisions/:revId/restore
router.post('/:projectId/sections/:sectionId/revisions/:revId/restore', authMiddleware, async (req, res) => {
  try {
    const rev = await Revision.findOne({ _id: req.params.revId, projectId: req.params.projectId, sectionId: req.params.sectionId });
    if (!rev) return res.status(404).json({ error: 'revision not found' });
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const section = project.sections.find(s => s.id === req.params.sectionId || (s._id && s._id.toString() === req.params.sectionId));
    if (!section) return res.status(404).json({ error: 'section not found' });

    // Restore revision as current content and create a new revision record marking restore
    section.currentContent = rev.content;
    const newRev = await Revision.create({ projectId: project._id, sectionId: section.id, content: rev.content, prompt: `RESTORE:${rev._id}`, model: rev.model, modelParams: rev.modelParams || {}, author: req.user.userId, parentRevisionId: rev._id });
    section.revisions = section.revisions || [];
    section.revisions.push(newRev._id);
    await project.save();

    res.json({ restoredRevisionId: newRev._id, content: rev.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
