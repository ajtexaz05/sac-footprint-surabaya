const util = require('node:util');
if (!util.styleText) {
  // Polyfill util.styleText for Node < 20.12 compatibility with ESLint 10 stylish formatter
  util.styleText = (format, text) => text;
}
