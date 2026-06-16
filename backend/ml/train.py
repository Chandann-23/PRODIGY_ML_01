import os
import json
import urllib.request
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn import metrics

# Create necessary directories
os.makedirs("backend/ml/data", exist_ok=True)
os.makedirs("backend/ml/model_assets", exist_ok=True)

DATA_PATH = "backend/ml/data/train.csv"
MODEL_PATH = "backend/ml/model_assets/model_coefficients.json"

# List of backup raw github URLs for dataset in case one is down
URLS = [
    "https://raw.githubusercontent.com/jzuniga123/SPS/master/DATA%20605/train.csv",
    "https://raw.githubusercontent.com/hjhuney/Data/master/AmesHousing/train.csv",
    "https://raw.githubusercontent.com/RonBalaban/CUNY-SPS-R/main/train.csv"
]

def download_dataset():
    if os.path.exists(DATA_PATH):
        print("Dataset already exists locally.")
        return True
    
    print("Downloading Ames Housing dataset...")
    for url in URLS:
        try:
            print(f"Trying download from: {url}")
            urllib.request.urlretrieve(url, DATA_PATH)
            print("Dataset downloaded successfully.")
            return True
        except Exception as e:
            print(f"Failed to download from {url}: {e}")
    
    return False

def train_model():
    if not download_dataset():
        raise Exception("Failed to download dataset. Training aborted.")
        
    print("Loading and preprocessing dataset...")
    df = pd.read_csv(DATA_PATH)
    
    # Check columns and map them dynamically to support different variants of the Ames Housing CSV
    columns_map = {}
    
    # Mapping for square footage
    if 'GrLivArea' in df.columns:
        columns_map['GrLivArea'] = 'sqft'
    elif 'Gr Liv Area' in df.columns:
        columns_map['Gr Liv Area'] = 'sqft'
    else:
        raise KeyError("Could not find square footage column (GrLivArea) in dataset.")
        
    # Mapping for bedrooms
    if 'BedroomAbvGr' in df.columns:
        columns_map['BedroomAbvGr'] = 'bedrooms'
    elif 'Bedroom AbvGr' in df.columns:
        columns_map['Bedroom AbvGr'] = 'bedrooms'
    else:
        raise KeyError("Could not find bedrooms column (BedroomAbvGr) in dataset.")
        
    # Mapping for bathrooms
    if 'FullBath' in df.columns:
        columns_map['FullBath'] = 'bathrooms'
    elif 'Full Bath' in df.columns:
        columns_map['Full Bath'] = 'bathrooms'
    else:
        raise KeyError("Could not find bathrooms column (FullBath) in dataset.")
        
    # Mapping for price (target)
    if 'SalePrice' in df.columns:
        columns_map['SalePrice'] = 'price'
    elif 'Sale Price' in df.columns:
        columns_map['Sale Price'] = 'price'
    else:
        raise KeyError("Could not find sale price column (SalePrice) in dataset.")
        
    # Filter dataset and rename columns
    selected_cols = list(columns_map.keys())
    data = df[selected_cols].copy()
    data = data.rename(columns=columns_map)
    
    # Drop rows with missing values in our features
    initial_len = len(data)
    data = data.dropna()
    print(f"Dropped {initial_len - len(data)} rows with missing values. Total samples: {len(data)}")
    
    # Split into features (X) and target (y)
    X = data[['sqft', 'bedrooms', 'bathrooms']]
    y = data['price']
    
    # Split train/test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Linear Regression model...")
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    r2 = metrics.r2_score(y_test, predictions)
    rmse = np.sqrt(metrics.mean_squared_error(y_test, predictions))
    mae = metrics.mean_absolute_error(y_test, predictions)
    
    # Print metrics
    print(f"Model trained successfully!")
    print(f"R2 Score: {r2:.4f}")
    print(f"RMSE: ${rmse:.2f}")
    print(f"MAE: ${mae:.2f}")
    print(f"Intercept: {model.intercept_:.4f}")
    print(f"Coefficients: SqFt: {model.coef_[0]:.4f}, Bedrooms: {model.coef_[1]:.4f}, Bathrooms: {model.coef_[2]:.4f}")
    
    # Prepare model assets to save
    model_json = {
        "features": ["square_footage", "bedrooms", "bathrooms"],
        "coefficients": {
            "square_footage": float(model.coef_[0]),
            "bedrooms": float(model.coef_[1]),
            "bathrooms": float(model.coef_[2])
        },
        "intercept": float(model.intercept_),
        "metrics": {
            "r2": float(r2),
            "rmse": float(rmse),
            "mae": float(mae),
            "n_samples": int(len(data))
        },
        "dataset_info": {
            "source": "Ames Housing Dataset",
            "download_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "trained_at": datetime.now().isoformat()
    }
    
    # Save coefficients to JSON
    with open(MODEL_PATH, "w") as f:
        json.dump(model_json, f, indent=2)
        
    print(f"Model coefficients saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
