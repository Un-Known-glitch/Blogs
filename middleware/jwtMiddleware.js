const {verifytoken}=require("../utils/jwt");

function authenticateToken(req,res,next){
    const token =req.cookies.token;
if(!token){
    return res.redirect("/login");

}
try{
    const user =verifytoken(token);
    req.user=user;
    next();

}catch(err){
    return res.status(403).send("invalid or expired token");
}
}
module.exports =authenticateToken;
