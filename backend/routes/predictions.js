import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Prediction from '../models/Prediction.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coefficientsPath = path.join(__dirname, '../ml/model_assets/model_coefficients.json');

// Helper to read coefficients
const getModelCoefficients = () => {
  if (!fs.existsSync(coefficientsPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(coefficientsPath, 'utf-8'));
};

// @route   POST /api/predictions
// @desc    Perform house price prediction and store in history
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { squareFootage, bedrooms, bathrooms } = req.body;

    // Validate inputs
    if (squareFootage === undefined || bedrooms === undefined || bathrooms === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide squareFootage, bedrooms, and bathrooms.'
      });
    }

    const sqft = parseFloat(squareFootage);
    const beds = parseFloat(bedrooms);
    const baths = parseFloat(bathrooms);

    if (isNaN(sqft) || sqft < 100) {
      return res.status(400).json({
        success: false,
        message: 'Square footage must be a number greater than or equal to 100.'
      });
    }
    if (isNaN(beds) || beds < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bedrooms must be a positive number.'
      });
    }
    if (isNaN(baths) || baths < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bathrooms must be a positive number.'
      });
    }

    // Load coefficients
    const modelData = getModelCoefficients();
    if (!modelData) {
      return res.status(503).json({
        success: false,
        message: 'Prediction engine unavailable. Model has not been trained.'
      });
    }

    const { coefficients, intercept, trained_at } = modelData;

    // Linear Regression Formula:
    // price = intercept + (sqft_coeff * sqft) + (bedroom_coeff * bedrooms) + (bathroom_coeff * bathrooms)
    const predictedPrice = 
      intercept + 
      (coefficients.square_footage * sqft) + 
      (coefficients.bedrooms * beds) + 
      (coefficients.bathrooms * baths);

    // Save to database
    const newPrediction = new Prediction({
      squareFootage: sqft,
      bedrooms: beds,
      bathrooms: baths,
      predictedPrice: Math.round(predictedPrice),
      modelTrainedAt: trained_at
    });

    const savedPrediction = await newPrediction.save();

    res.status(201).json({
      success: true,
      data: savedPrediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate prediction',
      error: error.message
    });
  }
});

// @route   GET /api/predictions
// @desc    Get all prediction logs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const predictions = await Prediction.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction history',
      error: error.message
    });
  }
});

// @route   POST /api/predictions/:id/feedback
// @desc    Add rating and comments to a prediction log
// @access  Public
router.post('/:id/feedback', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { id } = req.params;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.'
      });
    }

    const prediction = await Prediction.findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction log not found.'
      });
    }

    if (rating !== undefined) prediction.feedback.rating = rating;
    if (comment !== undefined) prediction.feedback.comment = comment;

    const updatedPrediction = await prediction.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedPrediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save feedback',
      error: error.message
    });
  }
});

// @route   DELETE /api/predictions/:id
// @desc    Delete a prediction log
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prediction = await Prediction.findByIdAndDelete(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction log not found.'
      });
    }

    res.json({
      success: true,
      message: 'Prediction log deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete prediction log',
      error: error.message
    });
  }
});

export default router;
