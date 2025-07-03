 // middleware/middleware.js

 function requireLogin(req, res, next){
    if(!req.session.user) {
        return res.redirect("/signup");
    }
    next();
}

module.exports = requireLogin;