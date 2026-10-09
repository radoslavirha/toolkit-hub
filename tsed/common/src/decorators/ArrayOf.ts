import { Type, useDecorators } from '@tsed/core';
import { CollectionOf, JsonEntityFn } from '@tsed/schema';

/** Options for {@link ArrayOf}. */
export interface ArrayOfOptions {
    /** Accept `null` for the whole array (`T[] | null`). OAS 3.0 output carries `nullable: true`. */
    nullable?: boolean;
}

/**
 * Declares an array property whose items are `type`, with the collection type set explicitly.
 *
 * Ts.ED derives the collection from `design:type`, which SWC emits as `Object` for any
 * `X | null`; `@CollectionOf(Child)` on `Child[] | null` then stops being a collection. This
 * decorator never relies on `design:type`, so real arrays are accepted, items deserialize to
 * `type` instances and `null` is accepted only when `nullable` is set.
 *
 * @param type - The item type (a model class or `String`, `Number`, `Boolean`, `Date`).
 * @param options - See {@link ArrayOfOptions}.
 *
 * @example
 * ```ts
 * \@ArrayOf(Child, { nullable: true })
 * children!: Child[] | null;
 * ```
 */
export function ArrayOf(type: Type<unknown>, options: ArrayOfOptions = {}): PropertyDecorator {
    return useDecorators(CollectionOf(type, Array), options.nullable
        ? JsonEntityFn(store => {
            store.schema.nullable(true);
        })
        : undefined) as PropertyDecorator;
}
