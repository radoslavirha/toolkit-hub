import { useDecorators } from '@tsed/core';
import { Enum, Nullable } from '@tsed/schema';

/**
 * A property that is one of the values of an enum, or `null`.
 *
 * Ts.ED does not add `null` to `enum` for `@Nullable(String) @Enum(E)`, so `null` would be
 * rejected; this is `@Nullable(String | Number) @Enum(E, null)` with the value type derived
 * from the enum.
 *
 * @param enumType - A string or numeric TypeScript enum (or an object of its values).
 *
 * @example
 * ```ts
 * \@NullableEnum(Color)
 * color!: Color | null;
 * ```
 */
export function NullableEnum(enumType: object): PropertyDecorator {
    const numeric = Object.values(enumType).some(value => Number.isFinite(value));
    return useDecorators(Nullable(numeric ? Number : String), Enum(enumType, null));
}
