const crypto = require('crypto');
const SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

function generateToken(req, res, next) {
  const token = crypto.randomBytes(32).toString('hex');
  const signed = crypto.createHmac('sha256', SECRET).update(token).digest('hex');
  req.csrfToken = token;
  req.csrfSigned = `${token}.${signed}`;
  next();
}

function verifyToken(req, res, next) {
  const tokenHeader = req.headers['x-csrf-token'] || req.body.csrfToken;
  if (!tokenHeader) return res.status(403).json({ message: 'CSRF token faltante' });
  const parts = tokenHeader.split('.');
  if (parts.length !== 2) {
    return res.status(403).json({ message: 'Token CSRF malformado' });
  }
  const [token, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(token).digest('hex');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return res.status(403).json({ message: 'Token CSRF inválido' });
    }
  } catch (err) {
    return res.status(403).json({ message: 'Token CSRF inválido' });
  }
  next();
}

module.exports = { generateToken, verifyToken };
