/**
 * Outcome of an optimistic-concurrency update (`MongoRepository.updateByIdIfUnmodified`).
 *
 * Discriminate on `status`:
 * - `updated`   — the precondition held and the document was updated; `value` is the new document.
 * - `conflict`  — the document exists but was modified since the caller read it (map to 409/412).
 * - `not-found` — no document with that id exists (map to 404).
 *
 * @typeParam T - Mongoose document type (extends BaseMongo)
 */
export type MongoConcurrentUpdateResult<T> =
    | { status: 'updated'; value: T }
    | { status: 'conflict' }
    | { status: 'not-found' };
