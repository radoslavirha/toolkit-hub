import { MongoOperationStatus } from '../enums/MongoOperationStatus.js';

/**
 * Outcome of an optimistic-concurrency update (`MongoRepository.updateByIdIfUnmodified`).
 *
 * Discriminate on `status`, a subset of {@link MongoOperationStatus}:
 * - `UPDATED`   — the precondition held and the document was updated; `value` is the new document.
 * - `CONFLICT`  — the document exists but was modified since the caller read it (map to 409/412).
 * - `NOT_FOUND` — no document with that id exists (map to 404).
 *
 * @typeParam T - Mongoose document type (extends BaseMongo)
 */
export type MongoConcurrentUpdateResult<T> =
    | { status: MongoOperationStatus.UPDATED; value: T }
    | { status: MongoOperationStatus.CONFLICT }
    | { status: MongoOperationStatus.NOT_FOUND };
