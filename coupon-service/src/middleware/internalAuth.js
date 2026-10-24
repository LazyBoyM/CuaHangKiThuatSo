const internalAuth = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ message: 'Forbidden: Invalid internal secret' });
  }
  next();
};

module.exports = internalAuth;
