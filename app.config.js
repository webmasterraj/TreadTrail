module.exports = {
  name: 'TreadTrail',
  slug: 'TreadTrail',
  owner: "nsheth17",
  version: '1.0.0',
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './src/assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.treadtrail.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.treadtrail.app'
  },
  web: {
    favicon: './src/assets/images/favicon.png'
  },
  extra: {
    eas: {
      projectId: '9077313c-8bee-4a2e-81a3-2e3251345818'
    }
  },
  updates: {
    url: "https://u.expo.dev/9077313c-8bee-4a2e-81a3-2e3251345818"
  },
  runtimeVersion: "1.0.0",  // ✅ Set static runtime version
  plugins: []
};
