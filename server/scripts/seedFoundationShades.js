// server/scripts/seedFoundationShades.js
const mongoose = require('mongoose');
const FoundationShade = require('../models/foundationShade');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const foundationShades = [
            { brand: 'Maybelline', shade: 'Fit Me 120', hexCode: '#E8C0A7', skinToneRange: 'Light' },
            { brand: 'Fenty Beauty', shade: '220', hexCode: '#F4C7A0', skinToneRange: 'Medium' },
            { brand: 'MAC', shade: 'NC42', hexCode: '#B77A55', skinToneRange: 'Medium' },
            { brand: 'Black Opal', shade: 'Hazelnut', hexCode: '#8E5B45', skinToneRange: 'Dark' }
        ];

        await FoundationShade.insertMany(foundationShades);
        console.log('Foundation shades added to the database');
        mongoose.disconnect();
    })
    .catch((err) => {
        console.error('Error seeding database:', err);
        mongoose.disconnect();
    });
