module.exports = {
 HOST: "${{RAILWAY_PRIVATE_DOMAIN}}",
 USER: "root",
 PASSWORD:"ZxAGqxDWGfmHcXbmGApTijZZhlFMXaFN",
 DB: "railway",
 dialect: "mysql",
  port: 3306,
 pool:{
    max :5,
    min:0,
    acquire:30000,
    idle:10000,

 },

};
module.exports = {
 HOST: "localhost",
 USER: "root",
 PASSWORD:"",
 DB: "blogs_db",
 dialect: "mysql",
 pool:{
    max :5,
    min:0,
    acquire:30000,
    idle:10000,

 },

};