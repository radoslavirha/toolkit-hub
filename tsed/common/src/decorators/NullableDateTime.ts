import { useDecorators } from '@tsed/core';
import { DateTime, Nullable } from '@tsed/schema';

/**
 * A property that is an ISO 8601 date-time, or `null`.
 *
 * `@Nullable(Date)` alone carries no `format: date-time`, so an invalid string is accepted
 * and deserializes to an Invalid Date; this is `@Nullable(Date) @DateTime()`.
 *
 * @example
 * ```ts
 * \@NullableDateTime()
 * deletedAt!: Date | null;
 * ```
 */
export function NullableDateTime(): PropertyDecorator {
    return useDecorators(Nullable(Date), DateTime());
}
