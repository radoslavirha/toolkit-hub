import { Types, QueryFilter } from 'mongoose';
import { BaseMongo } from '../models/BaseMongo.js';

/**
 * Filter type for MongoRepository queries.
 *
 * Drop-in replacement for `QueryFilter<T>` that works correctly with
 * `BaseMongo._id: string`. Mongoose internally types `_id` as `ObjectId & string`
 * which causes type errors when using `QueryFilter<T>` directly for filter
 * arguments. This type widens `_id` to `Types.ObjectId | string` so all
 * Mongoose model method overloads are satisfied.
 *
 * @typeParam T - Mongoose document type (extends BaseMongo)
 *
 * @example
 * ```typescript
 * async findByLabel(label: string): Promise<Item[]> {
 *   const results = await this.model.find({ label } satisfies MongoFilter<Item>).lean<Item[]>();
 *   return this.deserializeArray(results);
 * }
 * ```
 */
export type MongoFilter<T extends BaseMongo> = Omit<QueryFilter<T>, '_id'> & {
    _id?: QueryFilter<{ _id: Types.ObjectId & string }>['_id'];
};
