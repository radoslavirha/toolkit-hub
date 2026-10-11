/**
 * Shared outcome status for repository operations that report one instead of throwing.
 *
 * A single enum for all Mongoose operations; each result type uses only the subset that
 * applies to it (see {@link MongoConcurrentUpdateResult}).
 */
export enum MongoOperationStatus {
    /** The operation applied and produced a document. */
    UPDATED = 'updated',
    /** The document exists but was modified since the caller read it (map to 409/412). */
    CONFLICT = 'conflict',
    /** No document with that id exists (map to 404). */
    NOT_FOUND = 'not-found'
}
