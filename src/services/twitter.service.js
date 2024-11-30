const { TwitterApi } = require('twitter-api-v2');
const config = require('../config/twitter.config');

class TwitterService {
    constructor() {
        this.client = new TwitterApi(config.bearerToken);
        this.readOnlyClient = this.client.readOnly;
    }

    async getTechTrends() {
        try {
            console.log('Fetching tech trends...');

            // Single comprehensive query with high engagement filter
            const query = `(AI OR "Artificial Intelligence" OR Programming OR "Software Development" OR Tech) 
                          min_faves:1000 
                          -is:retweet 
                          lang:en`;

            const response = await this.readOnlyClient.v2.search(query, {
                'tweet.fields': ['public_metrics', 'created_at'],
                max_results: 20,  // Reduced to avoid rate limits
                sort_order: 'relevancy'
            });

            if (!response.data) {
                console.log('No trends found');
                return [];
            }

            // Process tweets
            const trends = response.data.map(tweet => ({
                topic: this.categorizeTrend(tweet.text),
                content: this.cleanTweet(tweet.text),
                likes: tweet.public_metrics.like_count,
                retweets: tweet.public_metrics.retweet_count,
                engagement: tweet.public_metrics.like_count + tweet.public_metrics.retweet_count,
                timestamp: tweet.created_at
            }));

            console.log(`Found ${trends.length} tech trends`);
            return trends;

        } catch (error) {
            // More detailed error logging
            if (error.data) {
                console.error('Twitter API Error:', {
                    message: error.data.detail || error.data.title,
                    errors: error.data.errors,
                    code: error.code
                });
            } else {
                console.error('Error:', error.message);
            }
            throw error;
        }
    }

    cleanTweet(text) {
        return text
            .replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
            .replace(/\n/g, ' ')
            .replace(/@\w+/g, '')
            .replace(/#/g, '')
            .trim();
    }

    categorizeTrend(text) {
        const categories = {
            'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai'],
            'Web/Mobile': ['web', 'app', 'mobile', 'frontend', 'backend'],
            'Programming': ['code', 'programming', 'developer', 'software'],
            'Tech News': ['launch', 'announced', 'released', 'update'],
            'Tech Companies': ['google', 'apple', 'microsoft', 'meta', 'amazon']
        };

        const normalizedText = text.toLowerCase();
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => normalizedText.includes(keyword))) {
                return category;
            }
        }

        return 'General Tech';
    }
}

module.exports = new TwitterService();