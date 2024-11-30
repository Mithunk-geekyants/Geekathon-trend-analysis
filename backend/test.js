const axios = require('axios');
const fs = require('fs');

// Fetch data from APIs
const fetchData = async () => {
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
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
};

// Fetch data every 5 minutes
setInterval(fetchData, 300000); // 300,000ms = 5 minutes
fetchData();