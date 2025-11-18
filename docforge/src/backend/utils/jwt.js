const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'replace_with_secret';

function sign(payload, opts = { expiresIn: '7d' }) {
  return jwt.sign(payload, secret, opts);
}

function verify(token) {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
  const payload = verify(parts[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
}

module.exports = { sign, verify, authMiddleware };
