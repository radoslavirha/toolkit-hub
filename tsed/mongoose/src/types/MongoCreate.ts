/**
 * Strictly-typed payload for creating a new Mongoose document.
 *
 * Makes `_id`, `id`, `createdAt`, and `updatedAt` **strictly forbidden** using
 * `never` — even when the source object is a variable (not just an object literal).
 * TypeScript will reject the assignment even when an intermediary variable
 * carries one of the forbidden keys:
 *
 * ```typescript
 * const raw = { name: 'test', _id: 'some-id' };
 * const data: MongoCreate<MyModel> = raw; // ❌ Type 'string' is not assignable to type 'never'
 * ```
 *
 * @typeParam T - Mongoose document type (extends BaseMongo)
 */
export type MongoCreate<T> = Omit<Partial<T>, 'id' | '_id' | 'createdAt' | 'updatedAt'> & {
    readonly id?: never;
    readonly _id?: never;
    readonly createdAt?: never;
    readonly updatedAt?: never;
};
