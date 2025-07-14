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
         isAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });
    
    return User;
    };