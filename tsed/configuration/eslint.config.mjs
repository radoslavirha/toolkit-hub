import { defineConfig } from 'eslint/config';
import Config from '@radoslavirha/config-eslint';
import PreferUtils from '@radoslavirha/utils/eslint';

export default defineConfig(...Config, ...PreferUtils);
