import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import ModelVersion from '../models/ModelVersion.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coefficientsPath = path.join(__dirname, '../ml/model_assets/model_coefficients.json');
const trainScriptPath = path.join(__dirname, '../ml/train.py');

// Helper to read coefficients JSON file
const getModelCoefficients = () => {
  if (!fs.existsSync(coefficientsPath)) {
    return null;
  }
  const rawData = fs.readFileSync(coefficientsPath, 'utf-8');
  return JSON.parse(rawData);
};

// Helper to check and pre-seed the database with the current JSON model
const seedRegistryIfEmpty = async (modelData) => {
  try {
    const count = await ModelVersion.countDocuments();
    if (count === 0 && modelData) {
      console.log('Seeding model version registry with Version 1 from JSON...');
      const firstVersion = new ModelVersion({
        version: 1,
        coefficients: modelData.coefficients,
        intercept: modelData.intercept,
        metrics: modelData.metrics,
        dataset_info: modelData.dataset_info,
        trainedAt: new Date(modelData.trained_at || Date.now())
      });
      await firstVersion.save();
      console.log('Version 1 registered successfully in database.');
    }
  } catch (err) {
    console.error('Failed to seed model version registry:', err.message);
  }
};

// @route   GET /api/model/info
// @desc    Get current model coefficients and performance metrics
// @access  Public
router.get('/info', async (req, res) => {
  try {
    const modelData = getModelCoefficients();
    if (!modelData) {
      return res.status(404).json({
        success: false,
        message: 'Model coefficients not found. Please train the model first.'
      });
    }

    // Check and pre-seed registry in database
    await seedRegistryIfEmpty(modelData);

    res.json({
      success: true,
      data: modelData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve model info',
      error: error.message
    });
  }
});

// @route   POST /api/model/retrain
// @desc    Retrain model by running the Python training script
// @access  Public
router.post('/retrain', (req, res) => {
  console.log('Retraining request received. Running Python train script...');
  
  exec(`python "${trainScriptPath}"`, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrain model',
        error: error.message,
        details: stderr
      });
    }
    
    console.log(`Training output: ${stdout}`);
    
    try {
      const updatedData = getModelCoefficients();
      if (!updatedData) {
        throw new Error('Retrained coefficients file not found');
      }

      // Increment model version and save to registry
      const latestVersionDoc = await ModelVersion.findOne().sort({ version: -1 });
      const nextVersion = latestVersionDoc ? latestVersionDoc.version + 1 : 1;

      const newVersion = new ModelVersion({
        version: nextVersion,
        coefficients: updatedData.coefficients,
        intercept: updatedData.intercept,
        metrics: updatedData.metrics,
        dataset_info: updatedData.dataset_info,
        trainedAt: new Date(updatedData.trained_at || Date.now())
      });
      await newVersion.save();
      console.log(`Model Version ${nextVersion} saved to registry.`);

      res.json({
        success: true,
        message: 'Model retrained successfully and registered in history!',
        data: updatedData,
        logs: stdout
      });
    } catch (readError) {
      res.status(500).json({
        success: false,
        message: 'Model trained but failed to update registry',
        error: readError.message
      });
    }
  });
});

// @route   GET /api/model/history
// @desc    Get all historical model versions
// @access  Public
router.get('/history', async (req, res) => {
  try {
    const history = await ModelVersion.find().sort({ version: -1 });
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve model version history',
      error: error.message
    });
  }
});

export default router;
