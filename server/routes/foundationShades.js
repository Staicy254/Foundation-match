const express = require('express');
const router = express.Router();
const FoundationShade = require('../models/foundationShade');

// Fetch all foundation shades
router.get('/foundation-shades', async (req, res) => {
    try {
        const shades = await FoundationShade.find();
        res.json(shades);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch foundation shades' });
    }
});

module.exports = router;
