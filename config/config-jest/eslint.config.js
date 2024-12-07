/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require('typescript-eslint');
const AddonsConfig = require('@irha-tookit/config-eslint');

module.exports = config(...AddonsConfig);