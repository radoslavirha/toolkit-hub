/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require('typescript-eslint');
const AddonsConfig = require('@radoslavirha/config-eslint');

module.exports = config(...AddonsConfig);