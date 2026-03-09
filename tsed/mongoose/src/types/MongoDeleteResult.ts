/**
 * Typed result returned from MongoDB delete operations.
 *
 * Wraps Mongoose's raw `DeleteResult` (which exposes untyped `{ acknowledged, deletedCount }`)
 * into a clean, intention-revealing interface.
 */
export interface MongoDeleteResult {
    /** Whether at least one document was deleted. */
    deleted: boolean;
    /** Total number of documents removed by the operation. */
    deletedCount: number;
}
