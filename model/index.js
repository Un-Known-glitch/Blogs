const dbConfig = require("../config/dbConfig");
const {Sequelize,DataTypes}= require("sequelize");

const sequelize = new Sequelize(dbConfig.DB,dbConfig.USER,dbConfig.PASSWORD,{
host : dbConfig.HOST,
 dialect : dbConfig.dialect,
 pool:{
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle:dbConfig.pool.idle,
 },
});

sequelize
.authenticate()
.then(()=>{
    console.log("Connected !!");
})
.catch((err)=>{
    console.log("Error" + err);
})

const db = {};
db.Sequelize=Sequelize;
db.sequelize=sequelize;

db.blogs = require("./blogModel.js")(sequelize, DataTypes);
db.users = require("./usersModel.js")(sequelize, DataTypes);

const users = require("./usersModel")(sequelize, DataTypes);
const blogs = require("./blogModel")(sequelize,DataTypes);

db.blogs.belongsTo(db.users, { foreignKey: "userId" } );
db.users.hasMany(db.blogs, { foreignKey: "userId" } );

db.sequelize.sync({force: false}).then(()=>{
    console.log("yes re-synce done");
 
}); 
module.exports = db;