import { useDecorators } from '@tsed/core';
import { Description, Pattern } from '@tsed/schema';

/**
 * Ready-made id patterns for {@link ResourceId}. Values are flag-free regular expression sources.
 */
export enum ResourceIdPattern {
    /** 24 hexadecimal characters (e.g. MongoDB ObjectId). */
    HEX_24 = '^[a-fA-F0-9]{24}$',
    /** Canonical UUID, any version. */
    UUID = '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$',
    /** Positive integer (e.g. auto-increment key). */
    NUMERIC = '^[0-9]+$'
}

/**
 * Validates the format of a resource id (path param, query param, body property) against a
 * pattern supplied by the caller, so it works for any storage (or none).
 *
 * A malformed id is rejected by Ts.ED's schema validation with a 400 before it reaches
 * the service layer. The generated schema carries only the `pattern` and a `description`.
 *
 * The pattern is passed to the schema as a string without flags (a RegExp with flags would be
 * emitted as `/.../i`, which AJV reads literally), so put case handling inside the pattern.
 *
 * @param pattern - A {@link ResourceIdPattern}, or a custom regular expression (or its source string)
 * a valid id must match.
 *
 * @example
 * ```ts
 * @Get('/:id')
 * get(@PathParams('id') @ResourceId(ResourceIdPattern.UUID) id: string) {}
 * ```
 */
export function ResourceId(pattern: ResourceIdPattern | RegExp | string): ParameterDecorator & PropertyDecorator {
    if (pattern instanceof RegExp && pattern.flags) {
        throw new Error(`ResourceId pattern must not use flags (got /${pattern.source}/${pattern.flags}); encode them in the pattern.`);
    }
    const source = pattern instanceof RegExp ? pattern.source : pattern;
    return useDecorators(Pattern(source), Description('Resource identifier'));
}
