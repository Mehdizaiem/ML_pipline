import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { ChartBarIcon, UserGroupIcon, PhoneIcon, ChartPieIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Card, Metric, Text, Title, BarChart, LineChart, DonutChart } from '@tremor/react';
import CountUp from 'react-countup';
import TestDashboard from './components/TestDashboard';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState([]);
  const [formData, setFormData] = useState({
    'State': 'KS',
    'Account length': 100,
    'Area code': 415,
    'International plan': 'no',
    'Voice mail plan': 'no',
    'Number vmail messages': 0,
    'Total day minutes': 200,
    'Total day calls': 100,
    'Total day charge': 34.0,
    'Total eve minutes': 200,
    'Total eve calls': 100,
    'Total eve charge': 17.0,
    'Total night minutes': 200,
    'Total night calls': 100,
    'Total night charge': 9.0,
    'Total intl minutes': 10,
    'Total intl calls': 4,
    'Total intl charge': 2.7,
    'Customer service calls': 1
  });
  const [prediction, setPrediction] = useState(null);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // States for dropdown options
  const [states] = useState([
    'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 
    'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 
    'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 
    'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 
    'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'
  ]);
  const [areaCodes] = useState([408, 415, 510]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/features');
      if (!response.ok) throw new Error('Failed to fetch features');
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      showAlert(`Error: ${error.message}`, 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name !== 'State' && 
        name !== 'International plan' && 
        name !== 'Voice mail plan') {
      processedValue = parseFloat(value) || 0;
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const requestData = {
        features: formData
      };
      
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Prediction failed');
      }
      
      const result = await response.json();
      setPrediction(result);
      showAlert(
        `Prediction successful: ${result.prediction === 1 ? 'Customer will churn' : 'Customer will stay'}`,
        result.prediction === 1 ? 'warning' : 'success'
      );
    } catch (error) {
      showAlert(`Error: ${error.message}`, 'error');
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity) => {
    setAlert({
      open: true,
      message,
      severity
    });
  };

  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  const prepareChartData = () => {
    if (!features || features.length === 0) return [];
    return features.slice(0, 10).map(feature => ({
      name: feature.name,
      importance: parseFloat((feature.importance * 100).toFixed(2))
    }));
  };

  if (showDashboard) {
    return <TestDashboard onBack={() => setShowDashboard(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        className="container mx-auto px-4 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Section */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-4">
            <motion.div
              className="p-3 bg-indigo-600 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneIcon className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Telecom Customer Churn Predictor
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Predict customer behavior with advanced ML
              </p>
            </div>
          </div>
          
          <motion.button
            onClick={() => setShowDashboard(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg
                     transition-colors duration-200 flex items-center space-x-2 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChartPieIcon className="h-5 w-5" />
            <span>View Test Results</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <UserGroupIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Customer Information
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    State
                  </label>
                  <select
                    name="State"
                    value={formData['State']}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Area Code
                  </label>
                  <select
                    name="Area code"
                    value={formData['Area code']}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    {areaCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Plans Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    International Plan
                  </label>
                  <select
                    name="International plan"
                    value={formData['International plan']}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Voice Mail Plan
                  </label>
                  <select
                    name="Voice mail plan"
                    value={formData['Voice mail plan']}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Usage Sections */}
              <div className="space-y-6">
                {/* Day Usage */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
                    <span>Day Usage</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      name="Total day minutes"
                      value={formData['Total day minutes']}
                      onChange={handleInputChange}
                      placeholder="Minutes"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total day calls"
                      value={formData['Total day calls']}
                      onChange={handleInputChange}
                      placeholder="Calls"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total day charge"
                      value={formData['Total day charge']}
                      onChange={handleInputChange}
                      placeholder="Charge"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Evening Usage */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
                    <span>Evening Usage</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      name="Total eve minutes"
                      value={formData['Total eve minutes']}
                      onChange={handleInputChange}
                      placeholder="Minutes"
                      className="rounded-lg border border-gray-300 dark:
                      border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total eve calls"
                      value={formData['Total eve calls']}
                      onChange={handleInputChange}
                      placeholder="Calls"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total eve charge"
                      value={formData['Total eve charge']}
                      onChange={handleInputChange}
                      placeholder="Charge"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Night Usage */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
                    <span>Night Usage</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      name="Total night minutes"
                      value={formData['Total night minutes']}
                      onChange={handleInputChange}
                      placeholder="Minutes"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total night calls"
                      value={formData['Total night calls']}
                      onChange={handleInputChange}
                      placeholder="Calls"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total night charge"
                      value={formData['Total night charge']}
                      onChange={handleInputChange}
                      placeholder="Charge"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* International Usage */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600" />
                    <span>International Usage</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      name="Total intl minutes"
                      value={formData['Total intl minutes']}
                      onChange={handleInputChange}
                      placeholder="Minutes"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total intl calls"
                      value={formData['Total intl calls']}
                      onChange={handleInputChange}
                      placeholder="Calls"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      name="Total intl charge"
                      value={formData['Total intl charge']}
                      onChange={handleInputChange}
                      placeholder="Charge"
                      className="rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Customer Service */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                    <span>Customer Service</span>
                  </h3>
                  <input
                    type="number"
                    name="Customer service calls"
                    value={formData['Customer service calls']}
                    onChange={handleInputChange}
                    placeholder="Number of calls"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg
                         hover:bg-indigo-700 transition-colors duration-200
                         flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <ChartBarIcon className="h-5 w-5" />
                    <span>Predict Churn</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
          {/* Results Section */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <ChartPieIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Prediction Results
              </h2>
            </div>

            {prediction ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center p-6 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
                  <h3 className={`text-3xl font-bold mb-2 ${
                    prediction.prediction === 1 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {prediction.prediction === 1 ? 'Customer Will Churn' : 'Customer Will Stay'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Confidence Score
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Retention Probability
                    </p>
                    <CountUp
                      end={prediction.retention_probability * 100}
                      decimals={1}
                      suffix="%"
                      duration={2}
                      className="text-2xl font-bold text-green-600 dark:text-green-400"
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-red-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Churn Probability
                    </p>
                    <CountUp
                      end={prediction.churn_probability * 100}
                      decimals={1}
                      suffix="%"
                      duration={2}
                      className="text-2xl font-bold text-red-600 dark:text-red-400"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Probability Distribution
                  </h4>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-red-500"
                      style={{ width: `${prediction.churn_probability * 100}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Enter customer data and click "Predict Churn" to see results
              </div>
            )}
          </motion.div>
        </div>

        {/* Feature Importance Chart */}
        <motion.div
          variants={itemVariants}
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Feature Importance
            </h2>
          </div>

          {features.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareChartData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis
                    label={{ 
                      value: 'Importance (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: '#666'
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Importance']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #ccc'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="importance" 
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Alert */}
      <AnimatePresence>
        {alert.open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
              alert.severity === 'success' ? 'bg-green-100 text-green-800' :
              alert.severity === 'error' ? 'bg-red-100 text-red-800' :
              alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {alert.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
