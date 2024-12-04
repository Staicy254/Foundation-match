require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const vision = require('@google-cloud/vision');
const FoundationShade = require('./models/foundationShade');
const { findClosestShade } = require('./utils/colorMatcher');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Set up Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Save images in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Use unique filename
    }
});

const upload = multer({ storage: storage });

// Set the environment variable for authentication using the dotenv package
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS; // Use environment variable
process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;  // Set path for Google credentials

// Initialize the Vision API client
const client = new vision.ImageAnnotatorClient({
    keyFilename: credentialsPath // Use the credentials path from environment variable
});

// Endpoint to upload and analyze image
app.post('/analyze-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }

    try {
        // Log file details for debugging
        console.log('Uploaded file:', req.file);

        // Analyze the image for dominant colors
        const [result] = await client.imageProperties(`./uploads/${req.file.filename}`);
        const colors = result.imagePropertiesAnnotation.dominantColors.colors;

        if (!colors || colors.length === 0) {
            return res.status(404).json({ error: 'No dominant colors found in the image' });
        }

        // Extract primary color
        const primaryColor = colors[0].color;

        // Fetch foundation shades from the database
        const foundationShades = await FoundationShade.find();

        if (foundationShades.length === 0) {
            return res.status(404).json({ error: 'No foundation shades available in the database' });
        }

        // Match the detected color to the closest foundation shade
        const closestShade = findClosestShade(primaryColor, foundationShades);

        res.json({
            message: 'Image analyzed successfully!',
            detectedColor: `rgb(${primaryColor.red}, ${primaryColor.green}, ${primaryColor.blue})`,
            closestShade,
        });
    } catch (err) {
        console.error('Error analyzing the image:', err);
        res.status(500).json({ error: 'Error analyzing the image', details: err.message });
    }
});

// Base route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Foundation Shade Analyzer API!',
        status: 'API is up and running',
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));
