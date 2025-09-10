const { Schema, model: model2, Types } = require('mongoose');

const sessionSchema = new Schema(
{
user: { type: Types.ObjectId, ref: 'User', index: true, required: true },
tokenHash: { type: String, required: true, unique: true },
familyId: { type: String, index: true, required: true },
userAgent: String,
ip: String,
replacedBy: { type: String, default: null },
revokedAt: { type: Date, default: null },
expiresAt: { type: Date, required: true },
},
{ timestamps: true }
);


// TTL para limpiar sesiones vencidas
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


module.exports = model2('Session', sessionSchema);