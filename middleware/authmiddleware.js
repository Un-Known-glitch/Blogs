// middleware/authMiddleware.js

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/signup");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).send("Only admin can perform this action.");
  }
  next();
}

module.exports = {
  requireLogin,
  requireAdmin,
};
