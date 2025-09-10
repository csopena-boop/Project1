const { Schema, model } = require('mongoose');

const userSchema = new Schema (
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: {type: String, required: true},
        roles: { type: [String], default: ['user'] },
        passwordChangeAt: {type: Date, default: () => new Date()},
    },
    {timestamps: true}
);

module.exports = model('User', userSchema)