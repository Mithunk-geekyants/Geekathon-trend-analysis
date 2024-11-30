const axios = require('axios');
const fs = require('fs');
const express = require('express');
const router = express.Router();

// Fetch data from APIs
router.get('/', async (req, res) => {
  try {
    const rssData = await axios.get('http://localhost:3000/api/rss-trends');
    const googleData = await axios.get('http://localhost:3000/api/google-trends');
    const redditData = await axios.get('http://localhost:3000/api/reddit-trends');

    // Combine data into one JSON
    const combinedData = {
      rss: rssData.data,
      google: googleData.data,
      reddit: redditData.data,
    };

    // Save to a JSON file
    fs.writeFileSync('data/trends.json', JSON.stringify(combinedData, null, 2)); 
    console.log('Data saved!');

    // Send a response back to the client
    res.status(200).json({ message: 'Data fetched and saved successfully!' });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
});

module.exports = router;