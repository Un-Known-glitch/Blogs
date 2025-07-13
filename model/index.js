const dbConfig = require("../config/dbConfig");
const { Sequelize, DataTypes } = require("sequelize");

// Initialize Sequelize using full connection URL from config.url
const sequelize = new Sequelize(dbConfig.url, {
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to the database successfully!");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.blogs = require("./blogModel.js")(sequelize, DataTypes);
db.users = require("./usersModel.js")(sequelize, DataTypes);

db.blogs.belongsTo(db.users, { foreignKey: "userId" });
db.users.hasMany(db.blogs, { foreignKey: "userId" });

db.sequelize.sync({ force: false }).then(() => {
  console.log("Database synchronized");
});

module.exports = db;
