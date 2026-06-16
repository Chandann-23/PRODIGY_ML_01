import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, 
  TrendingUp, 
  History, 
  Cpu, 
  Trash2, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  BedDouble, 
  Bath, 
  Sliders, 
  ExternalLink,
  Info,
  Globe,
  Mail,
  Send,
  Download,
  Settings,
  HelpCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEFAULT_RATES = {
  INR: 83.50,
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 157.00,
  AUD: 1.51,
  CAD: 1.37
};

const LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  AUD: 'en-AU',
  CAD: 'en-CA'
};

function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'features' | 'about' | 'contact'
  const [activeFeaturesSubTab, setActiveFeaturesSubTab] = useState('predict'); // 'predict' | 'history'
  
  const [modelInfo, setModelInfo] = useState(null);
  const [modelHistory, setModelHistory] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Currency Conversion State
  const [currency, setCurrency] = useState('INR'); // Default to INR
  const [exchangeRate, setExchangeRate] = useState(83.50); // Default exchange rate
  
  // Predictor Form State
  const [sqft, setSqft] = useState(1500);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [predictionResult, setPredictionResult] = useState(null);
  
  // Market Simulator State
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [simSqftCoeff, setSimSqftCoeff] = useState(104.0);
  const [simBedroomsCoeff, setSimBedroomsCoeff] = useState(-26655.0);
  const [simBathroomsCoeff, setSimBathroomsCoeff] = useState(30014.0);
  const [simIntercept, setSimIntercept] = useState(52261.0);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  // Loading & Error States
  const [loadingModel, setLoadingModel] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Active Feedback State
  const [feedbackTargetId, setFeedbackTargetId] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchModelInfo();
    fetchModelHistory();
    fetchHistory();
  }, []);

  // Show a temporary notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchModelInfo = async () => {
    try {
      setLoadingModel(true);
      const res = await fetch(`${API_BASE_URL}/model/info`);
      const data = await res.json();
      if (data.success) {
        setModelInfo(data.data);
        // Initialize simulator sliders with trained model coefficients
        setSimSqftCoeff(data.data.coefficients.square_footage);
        setSimBedroomsCoeff(data.data.coefficients.bedrooms);
        setSimBathroomsCoeff(data.data.coefficients.bathrooms);
        setSimIntercept(data.data.intercept);
        setError(null);
      } else {
        setError(data.message || 'Model coefficients not loaded.');
      }
    } catch (err) {
      setError('Could not connect to backend server. Make sure server is running.');
      console.error(err);
    } finally {
      setLoadingModel(false);
    }
  };

  const fetchModelHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/model/history`);
      const data = await res.json();
      if (data.success) {
        setModelHistory(data.data);
      }
    } catch (err) {
      console.error('Error fetching model registry history:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/predictions`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Error fetching prediction history:', err);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    
    // If Simulator is active, calculate client-side without logging to clean ML database
    if (isSimulatorActive) {
      setPredicting(true);
      setTimeout(() => {
        const simulatedPrice = 
          simIntercept + 
          (simSqftCoeff * sqft) + 
          (simBedroomsCoeff * bedrooms) + 
          (simBathroomsCoeff * bathrooms);
        
        setPredictionResult({
          id: `sim-${Date.now()}`,
          squareFootage: sqft,
          bedrooms,
          bathrooms,
          predictedPrice: Math.round(simulatedPrice),
          modelTrainedAt: 'Simulated Settings',
          isSimulated: true
        });
        setPredicting(false);
        showToast('Simulated valuation calculated!');
      }, 500);
      return;
    }

    setPredicting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ squareFootage: sqft, bedrooms, bathrooms }),
      });
      const data = await res.json();
      if (data.success) {
        setPredictionResult(data.data);
        fetchHistory(); // Refresh prediction log
        showToast('Prediction generated successfully!');
      } else {
        showToast(data.message || 'Failed to predict price.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to backend.', 'error');
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    showToast('Retraining model. Downloading dataset and recalculating...', 'info');
    try {
      const res = await fetch(`${API_BASE_URL}/model/retrain`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setModelInfo(data.data);
        // Sync simulator values
        setSimSqftCoeff(data.data.coefficients.square_footage);
        setSimBedroomsCoeff(data.data.coefficients.bedrooms);
        setSimBathroomsCoeff(data.data.coefficients.bathrooms);
        setSimIntercept(data.data.intercept);
        
        fetchHistory();
        fetchModelHistory(); // Refresh registry logs
        showToast('Model trained and registered successfully!');
      } else {
        showToast(data.message || 'Failed to retrain model.', 'error');
      }
    } catch (err) {
      showToast('Network error while retraining.', 'error');
      console.error(err);
    } finally {
      setRetraining(false);
    }
  };

  const handleDeletePrediction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction from history?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/predictions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setHistory(history.filter(item => item.id !== id));
        if (predictionResult && predictionResult.id === id) {
          setPredictionResult(null);
        }
        showToast('Prediction log removed.');
      } else {
        showToast('Failed to delete log.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/predictions/${feedbackTargetId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory(history.map(item => item.id === feedbackTargetId ? data.data : item));
        if (predictionResult && predictionResult.id === feedbackTargetId) {
          setPredictionResult(data.data);
        }
        showToast('Thank you for your feedback!');
        setFeedbackTargetId(null);
        setFeedbackRating(5);
        setFeedbackComment('');
      } else {
        showToast('Failed to save feedback.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      showToast('Please fill out all fields.', 'error');
      return;
    }
    setSubmittingContact(true);
    setTimeout(() => {
      showToast('Message sent successfully! Our team will get back to you.');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactSubject('General Inquiry');
      setSubmittingContact(false);
    }, 1200);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setExchangeRate(DEFAULT_RATES[newCurrency] || 1.0);
    showToast(`Currency changed to ${newCurrency}`);
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      showToast('No logs available to export.', 'error');
      return;
    }
    
    // Define headers
    const headers = ['Date', 'Living Area (SqFt)', 'Bedrooms', 'Bathrooms', `Predicted Price (${currency})`, 'Feedback Rating', 'Feedback Comment'];
    
    // Map history to rows, adjusting pricing based on exchange rate
    const rows = history.map(item => {
      const convertedPrice = Math.round(item.predictedPrice * (currency === 'USD' ? 1.0 : exchangeRate));
      return [
        new Date(item.createdAt).toLocaleDateString(),
        item.squareFootage,
        item.bedrooms,
        item.bathrooms,
        convertedPrice,
        item.feedback?.rating || 'Unrated',
        item.feedback?.comment || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `estinest_valuation_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Prediction history exported to CSV!");
  };

  // Dynamic currency conversion and formatting utility
  const formatPrice = (valInUSD) => {
    const converted = valInUSD * exchangeRate;
    const locale = LOCALES[currency] || 'en-US';
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency, 
      maximumFractionDigits: 0 
    }).format(converted);
  };

  // Calculate standard margin error range (± RMSE of model)
  const getValuationRange = (priceInUSD) => {
    const rmse = modelInfo?.metrics?.rmse || 52975;
    const minVal = Math.max(10000, priceInUSD - rmse);
    const maxVal = priceInUSD + rmse;
    return `${formatPrice(minVal)} - ${formatPrice(maxVal)}`;
  };

  return (
    <div>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '20px',
          zIndex: 1000,
          background: notification.type === 'error' ? 'var(--danger)' : notification.type === 'info' ? 'var(--primary)' : 'var(--success)',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-display)',
          fontWeight: 600
        }}>
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {notification.message}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--grad-primary)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={20} color="#ffffff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-page-primary)' }}>
            EstiNest
          </span>
        </div>

        <ul className="nav-links">
          <li>
            <button 
              className={`nav-link-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              Home
            </button>
          </li>
          <li>
            <button 
              className={`nav-link-btn ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
          </li>
          <li>
            <button 
              className={`nav-link-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About Model
            </button>
          </li>
          <li>
            <button 
              className={`nav-link-btn ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              Contact
            </button>
          </li>
        </ul>

        {/* Currency Conversion Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(53, 79, 82, 0.05)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(53, 79, 82, 0.1)' }}>
          <Globe size={14} style={{ color: 'var(--text-page-secondary)' }} />
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-page-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="CAD">CAD (C$)</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid rgba(53, 79, 82, 0.2)', paddingLeft: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-page-secondary)' }}>Rate:</span>
            <input
              type="number"
              step="0.01"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Math.max(0.01, parseFloat(e.target.value) || 1))}
              style={{
                width: '60px',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(53, 79, 82, 0.15)',
                color: 'var(--text-page-primary)',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                textAlign: 'center',
                outline: 'none'
              }}
              title={`USD to ${currency} custom exchange rate`}
            />
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="app-container">
        
        {/* Centered Header Line */}
        <div className="header-centered">
          <h1>EstiNest Valuation Engine</h1>
          <p>Deploying OLS Linear Regression predictions in localized major currencies</p>
        </div>

        {/* Database Status Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          {loadingModel ? (
            <span className="status-badge warning">
              <RefreshCw size={14} className="spin" style={{ animation: 'spin 2s linear infinite' }} /> Model Initializing...
            </span>
          ) : error ? (
            <span className="status-badge" style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.2)', color: 'var(--danger)' }}>
              <AlertTriangle size={14} /> Pipeline Disconnected
            </span>
          ) : (
            <span className="status-badge success">
              <CheckCircle2 size={14} /> Production Model Online (USD ⇄ {currency} Enabled)
            </span>
          )}
        </div>

        {/* Connection Issue Warning */}
        {error && (
          <div className="glass-panel" style={{ border: '1px solid rgba(248, 113, 113, 0.3)', background: 'rgba(220, 38, 38, 0.08)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <AlertTriangle size={24} style={{ color: '#fca5a5' }} />
            <div>
              <h4 style={{ color: '#fff' }}>ML Pipeline Error</h4>
              <p style={{ color: 'var(--text-card-secondary)', fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        )}

        <main>
          {/* TAB 1: HOME (Hero Section + Quick predictor link) */}
          {activeTab === 'home' && (
            <div className="glass-panel" style={{ padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', background: 'var(--bg-card)' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' }}>
                <Cpu size={56} style={{ color: 'var(--secondary)' }} />
              </div>
              <h2 style={{ fontSize: '2rem', color: '#fff' }}>Welcome to EstiNest</h2>
              <p style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem', color: 'var(--text-card-secondary)' }}>
                This is a production-grade machine learning application designed to evaluate housing property prices.
                By training a multi-variable linear regression model on historic transaction data from Ames, Iowa, the engine offers high-fidelity estimations instantly.
              </p>
              
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => setActiveTab('features')} style={{ color: '#ffffff' }}>
                  Get Started
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('about')}>
                  Model Registry
                </button>
              </div>

              {modelInfo && (
                <div style={{ marginTop: '40px', background: 'var(--bg-card-inner)', padding: '20px 30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-card-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Model Accuracy</span>
                  <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{modelInfo.metrics.r2.toFixed(4)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)' }}>R² Score</div>
                    </div>
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{formatPrice(modelInfo.metrics.rmse)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)' }}>RMSE Error</div>
                    </div>
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '40px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{modelInfo.metrics.n_samples}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)' }}>Sample Size</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FEATURES (Interactive Predictor and History Logs) */}
          {activeTab === 'features' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Sub-Navigation for Features (Predictor vs History) */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(53, 79, 82, 0.08)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                <button 
                  onClick={() => setActiveFeaturesSubTab('predict')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    background: activeFeaturesSubTab === 'predict' ? '#ffffff' : 'transparent',
                    color: 'var(--text-page-primary)',
                    boxShadow: activeFeaturesSubTab === 'predict' ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <Sliders size={14} /> Property Valuator
                </button>
                <button 
                  onClick={() => setActiveFeaturesSubTab('history')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    background: activeFeaturesSubTab === 'history' ? '#ffffff' : 'transparent',
                    color: 'var(--text-page-primary)',
                    boxShadow: activeFeaturesSubTab === 'history' ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <History size={14} /> History Log
                </button>
              </div>

              {activeFeaturesSubTab === 'predict' && (
                <div className="grid-2">
                  {/* Form Input Panel */}
                  <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.25rem' }}>
                        Property Characteristics
                      </h3>
                      {isSimulatorActive && (
                        <span className="status-badge warning" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                          Simulator Active
                        </span>
                      )}
                    </div>
                    
                    <form onSubmit={handlePredict}>
                      {/* Square Footage */}
                      <div className="form-group">
                        <label className="form-label">
                          <span>Square Footage (Living Area)</span>
                          <span className="value-badge">{sqft} sq ft</span>
                        </label>
                        <input 
                          type="range" 
                          min="400" 
                          max="5000" 
                          step="50"
                          value={sqft} 
                          onChange={(e) => setSqft(Number(e.target.value))} 
                          className="range-slider"
                        />
                        <input 
                          type="number"
                          min="400"
                          max="10000"
                          value={sqft}
                          onChange={(e) => setSqft(Number(e.target.value))}
                          className="input-number"
                        />
                      </div>

                      {/* Bedrooms */}
                      <div className="form-group">
                        <label className="form-label">
                          <span>Bedrooms Above Grade</span>
                          <span className="value-badge">{bedrooms} {bedrooms === 1 ? 'bed' : 'beds'}</span>
                        </label>
                        <input 
                          type="range" 
                          min="0" 
                          max="6" 
                          step="1"
                          value={bedrooms} 
                          onChange={(e) => setBedrooms(Number(e.target.value))} 
                          className="range-slider"
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBedrooms(num)}
                              className={`selector-btn ${bedrooms === num ? 'active' : ''}`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bathrooms */}
                      <div className="form-group" style={{ marginBottom: '30px' }}>
                        <label className="form-label">
                          <span>Full Bathrooms</span>
                          <span className="value-badge">{bathrooms} {bathrooms === 1 ? 'bath' : 'baths'}</span>
                        </label>
                        <input 
                          type="range" 
                          min="0" 
                          max="4" 
                          step="1"
                          value={bathrooms} 
                          onChange={(e) => setBathrooms(Number(e.target.value))} 
                          className="range-slider"
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[1, 2, 3, 4].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBathrooms(num)}
                              className={`selector-btn ${bathrooms === num ? 'active' : ''}`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={predicting || (loadingModel && !isSimulatorActive) || error} 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '14px', color: '#ffffff' }}
                      >
                        {predicting ? 'Calculating Valuation...' : 'Evaluate Property Value'}
                      </button>
                    </form>
                  </div>

                  {/* Output Display Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ zIndex: 1 }}>
                        <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.15em', color: 'var(--text-card-muted)', marginBottom: '8px', fontWeight: 600 }}>
                          {isSimulatorActive ? 'Simulated Sandbox Valuation' : 'Estimated OLS Valuation'}
                        </p>
                        
                        {predictionResult ? (
                          <div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', marginBottom: '8px', background: 'linear-gradient(to right, #ffffff, #cad2c5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                              {formatPrice(predictionResult.predictedPrice)}
                            </h2>
                            
                            {/* Standard Margin Error Range */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-card-secondary)', marginBottom: '20px' }}>
                              <HelpCircle size={14} style={{ color: 'var(--text-card-muted)' }} />
                              <span>Valuation Range: <strong>{getValuationRange(predictionResult.predictedPrice / exchangeRate)}</strong> (± Std Error)</span>
                            </div>
                            
                            {/* Features Breakdown */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card-inner)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-card-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={14} /> Square Feet</span>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{predictionResult.squareFootage} sqft</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-card-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><BedDouble size={14} /> Bedrooms</span>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{predictionResult.bedrooms}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-card-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Bath size={14} /> Bathrooms</span>
                                <span style={{ fontWeight: 600, color: '#fff' }}>{predictionResult.bathrooms}</span>
                              </div>
                            </div>

                            {/* Interactive Feedback Section */}
                            {predictionResult.isSimulated ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-card-muted)', fontStyle: 'italic' }}>
                                *Simulated calculations are performed locally and not logged in the database registry.
                              </p>
                            ) : feedbackTargetId !== predictionResult.id ? (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-card-secondary)' }}>Is this prediction accurate?</span>
                                <button 
                                  onClick={() => {
                                    setFeedbackTargetId(predictionResult.id);
                                    setFeedbackRating(predictionResult.feedback?.rating || 5);
                                    setFeedbackComment(predictionResult.feedback?.comment || '');
                                  }} 
                                  className="btn btn-secondary btn-sm"
                                >
                                  Rate Valuation
                                </button>
                              </div>
                            ) : (
                              <form onSubmit={submitFeedback} className="glass-card" style={{ padding: '16px', background: 'var(--bg-card-inner)' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#fff' }}>Add Valuation Rating</h4>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setFeedbackRating(star)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                      <Star 
                                        size={20} 
                                        fill={feedbackRating >= star ? 'var(--warning)' : 'none'} 
                                        color={feedbackRating >= star ? 'var(--warning)' : 'var(--text-card-muted)'} 
                                      />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  placeholder="Comments? (e.g. realistic for current rates)"
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                    marginBottom: '10px',
                                    resize: 'none',
                                    height: '60px'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button type="button" onClick={() => setFeedbackTargetId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                                  <button type="submit" className="btn btn-primary btn-sm" style={{ color: '#ffffff' }}>Submit</button>
                                </div>
                              </form>
                            )}
                            
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-card-muted)' }}>
                            <Sliders size={48} style={{ marginBottom: '15px', strokeWidth: 1 }} />
                            <p>Adjust property attributes on the left and submit.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Formula Info Box */}
                    <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                      <Info size={24} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '4px' }}>Linear Regression Formula</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)' }}>
                          Model inference computed in active currency ({currency}):
                        </p>
                        <code style={{ display: 'block', marginTop: '10px', padding: '8px', background: 'var(--bg-card-inner)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto', color: 'var(--text-card-secondary)' }}>
                          Value = {formatPrice(isSimulatorActive ? simIntercept : (modelInfo?.intercept || 0))} + 
                          ({formatPrice(isSimulatorActive ? simSqftCoeff : (modelInfo?.coefficients?.square_footage || 0))} × SqFt) - 
                          ({formatPrice(Math.abs(isSimulatorActive ? simBedroomsCoeff : (modelInfo?.coefficients?.bedrooms || 0)))} × Bedrooms) + 
                          ({formatPrice(isSimulatorActive ? simBathroomsCoeff : (modelInfo?.coefficients?.bathrooms || 0))} × Bathrooms)
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeaturesSubTab === 'history' && (
                <div className="glass-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Valuation Log History</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)' }}>Persistent database record of evaluated house properties</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={exportToCSV}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={14} /> Export CSV
                      </button>
                      <span className="status-badge" style={{ background: 'var(--bg-card-inner)', color: 'var(--text-card-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        Total logged: {history.length}
                      </span>
                    </div>
                  </div>

                  {history.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Area (SqFt)</th>
                            <th>Bedrooms</th>
                            <th>Bathrooms</th>
                            <th>Prediction ({currency})</th>
                            <th>Valuation Feedback</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((item) => (
                            <tr key={item.id}>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-card-secondary)' }}>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </td>
                              <td>{item.squareFootage} sq ft</td>
                              <td>{item.bedrooms}</td>
                              <td>{item.bathrooms}</td>
                              <td style={{ fontWeight: 600, color: 'var(--text-card-secondary)' }}>
                                {formatPrice(item.predictedPrice)}
                              </td>
                              <td>
                                {item.feedback?.rating ? (
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star} 
                                          size={12} 
                                          fill={item.feedback.rating >= star ? 'var(--warning)' : 'none'} 
                                          color={item.feedback.rating >= star ? 'var(--warning)' : 'var(--text-card-muted)'} 
                                        />
                                      ))}
                                    </div>
                                    {item.feedback.comment && (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-card-muted)', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.feedback.comment}>
                                        {item.feedback.comment}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      setFeedbackTargetId(item.id);
                                      setFeedbackRating(5);
                                      setFeedbackComment('');
                                      setActiveFeaturesSubTab('predict'); 
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                                  >
                                    Add Rating
                                  </button>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button 
                                  onClick={() => handleDeletePrediction(item.id)} 
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: '6px', borderRadius: '8px' }}
                                  title="Delete Log"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-card-muted)' }}>
                      <History size={48} style={{ marginBottom: '15px', strokeWidth: 1 }} />
                      <p>No predictions logged yet. Try out the Predictor first!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ABOUT MODEL (Model registry, insights, and simulator) */}
          {activeTab === 'about' && modelInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Performance Metrics Cards */}
              <div className="grid-3">
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>R-Squared (R²) Score</span>
                  <h3 style={{ fontSize: '2rem', color: 'var(--secondary)', marginTop: '8px', marginBottom: '4px' }}>
                    {modelInfo.metrics.r2.toFixed(4)}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-card-muted)' }}>
                    Proportion of variance in house prices explained by our 3 inputs.
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Root Mean Squared Error ({currency})</span>
                  <h3 style={{ fontSize: '2rem', color: 'var(--secondary)', marginTop: '8px', marginBottom: '4px' }}>
                    {formatPrice(modelInfo.metrics.rmse)}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-card-muted)' }}>
                    Standard deviation of the residuals. Measures average error distance.
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-card-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Mean Absolute Error ({currency})</span>
                  <h3 style={{ fontSize: '2rem', color: 'var(--secondary)', marginTop: '8px', marginBottom: '4px' }}>
                    {formatPrice(modelInfo.metrics.mae)}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-card-muted)' }}>
                    The average absolute difference between predicted and actual prices.
                  </p>
                </div>
              </div>

              {/* Hybrid Simulator + Version Registry Grid */}
              <div className="grid-2">
                
                {/* Simulator and Coefficients */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Market Coefficient Simulator</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isSimulatorActive}
                        onChange={(e) => setIsSimulatorActive(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span>Enable Simulator</span>
                    </label>
                  </div>

                  {!isSimulatorActive ? (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-card-secondary)', marginBottom: '24px' }}>
                        Showing trained coefficients derived from OLS regression. Enable the simulator toggle above to manually tweak coefficients and simulate market shifts.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>Living Area (Per SqFt)</span>
                            <span style={{ color: 'var(--text-card-primary)', fontWeight: 600 }}>+{formatPrice(modelInfo.coefficients.square_footage)}</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--bg-card-inner)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', background: 'var(--primary)' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>Per Full Bathroom</span>
                            <span style={{ color: 'var(--text-card-primary)', fontWeight: 600 }}>+{formatPrice(modelInfo.coefficients.bathrooms)}</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--bg-card-inner)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: '70%', height: '100%', background: 'var(--primary)' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>Per Bedroom Above Grade</span>
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{formatPrice(Math.abs(modelInfo.coefficients.bedrooms))}</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--bg-card-inner)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: '60%', height: '100%', background: 'var(--danger)' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Sim SqFt */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>SqFt Coefficient (USD)</span>
                          <span style={{ color: 'var(--secondary)' }}>${simSqftCoeff.toFixed(2)} ({formatPrice(simSqftCoeff)})</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="300" 
                          step="1"
                          value={simSqftCoeff} 
                          onChange={(e) => setSimSqftCoeff(parseFloat(e.target.value))}
                          className="range-slider"
                        />
                      </div>

                      {/* Sim Bedrooms */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>Bedroom Penalty (USD)</span>
                          <span style={{ color: 'var(--danger)' }}>-${Math.abs(simBedroomsCoeff).toFixed(0)} (-{formatPrice(Math.abs(simBedroomsCoeff))})</span>
                        </div>
                        <input 
                          type="range" 
                          min="-60000" 
                          max="10000" 
                          step="500"
                          value={simBedroomsCoeff} 
                          onChange={(e) => setSimBedroomsCoeff(parseFloat(e.target.value))}
                          className="range-slider"
                        />
                      </div>

                      {/* Sim Bathrooms */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>Bathroom Coefficient (USD)</span>
                          <span style={{ color: 'var(--secondary)' }}>${simBathroomsCoeff.toFixed(0)} ({formatPrice(simBathroomsCoeff)})</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="80000" 
                          step="500"
                          value={simBathroomsCoeff} 
                          onChange={(e) => setSimBathroomsCoeff(parseFloat(e.target.value))}
                          className="range-slider"
                        />
                      </div>

                      {/* Sim Intercept */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span>Base Intercept (USD)</span>
                          <span style={{ color: '#fff' }}>${simIntercept.toFixed(0)} ({formatPrice(simIntercept)})</span>
                        </div>
                        <input 
                          type="range" 
                          min="10000" 
                          max="150000" 
                          step="1000"
                          value={simIntercept} 
                          onChange={(e) => setSimIntercept(parseFloat(e.target.value))}
                          className="range-slider"
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => {
                          setSimSqftCoeff(modelInfo.coefficients.square_footage);
                          setSimBedroomsCoeff(modelInfo.coefficients.bedrooms);
                          setSimBathroomsCoeff(modelInfo.coefficients.bathrooms);
                          setSimIntercept(modelInfo.intercept);
                          showToast('Simulator parameters reset to trained model!');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ alignSelf: 'flex-start', marginTop: '10px' }}
                      >
                        Reset to Model Coefficients
                      </button>
                    </div>
                  )}
                </div>

                {/* Model Version History Registry */}
                <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Model Registry history</h3>
                    <span className="status-badge" style={{ background: 'var(--bg-card-inner)', color: 'var(--text-card-secondary)' }}>
                      {modelHistory.length} versions
                    </span>
                  </div>

                  <div style={{ overflowY: 'auto', maxHeight: '220px', background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {modelHistory.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                            <th style={{ textAlign: 'left', paddingBottom: '6px', color: 'var(--text-card-secondary)' }}>Ver.</th>
                            <th style={{ textAlign: 'center', paddingBottom: '6px', color: 'var(--text-card-secondary)' }}>R² Score</th>
                            <th style={{ textAlign: 'right', paddingBottom: '6px', color: 'var(--text-card-secondary)' }}>Date Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modelHistory.map((mv) => (
                            <tr key={mv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '8px 0', fontWeight: 700 }}>v{mv.version}</td>
                              <td style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-card-muted)' }}>{mv.metrics.r2.toFixed(4)}</td>
                              <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--text-card-secondary)' }}>
                                {new Date(mv.trainedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-card-muted)' }}>
                        No model version history found.
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'var(--bg-card-inner)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '14px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Cpu size={16} /> Pipeline retrainer
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-card-secondary)', marginBottom: '10px' }}>
                      Spawns the Python training script asynchronously. On completion, the new model registry version is added above.
                    </p>
                    <button 
                      onClick={handleRetrain} 
                      disabled={retraining} 
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', color: '#ffffff' }}
                    >
                      <RefreshCw size={14} className={retraining ? "spin" : ""} style={{ marginRight: '6px', animation: retraining ? 'spin 1s linear infinite' : 'none' }} />
                      {retraining ? 'Retraining...' : 'Run Python Training Pipeline'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: CONTACT (Beautiful feedback / contact card) */}
          {activeTab === 'contact' && (
            <div className="grid-2">
              {/* Contact card */}
              <div className="glass-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <Mail size={24} style={{ color: 'var(--secondary)' }} />
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Get in Touch</h3>
                </div>
                <p style={{ color: 'var(--text-card-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
                  Have questions about the linear regression model, data inputs, or want to contribute to development? Send us a message and we'll reply shortly.
                </p>

                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-card-secondary)', fontWeight: 600 }}>Your Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="input-number" 
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-card-secondary)', fontWeight: 600 }}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="input-number" 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-card-secondary)', fontWeight: 600 }}>Subject</label>
                    <select
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--bg-card-inner)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'var(--text-card-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Model Feedback">Model Feedback</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-card-secondary)', fontWeight: 600 }}>Message</label>
                    <textarea 
                      placeholder="Write your message here..." 
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--bg-card-inner)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontFamily: 'var(--font-body)',
                        fontSize: '1rem',
                        resize: 'none',
                        height: '120px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingContact} 
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', color: '#ffffff', padding: '14px', marginTop: '10px' }}
                  >
                    <Send size={16} />
                    {submittingContact ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              </div>

              {/* Informational sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>About Ames Housing Dataset</h3>
                  <p style={{ color: 'var(--text-card-secondary)', fontSize: '0.9rem' }}>
                    The dataset used for our regression model was originally compiled by Dean De Cock for data science education. It describes residential homes in Ames, Iowa, with 79 explanatory variables representing physical characteristics.
                  </p>
                  
                  <h4 style={{ fontSize: '1rem', color: '#fff', marginTop: '10px' }}>Features Selected</h4>
                  <ul style={{ color: 'var(--text-card-secondary)', fontSize: '0.85rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>
                      <strong>GrLivArea (Above Grade Living Area)</strong>: Represents total square footage above ground level. Typically the strongest predictor.
                    </li>
                    <li>
                      <strong>BedroomAbvGr (Bedrooms Above Grade)</strong>: Measures bedrooms above ground level (excludes basements).
                    </li>
                    <li>
                      <strong>FullBath (Full Bathrooms)</strong>: Total above-ground bathrooms.
                    </li>
                  </ul>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '10px' }}>
                    <a 
                      href="https://www.kaggle.com/c/house-prices-advanced-regression-techniques" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: 'var(--secondary)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Official Kaggle Competition <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Footer */}
      <footer style={{ marginTop: '50px', borderTop: '1px solid rgba(53, 79, 82, 0.1)', padding: '24px 0', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
        <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-page-secondary)' }}>
            © {new Date().getFullYear()} EstiNest ML House Price Valuation Engine. Built with MERN Stack + Python.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a 
              href="https://www.kaggle.com/c/house-prices-advanced-regression-techniques/data" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ fontSize: '0.8rem', color: 'var(--text-page-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Ames Housing Dataset <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
