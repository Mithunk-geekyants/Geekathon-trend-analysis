const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const fs = require('fs');

// Load environment variables from a .env file
require('dotenv').config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure the API key is in your .env file
});

// Middleware to parse JSON bodies
router.use(bodyParser.json());

// API Endpoint to fetch tech trends
router.post('/', async (req, res) => {
    try {
        // Load data from the trends file
        const data = fs.readFileSync('./data/trends.json', 'utf-8');
        const trendsData = JSON.parse(data);
        
        // Check if the necessary properties exist
        const rssArticles = trendsData.rss?.posts || [];
        const googleTrends = trendsData.google?.trends || [];
        const redditPosts = trendsData.reddit?.posts || [];

        // Extract trends from the JSON structure
        const trendsArray = [
            ...rssArticles.map(article => ({
                title: article.title,
                source: article.source,
                url: article.link,
                description: article.title // You can modify this to include a more detailed description if needed
            })),
            ...googleTrends.flatMap(trend => 
                trend.latestTrends.map(latestTrend => ({
                    title: latestTrend.title,
                    source: latestTrend.source,
                    url: latestTrend.link,
                    description: latestTrend.summary // Use the summary as the description
                }))
            ),
            ...redditPosts.map(post => ({
                title: post.title,
                source: post.source,
                url: post.link,
                description: post.title // You can modify this to include a more detailed description if needed
            }))
        ];

        // Filter out trends that seem too basic or irrelevant
        const filteredTrends = trendsArray.filter(trend => {
            const lowerDescription = trend.description?.toLowerCase() || '';
            return !(
                lowerDescription.includes('program syntax') || 
                lowerDescription.includes('basic tutorial') ||
                lowerDescription.includes('how to write a tech article') ||
                lowerDescription.includes('basic explanation') ||
                lowerDescription.includes('introductory guide')
            );
        });

        // Group trends by title or keyword and count their occurrences to order by popularity
        const trendOccurrences = filteredTrends.reduce((acc, trend) => {
            if (!trend?.title) return acc; // Skip trends without a title
            const key = trend.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
            if (acc[key]) {
                acc[key].count += 1;
                acc[key].source.push(trend.source);
                acc[key].url.push(trend.url);
            } else {
                acc[key] = {
                    count: 1,
                    title: trend.title,
                    source: [trend.source],
                    url: [trend.url],
                    description: trend.description || '',
                };
            }
            return acc;
        }, {});

        // Sort trends by occurrence count (popularity)
        const sortedTrends = Object.values(trendOccurrences)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Get the top 10 trends

        // Format the prompt to ask GPT-4 for a clean and structured response
        const prompt = `
You are a professional trend analyst for the Information Technology industry. 
Analyze the following data and extract the top 10 most significant and popular trends:

${JSON.stringify(sortedTrends, null, 2)}

For each trend, provide:
- **title**: A brief title of the trend.
- **source**: List the sources where this trend has been mentioned.
- **url**: Provide URLs that point to articles about the trend.
- **description**: A short description of the trend.

Respond ONLY with valid JSON in the following format:
\`\`\`json
[
  {
    "title": "Title of the Trend",
    "source": ["Source1", "Source2"],
    "url": ["https://example.com/article1"],
    "description": "A brief overview of the trend."
  }
]
\`\`\`
`;

        // Request GPT-4 completion
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a professional trend analyst in the tech industry.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: 800,
            temperature: 0.7,
        });

        // Extract raw response from OpenAI
        const rawResponse = completion.choices[0].message.content.trim();
        console.log('Raw OpenAI Response:', rawResponse); // Log the raw response

        // Attempt to extract valid JSON from the response
        const jsonMatch = rawResponse.match(/\[\s*{[\s\S]*}\s*\]/);
        if (!jsonMatch) {
            console.error('OpenAI response is not valid JSON:', rawResponse); // Log the invalid response
            throw new Error('Failed to find valid JSON in OpenAI response.');
        }

        // Parse the JSON and send it as a response
        const jsonResponse = JSON.parse(jsonMatch[0]);

        // Return JSON response to the client
        res.json(jsonResponse);
    } catch (error) {
        console.error('Error occurred:', error.message);
        res.status(500).json({
            error: 'Failed to process the OpenAI response.',
            message: error.message,
        });
    }
});

module.exports = router; // Export the router
