import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Grid, CircularProgress, Snackbar, Alert, MenuItem } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
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
    
    // Convert numeric strings to numbers for numeric fields
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
      showAlert(`Prediction successful: ${result.prediction === 1 ? 'Customer will churn' : 'Customer will stay'}`, 
                result.prediction === 1 ? 'warning' : 'success');
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Telecom Customer Churn Predictor
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Enter Customer Data
              </Typography>
              
              <form onSubmit={handleSubmit}>
                {/* Customer Information */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Customer Information
                </Typography>
                <Grid container spacing={2}>
                  {/* State dropdown */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="State"
                      name="State"
                      value={formData['State']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    >
                      {states.map((state) => (
                        <MenuItem key={state} value={state}>{state}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  {/* Area code dropdown */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Area Code"
                      name="Area code"
                      value={formData['Area code']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    >
                      {areaCodes.map((code) => (
                        <MenuItem key={code} value={code}>{code}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  {/* Account length */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account Length (days)"
                      name="Account length"
                      type="number"
                      value={formData['Account length']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  
                  {/* Plan types */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="International Plan"
                      name="International plan"
                      value={formData['International plan']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Voice Mail Plan"
                      name="Voice mail plan"
                      value={formData['Voice mail plan']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Number of Voicemail Messages"
                      name="Number vmail messages"
                      type="number"
                      value={formData['Number vmail messages']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                {/* Day Usage */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Day Usage
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Day Minutes"
                      name="Total day minutes"
                      type="number"
                      value={formData['Total day minutes']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Day Calls"
                      name="Total day calls"
                      type="number"
                      value={formData['Total day calls']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Day Charge ($)"
                      name="Total day charge"
                      type="number"
                      value={formData['Total day charge']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                {/* Evening Usage */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Evening Usage
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Evening Minutes"
                      name="Total eve minutes"
                      type="number"
                      value={formData['Total eve minutes']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Evening Calls"
                      name="Total eve calls"
                      type="number"
                      value={formData['Total eve calls']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Evening Charge ($)"
                      name="Total eve charge"
                      type="number"
                      value={formData['Total eve charge']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                {/* Night Usage */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Night Usage
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Night Minutes"
                      name="Total night minutes"
                      type="number"
                      value={formData['Total night minutes']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Night Calls"
                      name="Total night calls"
                      type="number"
                      value={formData['Total night calls']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Night Charge ($)"
                      name="Total night charge"
                      type="number"
                      value={formData['Total night charge']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                {/* International Usage */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  International Usage
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Int'l Minutes"
                      name="Total intl minutes"
                      type="number"
                      value={formData['Total intl minutes']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Int'l Calls"
                      name="Total intl calls"
                      type="number"
                      value={formData['Total intl calls']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Int'l Charge ($)"
                      name="Total intl charge"
                      type="number"
                      value={formData['Total intl charge']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
                
                {/* Customer Service */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Customer Service
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Service Calls"
                      name="Customer service calls"
                      type="number"
                      value={formData['Customer service calls']}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sx={{ mt: 3 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Predict Churn'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Prediction Results
              </Typography>
              
              {prediction ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="h4" color={prediction.prediction === 1 ? 'error' : 'success'} gutterBottom>
                    {prediction.prediction === 1 ? 'Customer Will Churn' : 'Customer Will Stay'}
                  </Typography>
                  
                  <Box sx={{ width: '100%', mt: 3 }}>
                    <Typography variant="body1" gutterBottom>
                      Churn Probability: {(prediction.churn_probability * 100).toFixed(2)}%
                    </Typography>
                    <Box 
                      sx={{ 
                        height: 20, 
                        width: '100%', 
                        bgcolor: '#e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${prediction.churn_probability * 100}%`,
                          bgcolor: prediction.churn_probability > 0.5 ? 'error.main' : 'warning.main',
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body1" sx={{ mt: 2 }} gutterBottom>
                      Retention Probability: {(prediction.retention_probability * 100).toFixed(2)}%
                    </Typography>
                    <Box 
                      sx={{ 
                        height: 20, 
                        width: '100%', 
                        bgcolor: '#e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${prediction.retention_probability * 100}%`,
                          bgcolor: 'success.main',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    Enter customer data and click "Predict Churn" to see results
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                Feature Importance
              </Typography>
              
              {features.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={prepareChartData()}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                    />
                    <YAxis label={{ value: 'Importance (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Importance']} />
                    <Legend />
                    <Bar dataKey="importance" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
