/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require('typescript-eslint');
const Config = require('./src/index');

module.exports = config(...Config);