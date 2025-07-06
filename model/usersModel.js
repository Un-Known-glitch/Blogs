module.exports=(sequelize,DataTypes)=>{
    const User = sequelize.define("user",{
        Username:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        Email:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        Password:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        
    });
    User.associate = (models)=>{
        User.hasMany(module.blogs, { foreignkey:"userId"});
    };
    return User;
    };