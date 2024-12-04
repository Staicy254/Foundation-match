// server/utils/colorMatcher.js
const colorDifference = (color1, color2) => {
    // Calculate Euclidean distance between two RGB colors
    return Math.sqrt(
        Math.pow(color1.red - color2.red, 2) +
        Math.pow(color1.green - color2.green, 2) +
        Math.pow(color1.blue - color2.blue, 2)
    );
};

const findClosestShade = (detectedColor, foundationShades) => {
    let closestShade = null;
    let smallestDifference = Infinity;

    foundationShades.forEach((shade) => {
        const shadeColor = hexToRgb(shade.hexCode);
        const difference = colorDifference(detectedColor, shadeColor);

        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestShade = shade;
        }
    });

    return closestShade;
};

const hexToRgb = (hex) => {
    // Convert HEX to RGB
    const bigint = parseInt(hex.slice(1), 16);
    return {
        red: (bigint >> 16) & 255,
        green: (bigint >> 8) & 255,
        blue: bigint & 255,
    };
};

module.exports = { findClosestShade };
