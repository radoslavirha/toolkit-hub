import { config } from 'dotenv';
import { BaseConfigProvider } from './BaseConfigProvider.js';

export interface ENVS<TValue = string | undefined> {
    [key: string]: TValue;
}

export class EnvironmentVariablesProvider extends BaseConfigProvider<ENVS> {
    constructor() {
        super({
            ...process.env,
            ...config().parsed
        });
    }
}
