import { defineConfig } from 'eslint/config';

/**
 * Rules that steer code toward `@radoslavirha/utils` instead of hand-rolled equivalents.
 *
 * Opt-in, and separate from the base config on purpose: a project that does not depend on
 * `@radoslavirha/utils` would only get noise, since every suggestion names a method it
 * cannot import.
 *
 * ```js
 * import { defineConfig } from 'eslint/config';
 * import Config from '@radoslavirha/config-eslint';
 * import ToolkitReuse from '@radoslavirha/config-eslint/toolkit';
 *
 * export default defineConfig(...Config, ...ToolkitReuse);
 * ```
 *
 * Everything is `warn`: these are suggestions about reuse, not correctness, and a raw check
 * is occasionally the clearer choice. Do not enable this inside `@radoslavirha/utils` itself,
 * which implements the primitives being recommended.
 */
const reuseSuggestion = (selector, message) => ({ selector, message });

const COMPARISON = '/^(===|!==)$/';

export default defineConfig({
    files: ['**/*.js', '**/*.ts'],
    // Assertions are excluded on purpose: `expect(Array.isArray(x)).toBe(true)` is checking a
    // raw fact about a value, and routing it through a toolkit guard would partly test the
    // toolkit instead. Test *helpers* are production-shaped code and stay in scope.
    ignores: ['**/*.spec.ts', '**/*.spec.js'],
    rules: {
        'no-restricted-syntax': [
            'warn',
            reuseSuggestion(
                `BinaryExpression[operator=${COMPARISON}] > Literal[raw="null"]`,
                'Use CommonUtils.isNull / CommonUtils.notNull from @radoslavirha/utils — they are type predicates, so the narrowing survives into the branch.'
            ),
            reuseSuggestion(
                `BinaryExpression[operator=${COMPARISON}] > Identifier[name="undefined"]`,
                'Use CommonUtils.isUndefined / CommonUtils.notUndefined from @radoslavirha/utils, or isNil / notNil to cover null as well.'
            ),
            reuseSuggestion(
                `BinaryExpression[operator=${COMPARISON}][left.operator="typeof"][right.value="string"]`,
                'Use StringUtils.isString from @radoslavirha/utils — it narrows to Extract<T, string>.'
            ),
            reuseSuggestion(
                `BinaryExpression[operator=${COMPARISON}][left.operator="typeof"][right.value="boolean"]`,
                'Use BooleanUtils.isBoolean from @radoslavirha/utils — it narrows to Extract<T, boolean>.'
            ),
            reuseSuggestion(
                `BinaryExpression[operator=${COMPARISON}][left.operator="typeof"][right.value="number"]`,
                'Use NumberUtils.isNumber from @radoslavirha/utils, or isFiniteNumber when NaN and Infinity must be excluded.'
            ),
            reuseSuggestion(
                `BinaryExpression[operator=${COMPARISON}][left.operator="typeof"][right.value="function"]`,
                'Use CommonUtils.isFunction from @radoslavirha/utils — it narrows so the value can be called without a cast.'
            ),
            reuseSuggestion(
                'BinaryExpression[operator="instanceof"][right.name="Date"]',
                'Use ObjectUtils.isDate from @radoslavirha/utils — instanceof fails for a Date created in another realm.'
            ),
            reuseSuggestion(
                'CallExpression[callee.object.name="Array"][callee.property.name="isArray"]',
                'Use ArrayUtils.isArray from @radoslavirha/utils, or ArrayUtils.toArray to normalise a value that may or may not be an array.'
            ),
            reuseSuggestion(
                'CallExpression[callee.object.name="JSON"][callee.property.name="parse"] > CallExpression[callee.object.name="JSON"][callee.property.name="stringify"]',
                'Use ObjectUtils.cloneDeep from @radoslavirha/utils — round-tripping through JSON drops undefined, Date, Map and Set.'
            )
        ],
        'no-restricted-imports': [
            'warn',
            {
                paths: [
                    {
                        name: 'lodash',
                        message:
                            '@radoslavirha/utils wraps the lodash functions this toolkit uses and adds type predicates. Import from there instead.'
                    },
                    {
                        name: 'lodash-es',
                        message:
                            '@radoslavirha/utils wraps the lodash functions this toolkit uses and adds type predicates. Import from there instead.'
                    },
                    {
                        name: '@types/lodash',
                        message: 'Use the types from @radoslavirha/types (Dictionary, EnumDictionary) instead of lodash type imports.'
                    }
                ]
            }
        ]
    }
});
