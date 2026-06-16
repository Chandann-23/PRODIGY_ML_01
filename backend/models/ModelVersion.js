import mongoose from 'mongoose';

const ModelVersionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  coefficients: {
    square_footage: { type: Number, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true }
  },
  intercept: {
    type: Number,
    required: true
  },
  metrics: {
    r2: { type: Number, required: true },
    rmse: { type: Number, required: true },
    mae: { type: Number, required: true },
    n_samples: { type: Number, required: true }
  },
  dataset_info: {
    source: { type: String, default: 'Ames Housing Dataset' },
    download_date: { type: String, required: true }
  },
  trainedAt: {
    type: Date,
    default: Date.now
  }
});

// JSON formatting utility
ModelVersionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ModelVersionSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('ModelVersion', ModelVersionSchema);
