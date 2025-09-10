require('dotenv').config();


const env = {
PORT: process.env.PORT || 5000,
MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_auth',
JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'change_me_access',
JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
ACCESS_TTL: process.env.ACCESS_TTL || '15m',
REFRESH_TTL: process.env.REFRESH_TTL || '30d',
CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
COOKIE_NAME_REFRESH: process.env.COOKIE_NAME_REFRESH || 'rt',
NODE_ENV: process.env.NODE_ENV || 'development',
};


module.exports = env;