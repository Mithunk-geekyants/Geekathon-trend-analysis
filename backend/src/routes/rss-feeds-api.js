const express = require('express');
const router = express.Router();
const RSSParser = require('rss-parser');
const parser = new RSSParser();

router.get('/', async (req, res) => {
    try {
        // Updated tech news sources focusing on latest news
        const techFeeds = [
            'https://techcrunch.com/feed/',
            'https://feeds.feedburner.com/TheHackersNews',
            'https://hnrss.org/newest?points=100',
            'https://www.techmeme.com/feed.xml?x=1',
            'https://dev.to/feed/latest'
        ];

        // Enhanced keywords for current tech trends
        const techKeywords = [
            'latest', 'new', 'launch', 'update', 'release',
            'ai', 'machine learning', 'programming', 'developer',
            'cloud', 'data science', 'cybersecurity', 'blockchain',
            'startup', 'funding', 'tech industry', 'innovation',
            'framework', 'language', 'tool', 'platform'
        ];

        const articles = [];
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        for (const feedUrl of techFeeds) {
            try {
                const feed = await parser.parseURL(feedUrl);
                const feedArticles = feed.items
                    .map(item => ({
                        title: item.title,
                        link: item.link,
                        publishedDate: new Date(item.pubDate),
                        source: feed.title || 'Unknown',
                        description: item.contentSnippet || item.description || ''
                    }))
                    // Filter for articles within last 24 hours
                    .filter(article => article.publishedDate > twentyFourHoursAgo)
                    .filter(article => 
                        techKeywords.some(keyword => 
                            article.title.toLowerCase().includes(keyword.toLowerCase()) ||
                            article.description.toLowerCase().includes(keyword.toLowerCase())
                        )
                    );
                articles.push(...feedArticles);
            } catch (feedError) {
                console.error(`Error fetching feed ${feedUrl}:`, feedError.message);
                continue;
            }
        }

        // Sort by date and get most recent
        const finalArticles = articles
            .sort((a, b) => b.publishedDate - a.publishedDate)
            .slice(0, 15)
            .map(({ description, ...article }) => ({
                ...article,
                publishedDate: article.publishedDate.toISOString(),
                timeAgo: getTimeAgo(article.publishedDate)
            }));

        res.json({ 
            success: true, 
            timestamp: new Date().toISOString(),
            articles: finalArticles 
        });
    } catch (error) {
        console.error('Error fetching Tech RSS feeds:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch Tech RSS feeds' });
    }
});

// Helper function to show how long ago an article was published
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
}

module.exports = router;