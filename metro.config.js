// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

// Get the default config
const config = getDefaultConfig(__dirname);

// Add additional module resolution
config.resolver.extraNodeModules = {
  'url': require.resolve('url/'),
};

// Configure additional assets and extensions if necessary
config.resolver.assetExts = config.resolver.assetExts || [];
config.resolver.sourceExts = config.resolver.sourceExts || ['js', 'jsx', 'ts', 'tsx', 'json'];

module.exports = config;
