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
        
        // Ensure trendsData is an array
        const trendsArray = Array.isArray(trendsData) ? trendsData : 
                          Array.isArray(trendsData.trends) ? trendsData.trends : 
                          Object.values(trendsData);

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
                acc[key].source.push(...(trend.source || []));
                acc[key].url.push(...(trend.url || []));
            } else {
                acc[key] = {
                    count: 1,
                    title: trend.title,
                    source: [...(trend.source || [])],
                    url: [...(trend.url || [])],
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
Your task is to analyze the following data and extract the top 10 most significant and popular trends:

${JSON.stringify(sortedTrends, null, 2)}

For each trend, provide the following:
- **title**: A brief, clear title of the trend.
- **source**: List the sources (platforms or websites) where this trend has been mentioned.
- **url**: Provide one or more URLs that can point to articles, blogs, or videos about the trend.
- **description**: A short description of the trend and its relevance to the Information Technology industry.

Please remove any redundant information and focus only on the most relevant and impactful trends.

Respond ONLY with valid JSON. The format should be:
\`\`\`json
[
  {
    "title": "Title of the Trend",
    "source": ["Source1", "Source2"],
    "url": ["https://example.com/article1"],
    "description": "A brief overview of the trend in the Information Technology industry."
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

        // Attempt to extract valid JSON from the response
        const jsonMatch = rawResponse.match(/\[\s*{[\s\S]*}\s*\]/);
        if (!jsonMatch) {
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
