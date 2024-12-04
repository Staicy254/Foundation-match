// server/models/foundationShade.js
const mongoose = require('mongoose');

const foundationShadeSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    shade: { type: String, required: true },
    hexCode: { type: String, required: true },
    skinToneRange: { type: String, required: true }, // Example: "Light", "Medium", "Dark"
});

const FoundationShade = mongoose.model('FoundationShade', foundationShadeSchema);

module.exports = FoundationShade;
