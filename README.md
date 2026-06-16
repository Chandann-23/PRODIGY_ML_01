# Ames Valuator - House Price Prediction Engine (MERN + Python ML)

A production-grade, full-stack machine learning application built using the MERN stack (MongoDB, Express, React, Node.js) and a Python training pipeline. It implements an Ordinary Least Squares (OLS) Linear Regression model trained on the Kaggle Ames Housing dataset to predict residential property valuations based on three key parameters: square footage (living area), number of bedrooms, and number of bathrooms.

---

## Key Features

- **Interactive Valuation Predictor**: Range sliders and numeric input fields for property square footage, bedrooms, and bathrooms that evaluate estimated valuations in real-time.
- **Model Insights Dashboard**: Clear statistical analytics detailing the model's coefficients ($R^2$ Score, RMSE, MAE, feature weight impacts) and active training metadata.
- **Valuation Logs & Feedback Loop**: Persistent history logs showing previous predictions stored in MongoDB with the ability to add comments, rate estimates, and delete records.
- **Automatic Database Fallback**: Dynamically starts a localized in-memory MongoDB server (`mongodb-memory-server`) if no external connection string is supplied.
- **One-Click Python ML Pipeline**: Allows training the model on the backend on-demand using a Python subprocess, pulling the training data directly and regenerating model coefficients instantly.

---

## Technical Architecture

```
Task-1/
├── package.json               # Root workspace script setup
├── backend/
│   ├── package.json           # Node dependencies & startup scripts
│   ├── server.js              # Express server core entry point
│   ├── config/
│   │   └── db.js              # Mongoose connector with in-memory fallback
│   ├── models/
│   │   └── Prediction.js      # Mongoose schema for prediction logs
│   ├── routes/
│   │   ├── model.js           # API routes for retraining & coefficients
│   │   └── predictions.js     # API routes for calculations & CRUD logs
│   └── ml/
│       ├── train.py           # Python script to download dataset & train model
│       └── model_assets/
│           └── model_coefficients.json  # Trained JSON model parameters
└── frontend/
    ├── package.json           # React dependencies
    ├── index.html             # Vite entry point
    └── src/
        ├── main.jsx           # React mounting file
        ├── App.jsx            # Core layout & component dashboard
        ├── App.css            # Visual overrides
        └── index.css          # Design system stylesheet
```

---

## Mathematical Regression Formula

The linear regression model uses the Ordinary Least Squares (OLS) method. The coefficients trained on the 1,460 transaction samples from the Ames Housing dataset are:

$$\text{Valuation} = \beta_0 + \beta_1(\text{SqFt}) + \beta_2(\text{Bedrooms}) + \beta_3(\text{Bathrooms})$$

Where:
- $\beta_0$ (Intercept) = **\$52,261.75**
- $\beta_1$ (Square Footage Coefficient) = **+\$104.03** per sq ft
- $\beta_2$ (Bedrooms Coefficient) = **-\$26,655.17** per bedroom
- $\beta_3$ (Bathrooms Coefficient) = **+\$30,014.32** per bathroom

*Note: The negative bedroom coefficient is standard in area-controlled regression models. When living area (square footage) is held constant, adding more rooms subdivides the house into smaller rooms, which often reduces market value compared to open-layout properties.*

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)
- **Python** (v3.8+) with standard libraries (`pandas`, `numpy`, `scikit-learn`)

### 1. Clone & Install Dependencies
From the project root directory, run the workspace command to install all root, backend, and frontend packages:
```bash
npm run install-all
```

### 2. Configure Environment (Optional)
Create a `.env` file inside the `backend/` directory if you wish to connect to an external MongoDB Atlas cluster:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname
NODE_ENV=development
```
*If left empty, the application will automatically run an in-memory MongoDB instance for zero-config local development.*

---

## Running the Application

### Start Backend and Frontend Concurrently
From the root directory:
```bash
npm run dev
```

This starts:
- **Express Server**: http://localhost:5000
- **React Frontend (Vite)**: http://localhost:5173

---

## API Documentation

### Model Endpoints (`/api/model`)
- **`GET /api/model/info`**: Retrieves active regression coefficients and performance metrics.
- **`POST /api/model/retrain`**: Runs the Python training script to retrain the coefficients and updates the JSON file.

### Predictions Endpoints (`/api/predictions`)
- **`POST /api/predictions`**: Calculates valuation and stores it in MongoDB.
  - Body: `{ "squareFootage": 1500, "bedrooms": 3, "bathrooms": 2 }`
- **`GET /api/predictions`**: Returns list of all logged predictions.
- **`POST /api/predictions/:id/feedback`**: Adds comments and rating feedback (1-5 stars).
  - Body: `{ "rating": 5, "comment": "Great estimate" }`
- **`DELETE /api/predictions/:id`**: Deletes a prediction from the history log.
