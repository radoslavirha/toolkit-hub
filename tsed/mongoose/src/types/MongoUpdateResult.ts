/**
 * Typed result returned from MongoDB count-based update operations.
 *
 * Wraps Mongoose's raw `UpdateResult` (which exposes low-level mongodb driver fields)
 * into a clean, intention-revealing interface.
 */
export interface MongoUpdateResult {
    /** Number of documents that matched the filter. */
    matched: number;
    /** Number of documents that were actually modified. */
    modified: number;
    /** Whether a new document was inserted because none matched (upsert). */
    upserted: boolean;
    /** The `_id` of the upserted document as a string, or `null` if no upsert occurred. */
    upsertedId: string | null;
}
