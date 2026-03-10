import { defineConfig } from 'tsdown';
import { cjsConfig, esmConfig } from './src/index.js';

export default defineConfig([cjsConfig, esmConfig]);
