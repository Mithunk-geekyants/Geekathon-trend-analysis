require('dotenv').config();
const express = require('express');
const cors = require('cors');
const trendsRoutes = require('./src/routes/trends.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', trendsRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Tech Trends Scraper API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 