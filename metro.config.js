const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// SVG → React component via react-native-svg-transformer.
// Lets us `import Logo from './logo.svg'` and render <Logo width={…} />.
// Keeps SVGs as vectors — no PNG conversion step, crisp at any size.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Bundled asset extensions — keep PDF so the MahaRERA sample still resolves.
config.resolver.assetExts.push('pdf');

module.exports = config;
