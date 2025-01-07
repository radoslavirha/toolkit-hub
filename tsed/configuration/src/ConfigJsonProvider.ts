import { Type } from '@tsed/core';
import { deserialize } from '@tsed/json-mapper';
import { getJsonSchema } from '@tsed/schema';
import cfg from 'config';
import { Ajv } from 'ajv';
import { BaseConfigProvider } from './BaseConfigProvider.js';

export class ConfigJsonProvider<T> extends BaseConfigProvider<T> {
    constructor(configModel: Type<T>, debug = false) {
        super(ConfigJsonProvider.validateConfigFile(configModel, debug));
    }

    static validateConfigFile<T>(configModel: Type<T>, debug = false): T {
        try {
            const config = ConfigJsonProvider.validateModel(configModel, cfg, debug);
            return config;
        } catch (errors) {
            if (Array.isArray(errors)) {
                for (const error of errors) {
                    console.error(`Config file: ${ error.keyword } ${ error.message }`);
                }
            }
            throw new Error(`Invalid configuration! ${JSON.stringify(errors)}`);
        }
    }

    private static validateModel<T>(model: Type<T>, input: unknown, debug = false): T {
        const ajv = new Ajv({ allErrors: true });
    
        if (debug) {
            console.log('Config file', input);
        }

        const schema = getJsonSchema(model);
    
        const validate = ajv.compile(schema);
    
        const valid = validate(deserialize<T>(input, { type: model }));
    
        if (!valid) {
            throw validate.errors;
        }
    
        return deserialize<T>(input, { type: model });
    }
}
