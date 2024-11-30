const express = require('express');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Import Routes
const googleTrendsRoutes = require('./src/routes/google-api');
const rssFeedsRoutes = require('./src/routes/rss-feeds-api');
const twitterTrendsRoutes = require('./src/routes/twitter-api');
const redditTrendsRoutes = require('./src/routes/reddit-api');
const trendsRouter = require('./src/routes/trends');
const fetchDataRouter = require('./src/routes/fetchData');

// Use Routes
app.use('/api/google-trends', googleTrendsRoutes);
app.use('/api/rss-trends', rssFeedsRoutes);
app.use('/api/twitter-trends', twitterTrendsRoutes);
app.use('/api/reddit-trends', redditTrendsRoutes);
app.use('/api/trends', trendsRouter);
app.use('/api/fetchdata', fetchDataRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
