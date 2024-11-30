const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    try {
        // Using NewsAPI to get tech trends (you'll need to sign up for a free API key)
        const NEWS_API_KEY = 'f10fa9487ad14a48bd887a262d9f8afe'; // Get from newsapi.org
        const sources = [
            'techcrunch',
            'wired',
            'the-verge',
            'ars-technica',
            'hacker-news'
        ].join(',');

        const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
            params: {
                apiKey: NEWS_API_KEY,
                sources: sources,
                pageSize: 100
            }
        });

        // Categories to track
        const categories = {
            'AI & ML': ['ai', 'machine learning', 'chatgpt', 'artificial intelligence', 'deep learning', 'openai'],
            'Programming': ['programming', 'developer', 'javascript', 'python', 'coding', 'software'],
            'Cloud & DevOps': ['cloud', 'aws', 'azure', 'devops', 'kubernetes', 'docker'],
            'Cybersecurity': ['security', 'cyber', 'hack', 'vulnerability', 'privacy', 'encryption'],
            'Emerging Tech': ['blockchain', 'web3', 'metaverse', 'quantum', '5g', 'iot']
        };

        // Process articles and categorize them
        const categorizedArticles = {};
        const articles = response.data.articles;

        articles.forEach(article => {
            const text = `${article.title} ${article.description}`.toLowerCase();
            
            for (const [category, keywords] of Object.entries(categories)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    if (!categorizedArticles[category]) {
                        categorizedArticles[category] = [];
                    }
                    categorizedArticles[category].push({
                        title: article.title,
                        link: article.url,
                        source: article.source.name,
                        publishedDate: article.publishedAt,
                        timeAgo: getTimeAgo(new Date(article.publishedAt)),
                        summary: article.description
                    });
                }
            }
        });

        // Format trends data
        const trends = Object.entries(categorizedArticles).map(([category, articles]) => ({
            category,
            trendCount: articles.length,
            latestTrends: articles
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, 3)
        })).sort((a, b) => b.trendCount - a.trendCount);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            trendsCount: trends.length,
            trends,
            categories: Object.keys(categorizedArticles)
        });

    } catch (error) {
        console.error('Error fetching Tech Trends:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Tech Trends',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'Just now';
}

module.exports = router;