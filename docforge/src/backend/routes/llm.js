const express = require('express');
const router = express.Router({ mergeParams: true });
const { authMiddleware } = require('../utils/jwt');
const Project = require('../models/project');
const Revision = require('../models/revision');
const { callGemini } = require('../utils/llmClient');

// POST /api/projects/:projectId/sections/:sectionId/generate
router.post('/projects/:projectId/sections/:sectionId/generate', authMiddleware, async (req, res) => {
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

    // Save revision
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
router.post('/projects/:projectId/sections/:sectionId/refine', authMiddleware, async (req, res) => {
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

module.exports = router;
