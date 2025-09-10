const mongoose = require('mongoose');
const env = require('./env');


async function connectDB() {
mongoose.set('strictQuery', true);
await mongoose.connect(env.MONGODB_URI, {
autoIndex: true,
});
console.log('MongoDB connected');
}


module.exports = { connectDB };