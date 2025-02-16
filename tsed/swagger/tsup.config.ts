import { config } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
    ...config,
    shims: true
});