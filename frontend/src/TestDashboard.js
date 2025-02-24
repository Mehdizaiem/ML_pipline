import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const TestDashboard = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState(null);
  const [testCategories, setTestCategories] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTestResults();
    const interval = setInterval(fetchTestResults, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/test-results');
      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }
      const data = await response.json();
      setTestResults(data);
      setTestCategories(processTestCategories(data.results || []));
      setError(null);
    } catch (error) {
      console.error('Error fetching test results:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processTestCategories = (results) => {
    const categories = {
      'Unit Tests': { passed: 0, failed: 0, total: 0 },
      'Integration Tests': { passed: 0, failed: 0, total: 0 },
      'API Tests': { passed: 0, failed: 0, total: 0 }
    };

    results.forEach(test => {
      let category;
      if (test.name.includes('test_app.py') || test.name.includes('test_model_pipeline.py')) {
        category = 'Unit Tests';
      } else if (test.name.includes('test_pipeline_integration.py')) {
        category = 'Integration Tests';
      } else if (test.name.includes('test_endpoints.py')) {
        category = 'API Tests';
      }

      if (category) {
        categories[category].total += 1;
        if (test.status === 'passed') {
          categories[category].passed += 1;
        } else {
          categories[category].failed += 1;
        }
      }
    });

    return Object.entries(categories).map(([name, counts]) => ({
      name,
      passed: counts.passed,
      failed: counts.failed,
      total: counts.total,
      passRate: counts.total > 0 ? (counts.passed / counts.total * 100).toFixed(1) : 0
    }));
  };

  const getPassRate = () => {
    if (!testResults?.total) return 0;
    return ((testResults.passed / testResults.total) * 100).toFixed(1);
  };

  const formatDuration = (duration) => {
    if (duration < 1) {
      return `${(duration * 1000).toFixed(0)}ms`;
    }
    return `${duration.toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 rounded-lg bg-white shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 rounded-lg bg-white shadow-lg text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Test Results</h3>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchTestResults}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          <div className="flex space-x-4">
            <button 
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'overview' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'details' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Test Details
            </button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-700">Total Tests</h3>
                  <span className="text-3xl font-bold text-blue-500">{testResults?.total || 0}</span>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded">
                    <div className="h-2 bg-blue-500 rounded" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-700">Passed</h3>
                  <span className="text-3xl font-bold text-green-500">{testResults?.passed || 0}</span>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded">
                    <div 
                      className="h-2 bg-green-500 rounded" 
                      style={{ width: `${getPassRate()}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-700">Failed</h3>
                  <span className="text-3xl font-bold text-red-500">{testResults?.failed || 0}</span>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded">
                    <div 
                      className="h-2 bg-red-500 rounded" 
                      style={{ width: `${100 - getPassRate()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-6">Test Results by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={testCategories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="passed" fill="#10B981" name="Passed" />
                      <Bar dataKey="failed" fill="#EF4444" name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-6">Test Duration Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={testResults?.results || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="#6366F1" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                        name="Duration (s)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Detailed Test Results */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-6">Test Details</h3>
              <div className="space-y-4">
                {testCategories?.map((category, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                      <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {category.passRate}% passed
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {category.total} tests
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded mb-4">
                      <div 
                        className="h-2 bg-green-500 rounded" 
                        style={{ width: `${category.passRate}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>Passed: {category.passed}</div>
                      <div>Failed: {category.failed}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-6">Individual Test Results</h3>
              <div className="space-y-4">
                {testResults?.results?.map((test, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-101 ${
                      selectedTest === index 
                        ? 'ring-2 ring-blue-500' 
                        : ''
                    } ${
                      test.status === 'passed'
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'bg-red-50 hover:bg-red-100'
                    }`}
                    onClick={() => setSelectedTest(index)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{test.name}</h4>
                        {test.error_message && (
                          <p className="text-red-600 text-sm mt-2 font-mono bg-red-50 p-2 rounded">
                            {test.error_message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
                          {formatDuration(test.duration)}
                        </span>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          test.status === 'passed'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {test.status === 'passed' ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestDashboard;
