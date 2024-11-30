const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.get('/', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://twitter.com/explore/tabs/trending');
        await page.waitForSelector('div.css-1dbjc4n');

        // Scrape trending topics
        const trends = await page.evaluate(() => {
            const trendElements = document.querySelectorAll('div.css-1dbjc4n span');
            return Array.from(trendElements).map(el => el.innerText).slice(0, 10);
        });

        await browser.close();
        res.json({ success: true, trends });
    } catch (error) {
        console.error('Error scraping Twitter:', error.message);
        res.status(500).json({ success: false, message: 'Failed to scrape Twitter trends' });
    }
});

module.exports = router;