const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email inválido']
    },
    passwordHash: { type: String, required: true },

    roles: { type: [String], default: ['user'] },

    // ojo: nombre consistente con el middleware/JWT
    passwordChangedAt: { type: Date, default: () => new Date() },

    name: { type: String, required: true, trim: true, maxlength: 80 },
    surname: { type: String, required: true, trim: true, maxlength: 80 },

    // guardalo normalizado a dígitos en el controller si usás puntos/guiones
    doc: {
      type: String,
      required: true,
      unique: true,
      // ejemplo simple: 7–8 dígitos + posible dígito verificador
      match: [/^\d{7,8}$/, 'cédula inválida']
    },

    phone: {
      type: String,
      required: false,        // si querés obligatorio, poné true; yo lo dejaría opcional
      // ejemplo simple: 8–12 dígitos
      match: [/^\d{8,12}$/, 'teléfono inválido'],
      index: true             // índice normal para búsquedas, sin unique
    }
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// índice compuesto útil si listás por apellido+nombre
userSchema.index({ surname: 1, name: 1 });

// no muestres jamás el hash
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = model('User', userSchema);
