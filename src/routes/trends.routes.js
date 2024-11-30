const express = require('express');
const router = express.Router();
const twitterService = require('../services/twitter.service');

router.get('/tech-trends', async (req, res) => {
    try {
        const trends = await twitterService.getTechTrends();
        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 