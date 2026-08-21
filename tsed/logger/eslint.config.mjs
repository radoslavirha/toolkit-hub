import { defineConfig } from 'eslint/config';
import Config from '@radoslavirha/config-eslint';
import ToolkitReuse from '@radoslavirha/config-eslint/toolkit';

export default defineConfig(...Config, ...ToolkitReuse);
