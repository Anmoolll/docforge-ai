const express = require('express');
const router = express.Router({ mergeParams: true });
const Project = require('../models/project');
const { authMiddleware } = require('../utils/jwt');

// POST /api/projects/:projectId/sections
router.post('/', authMiddleware, async (req, res) => {
  const { title, order } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const section = { title, order: order || project.sections.length };
    project.sections.push(section);
    await project.save();
    res.json({ section: project.sections[project.sections.length - 1] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// PUT /api/projects/:projectId/sections/:sectionId
router.put('/:sectionId', authMiddleware, async (req, res) => {
  const { title, order } = req.body;
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const section = project.sections.id(req.params.sectionId) || project.sections.find(s => s.id === req.params.sectionId);
    if (!section) return res.status(404).json({ error: 'section not found' });
    if (title !== undefined) section.title = title;
    if (order !== undefined) section.order = order;
    await project.save();
    res.json({ section });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// DELETE /api/projects/:projectId/sections/:sectionId
router.delete('/:sectionId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, ownerId: req.user.userId });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const idx = project.sections.findIndex(s => s.id === req.params.sectionId || (s._id && s._id.toString() === req.params.sectionId));
    if (idx === -1) return res.status(404).json({ error: 'section not found' });
    project.sections.splice(idx, 1);
    await project.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
