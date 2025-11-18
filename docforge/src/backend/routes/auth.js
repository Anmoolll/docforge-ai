const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { sign, authMiddleware } = require('../utils/jwt');

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });
    const token = sign({ userId: user._id, email: user.email });
    res.json({ userId: user._id, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });
    user.lastLoginAt = new Date();
    await user.save();
    const token = sign({ userId: user._id, email: user.email });
    res.json({ userId: user._id, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
