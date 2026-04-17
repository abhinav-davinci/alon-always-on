const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add PDF to bundled asset extensions
config.resolver.assetExts.push('pdf');

module.exports = config;
