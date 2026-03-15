// Route definitions related to analyzing captured browser resources.
// This file only describes URL shapes and delegates to the controller.

const express = require('express');
const router = express.Router();

const analyzeController = require('../controllers/analyzeController');

// POST /analyze
// Expects JSON body: { "title": "page title", "url": "page url" }
router.post('/', analyzeController.analyzeResource);

module.exports = router;

