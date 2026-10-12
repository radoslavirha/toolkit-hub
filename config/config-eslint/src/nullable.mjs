/**
 * Opt-in ESLint rules for the null-modelling traps of Ts.ED models.
 *
 * None of these is visible to the compiler, and each yields a wrong schema rather than an
 * error: SWC emits `Object` as the design type of `X | null`, so a bare `@Property()` is
 * documented as `{ type: "object" }`.
 *
 * ```js
 * import { defineConfig } from 'eslint/config';
 * import Config from '@radoslavirha/config-eslint';
 * import Nullable, { storageDtoRules } from '@radoslavirha/config-eslint/nullable';
 *
 * export default defineConfig(
 *     ...Config,
 *     ...Nullable,
 *     ...storageDtoRules(['src/mongo/**\/*.ts'])
 * );
 * ```
 *
 * They are custom rules rather than `no-restricted-syntax` entries, so enabling them cannot
 * replace the options of another `no-restricted-syntax` configuration (flat config does not
 * merge rule options).
 */
const DECORATOR = 'Decorator > CallExpression';

const selectorRule = (selector, message) => ({
    meta: { type: 'problem', schema: [] },
    create: (context) => ({
        [selector]: (node) => context.report({ node, message })
    })
});

const isNullable = (property) => property.typeAnnotation?.typeAnnotation.type === 'TSUnionType'
    && property.typeAnnotation.typeAnnotation.types.some(type => type.type === 'TSNullKeyword');

const decoratorCall = (decorator, name) => decorator.expression.type === 'CallExpression'
    && decorator.expression.callee.name === name
    ? decorator.expression
    : null;

/** Reports `@<name>(...)` calls matching `matches` on a property whose type annotation is `X | null`. */
const nullablePropertyRule = (name, matches, message) => ({
    meta: { type: 'problem', schema: [] },
    create: (context) => ({
        PropertyDefinition: (property) => {
            if (!isNullable(property)) {
                return;
            }
            for (const decorator of property.decorators) {
                const call = decoratorCall(decorator, name);
                if (call && matches(call)) {
                    context.report({ node: decorator, message });
                }
            }
        }
    })
});

const rules = {
    'property-needs-type': nullablePropertyRule(
        'Property',
        call => call.arguments.length === 0,
        'A bare @Property() on a `X | null` property is documented as `{ type: "object" }`. Use NullableOf, NullableEnum, NullableDateTime, or @Nullable(String | Number | Boolean) from @radoslavirha/tsed-common / @tsed/schema.'
    ),
    'collection-of-needs-type': nullablePropertyRule(
        'CollectionOf',
        call => call.arguments.length === 1,
        '@CollectionOf(X) on a nullable property does not declare a collection. Use ArrayOf / MapOf from @radoslavirha/tsed-common, or pass the collection type as the second argument.'
    ),
    'no-allow-null': selectorRule(
        `${DECORATOR}[callee.name="Allow"] > Literal[raw="null"]`,
        '@Allow(null) silently makes the property required and leaves `null` out of an enum. Use NullableOf, NullableEnum, NullableDateTime or ArrayOf({ nullable: true }) instead.'
    ),
    'no-nullable-array': selectorRule(
        `${DECORATOR}[callee.name="Nullable"][arguments.0.name="Array"]`,
        '@Nullable(Array) produces a broken schema. Use ArrayOf from @radoslavirha/tsed-common with `nullable: true`.'
    ),
    'no-nullable-scalar': selectorRule(
        `${DECORATOR}[callee.name="Nullable"][arguments.0.name=/^(String|Number|Boolean|BigInt|Date)$/]`,
        '@Nullable on a scalar makes Mongoose store the property as `Mixed`. Declare the storage property with its plain type (@Property(String), @Property(Date), ...) and keep nullability in the domain model.'
    )
};

export const plugin = { meta: { name: 'toolkit-nullable' }, rules };

/** Rules that hold for every Ts.ED model. */
const modelRules = {
    'toolkit-nullable/property-needs-type': 'error',
    'toolkit-nullable/collection-of-needs-type': 'error',
    'toolkit-nullable/no-allow-null': 'error',
    'toolkit-nullable/no-nullable-array': 'error'
};

export default [{
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts'],
    plugins: { 'toolkit-nullable': plugin },
    rules: modelRules
}];

/**
 * Forbids `@Nullable` on scalars in storage DTOs (Mongoose models) — pass the glob(s) of the
 * folders holding them.
 *
 * @param {string[]} files
 */
export const storageDtoRules = (files) => [{
    files,
    plugins: { 'toolkit-nullable': plugin },
    rules: { 'toolkit-nullable/no-nullable-scalar': 'error' }
}];
