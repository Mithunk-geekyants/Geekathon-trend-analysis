const express = require('express');
const router = express.Router();
const RSSParser = require('rss-parser');
const parser = new RSSParser();

router.get('/', async (req, res) => {
    try {
        // Tech subreddits configuration
        const redditFeeds = {
            // Programming and Development
            'https://www.reddit.com/r/programming+learnprogramming+coding+webdev/.rss?sort=hot&t=day': 'Development',
            
            // Technology and AI
            'https://www.reddit.com/r/technology+artificial+MachineLearning+ChatGPT/.rss?sort=hot&t=day': 'Tech & AI',
            
            // Computer Science and Software
            'https://www.reddit.com/r/compsci+softwareengineering+cscareerquestions/.rss?sort=hot&t=day': 'Computer Science',
            
            // Specific Technologies
            'https://www.reddit.com/r/javascript+python+java+golang/.rss?sort=hot&t=day': 'Programming Languages',
            
            // Tech Industry
            'https://www.reddit.com/r/tech+technews+TechNewsToday/.rss?sort=hot&t=day': 'Tech News',

            // Search-based feeds for trending topics
            'https://www.reddit.com/search.rss?q=title%3A(AI+OR+Machine+Learning+OR+ChatGPT)&sort=hot&t=day': 'AI Trends',
            'https://www.reddit.com/search.rss?q=title%3A(Programming+OR+Coding+OR+Development)&sort=hot&t=day': 'Dev Trends'
        };

        const allPosts = [];
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const [feedUrl, category] of Object.entries(redditFeeds)) {
            try {
                const feed = await parser.parseURL(feedUrl);
                const posts = feed.items
                    .map(item => {
                        // Extract post score from title if available
                        const scoreMatch = item.title.match(/\[(\d+)\]/);
                        const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
                        
                        return {
                            title: item.title.replace(/\[\d+\]\s*/, ''), // Remove score from title
                            link: item.link,
                            // category: category,
                            source: 'Reddit',
                            // author: item.author || 'Unknown',
                            publishedDate: new Date(item.pubDate),
                            // subreddit: item.link.split('/r/')[1]?.split('/')[0] || 'Unknown',
                            // score: score,
                            // commentsLink: item.link,
                            timeAgo: getTimeAgo(new Date(item.pubDate))
                        };
                    })
                    .filter(post => post.publishedDate > twentyFourHoursAgo);

                allPosts.push(...posts);
            } catch (error) {
                console.error(`Error fetching ${category} feed:`, error.message);
                continue;
            }

            // Small delay to avoid overwhelming Reddit's servers
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Remove duplicates based on title
        const uniquePosts = Array.from(new Map(allPosts.map(post => [post.title, post])).values());

        // Sort and format the final response
        const sortedPosts = uniquePosts
            .sort((a, b) => b.publishedDate - a.publishedDate)
            .slice(0, 30)
            .map(({ publishedDate, ...post }) => ({
                ...post,
                publishedDate: publishedDate.toISOString()
            }));

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            postCount: sortedPosts.length,
            categories: [...new Set(sortedPosts.map(post => post.category))],
            posts: sortedPosts
        });

    } catch (error) {
        console.error('Error fetching Reddit trends:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Reddit trends',
            error: error.message
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
