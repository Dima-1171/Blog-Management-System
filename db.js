import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelize = new Sequelize(
    process.env.DB_NAME || 'blogdb',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
    }
);

export const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user',
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createAt',
    updatedAt: 'updateAt',
});

export const Blog = sequelize.define('Blog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    blogTitle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    blog: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'blogs',
    timestamps: true,
    createdAt: 'createAt',
    updatedAt: 'updateAt',
});

// Associations
User.hasMany(Blog, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Blog.belongsTo(User, { foreignKey: 'userId' });

export async function initDB() {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // alter:true adds missing columns automatically
    console.log('DB is connected and table is synced');
}

export async function closeDB() {
    await sequelize.close();
}
