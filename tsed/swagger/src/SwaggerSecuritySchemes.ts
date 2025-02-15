import { OS3Security } from '@tsed/openspec';
import { EnumDictionary } from '@radoslavirha/types';
import { SwaggerSecurityScheme } from './enums/SwaggerSecurityScheme.enum.js';

export const SWAGGER_SECURITY_SCHEMES: EnumDictionary<SwaggerSecurityScheme, OS3Security> = {
    [SwaggerSecurityScheme.BEARER_JWT]: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer JWT token'
    },
    [SwaggerSecurityScheme.BASIC]: {
        type: 'http',
        scheme: 'basic',
        description: 'Basic authentication'
    }
};