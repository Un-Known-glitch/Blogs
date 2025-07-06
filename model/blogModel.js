const { blogs } = require(".");

module.exports=(sequelize,DataTypes)=>{
    const Blog = sequelize.define("blog",{
         userId:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        title:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        subtitle:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        description:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        image:{
            type:DataTypes.STRING, // to store filename or full URL
            allowNull:true,
        
        },
    });
    return Blog;
    };