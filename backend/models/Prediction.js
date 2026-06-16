import mongoose from 'mongoose';

const PredictionSchema = new mongoose.Schema({
  squareFootage: {
    type: Number,
    required: [true, 'Square footage is required'],
    min: [100, 'Square footage must be at least 100 sq ft']
  },
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Number of bedrooms cannot be negative']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Number of bathrooms cannot be negative']
  },
  predictedPrice: {
    type: Number,
    required: [true, 'Predicted price is required']
  },
  modelTrainedAt: {
    type: String,
    required: true
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure response JSON format maps _id to id cleanly
PredictionSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

PredictionSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Prediction', PredictionSchema);
