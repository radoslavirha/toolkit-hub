import { useDecorators } from '@tsed/core';
import { Description, Pattern } from '@tsed/schema';

/**
 * Format of a resource id: 24 hexadecimal characters.
 */
export const RESOURCE_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/**
 * Returns `true` when `id` is a well-formed resource id.
 */
export function isValidResourceId(id: unknown): id is string {
    return typeof id === 'string' && RESOURCE_ID_PATTERN.test(id);
}

/**
 * Validates the format of a resource id (path param, query param, body property).
 *
 * A malformed id is rejected by Ts.ED's schema validation with a 400 before it reaches
 * the service layer. The generated schema carries only a neutral `pattern` and `description`.
 *
 * @example
 * ```ts
 * @Get('/:id')
 * get(@PathParams('id') @ResourceId() id: string) {}
 * ```
 */
export function ResourceId(): ParameterDecorator & PropertyDecorator {
    return useDecorators(Pattern(RESOURCE_ID_PATTERN.source), Description('Resource identifier'));
}
