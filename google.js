const googleTrends = require('google-trends-api');

const fetchGoogleTrends = async () => {
    try {
        const data = await googleTrends.dailyTrends({
            geo: 'US',
        });
        const trends = JSON.parse(data).default.trendingSearchesDays[0].trendingSearches;
        return trends.map(trend => ({
            title: trend.title.query,
            articles: trend.articles.map(article => article.title),
        }));
    } catch (error) {
        console.error('Error fetching Google Trends:', error.message);
    }
};

fetchGoogleTrends()
    .then(trends => console.log('Google Trends:', trends))
    .catch(err => console.error('Error:', err));
