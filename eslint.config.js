// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // functions/ e um projeto Node.js (Cloud Functions) separado, com seu
    // proprio package.json e deploy - nao faz parte do app Expo/RN.
    ignores: ['dist/*', 'functions/*'],
  },
]);
