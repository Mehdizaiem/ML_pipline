// src/MonitoringDashboard.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft } from 'lucide-react';

const MonitoringDashboard = ({ onBack }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/monitoring/metrics');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format data for charts
      const formattedData = data.timestamps.map((timestamp, index) => ({
        timestamp,
        accuracy: data.accuracy[index],
        precision: data.precision[index],
        recall: data.recall[index],
        f1_score: data.f1_score[index],
        predictionCount: data.prediction_count[index],
        dataDrift: data.data_drift_score[index]
      }));
      
      setMetrics(formattedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError(error.message);
      
      // Create sample data for demonstration if needed
      if (!metrics) {
        setMetrics(generateSampleMetrics());
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSampleMetrics = () => {
    // Generate sample data for preview purposes
    const now = new Date();
    const timestamps = Array.from({length: 30}, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (30 - i));
      return date.toISOString();
    });
    
    return timestamps.map(timestamp => ({
      timestamp,
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.82 + Math.random() * 0.1,
      recall: 0.78 + Math.random() * 0.15,
      f1_score: 0.8 + Math.random() * 0.12,
      predictionCount: Math.floor(100 + Math.random() * 50),
      dataDrift: Math.random() * 0.3
    }));
  };

  if (loading && !metrics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold ml-4">Model Monitoring Dashboard</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
            <p className="text-sm mt-1">Showing sample data for demonstration.</p>
          </div>
        )}

        {/* Performance Metrics Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Model Performance Over Time</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={str => {
                    const date = new Date(str);
                    return `${date.getMonth()+1}/${date.getDate()}`;
                  }}
                />
                <YAxis domain={[0, 1]} />
                <Tooltip 
                  formatter={(value) => [`${(value * 100).toFixed(2)}%`, '']}
                  labelFormatter={value => {
                    const date = new Date(value);
                    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy" />
                <Line type="monotone" dataKey="precision" stroke="#82ca9d" name="Precision" />
                <Line type="monotone" dataKey="recall" stroke="#ffc658" name="Recall" />
                <Line type="monotone" dataKey="f1_score" stroke="#ff7300" name="F1 Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Drift & Prediction Volume */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Data Drift Score</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metrics}
                  margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={str => {
                      const date = new Date(str);
                      return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis domain={[0, 1]} />
                  <Tooltip 
                    formatter={(value) => [`${(value * 100).toFixed(2)}%`, '']}
                    labelFormatter={value => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="dataDrift" 
                    stroke="#ff0000" 
                    name="Data Drift"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Prediction Volume</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={metrics}
                  margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={str => {
                      const date = new Date(str);
                      return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={value => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictionCount" 
                    stroke="#8884d8" 
                    name="Predictions"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics && metrics.length > 0 && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-gray-500 text-sm">Current Accuracy</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-semibold text-gray-900">
                    {(metrics[metrics.length-1].accuracy * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-gray-500 text-sm">Current F1 Score</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-semibold text-gray-900">
                    {(metrics[metrics.length-1].f1_score * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-gray-500 text-sm">Data Drift Status</h3>
                <div className="mt-2 flex items-baseline">
                  <span className={`text-xl font-semibold ${
                    metrics[metrics.length-1].dataDrift < 0.1 
                      ? 'text-green-600' 
                      : metrics[metrics.length-1].dataDrift < 0.3 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {metrics[metrics.length-1].dataDrift < 0.1 
                      ? 'No Drift Detected' 
                      : metrics[metrics.length-1].dataDrift < 0.3 
                        ? 'Minor Drift Detected' 
                        : 'Significant Drift'}
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-gray-500 text-sm">Total Predictions</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-semibold text-gray-900">
                    {metrics.reduce((sum, item) => sum + item.predictionCount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
