/**
 * Strictly-typed payload for updating an existing Mongoose document.
 *
 * Makes `_id`, `id`, `createdAt`, and `updatedAt` **strictly forbidden** using
 * `never` — even when the source object is a variable (not just an object literal).
 * TypeScript will reject the assignment even when an intermediary variable
 * carries one of the forbidden keys:
 *
 * ```typescript
 * const raw = { name: 'new-name', _id: 'some-id' };
 * const data: MongoUpdate<MyModel> = raw; // ❌ Type 'string' is not assignable to type 'never'
 * ```
 *
 * All fields are optional to support partial updates — only the fields you
 * include will be applied via `$set` in the repository.
 *
 * @typeParam T - Mongoose document type (extends BaseMongo)
 */
export type MongoUpdate<T> = Omit<Partial<T>, 'id' | '_id' | 'createdAt' | 'updatedAt'> & {
    readonly id?: never;
    readonly _id?: never;
    readonly createdAt?: never;
    readonly updatedAt?: never;
};
