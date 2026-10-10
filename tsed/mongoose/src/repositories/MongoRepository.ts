import type { MongooseModel } from '@tsed/mongoose';
import { Type } from '@tsed/core';
import { CommonUtils } from '@radoslavirha/utils';
import { Serializer } from '@radoslavirha/tsed-common';
import { HydratedDocument, isValidObjectId } from 'mongoose';
import { BaseMongo } from '../models/BaseMongo.js';
import { MongoConcurrentUpdateResult } from '../types/MongoConcurrentUpdateResult.js';
import { MongoUpdate } from '../types/MongoUpdate.js';

/**
 * Abstract base repository for MongoDB operations in Ts.ED applications.
 *
 * Provides the foundation for a pure database-access layer: the Mongoose model
 * injection point, the document type for deserialization, and protected helpers
 * for converting lean/plain results back to typed class instances.
 *
 * All queries use `.lean()` for performance. Results are deserialized via
 * `Serializer.deserialize()` using the declared `type`.
 *
 * **Subclasses own all DB methods.** Nothing is enforced here — implement only
 * the queries your domain needs.  The helper methods and the ready-to-use types
 * (`MongoCreate`, `MongoUpdate`, `MongoDeleteResult`, `MongoUpdateResult`) are
 * provided by the package and available to every subclass.
 *
 * By-id queries should guard the caller-supplied id with `isValidId()` first:
 * a malformed id can never match a document, so it resolves `null` instead of
 * letting Mongoose throw a `CastError`.
 *
 * Mapper / business logic does NOT belong in this layer — it lives in
 * `MongoMapper`.
 *
 * @template MONGO - Mongoose document type extending BaseMongo
 *
 * @abstract
 *
 * @example
 * ```typescript
 * import { Injectable, Inject } from '@tsed/di';
 * import type { MongooseModel } from '@tsed/mongoose';
 * import {
 *   MongoRepository,
 *   MongoCreate, MongoUpdate, MongoFilter,
 *   MongoDeleteResult, MongoUpdateResult
 * } from '@radoslavirha/tsed-mongoose';
 * import { Item } from './models/Item.mongo';
 *
 * @Injectable()
 * export class ItemRepository extends MongoRepository<Item> {
 *   @Inject(Item)
 *   protected model!: MongooseModel<Item>;
 *
 *   protected mongo = Item;
 *
 *   async findById(id: string): Promise<Item | null> {
 *     if (!this.isValidId(id)) return null;
 *     const result = await this.model.findById(id).lean<Item>() as Item | null;
 *     return this.deserialize(result);
 *   }
 *
 *   async find(filter?: MongoFilter<Item>): Promise<Item[]> {
 *     const results = await this.model.find(filter ?? {}).lean<Item[]>() as Item[];
 *     return this.deserializeArray(results);
 *   }
 *
 *   async create(data: MongoCreate<Item>): Promise<Item> {
 *     // eslint-disable-next-line @typescript-eslint/no-explicit-any
 *     const doc = await this.model.create(data as any);
 *     return this.deserialize(this.convertHydratedDocumentToObject(doc))!;
 *   }
 *
 *   async findByIdAndUpdate(id: string, data: MongoUpdate<Item>): Promise<Item | null> {
 *     if (!this.isValidId(id)) return null;
 *     const result = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean<Item>() as Item | null;
 *     return this.deserialize(result);
 *   }
 *
 *   async deleteOne(filter: MongoFilter<Item>): Promise<MongoDeleteResult> {
 *     const result = await this.model.deleteOne(filter);
 *     return { deleted: result.deletedCount > 0, deletedCount: result.deletedCount };
 *   }
 *
 *   async updateMany(filter: MongoFilter<Item>, data: MongoUpdate<Item>): Promise<MongoUpdateResult> {
 *     const result = await this.model.updateMany(filter, { $set: data });
 *     return {
 *       matched: result.matchedCount,
 *       modified: result.modifiedCount,
 *       upserted: result.upsertedCount > 0,
 *       upsertedId: result.upsertedId ? String(result.upsertedId) : null
 *     };
 *   }
 * }
 * ```
 */
export abstract class MongoRepository<MONGO extends BaseMongo> {
    /**
     * The Mongoose model for database operations.
     * Must be injected by subclasses using `@Inject(YourMongoModel)`.
     */
    protected abstract model: MongooseModel<MONGO>;

    /**
     * The class constructor of the Mongoose document type.
     * Used by `deserialize()` to reconstruct typed instances from lean results.
     *
     * @example `protected mongo = User;`
     */
    protected abstract mongo: Type<MONGO>;

    /**
     * Returns `true` when `id` can be cast to an ObjectId.
     *
     * Call it before every by-id query (`findById`, `findByIdAndUpdate`,
     * `findByIdAndDelete`, …) and resolve `null` / no-op when it returns `false`.
     * Mongoose otherwise throws a `CastError` for a malformed id, which escapes
     * services that only map `null` to `NotFound`.
     */
    protected isValidId(id: string): boolean {
        return isValidObjectId(id);
    }

    /**
     * Opt-in optimistic-concurrency update: applies `data` with `$set` only if the
     * document's `updatedAt` still equals `expectedUpdatedAt` (the value the caller read).
     *
     * Resolves a distinguishable {@link MongoConcurrentUpdateResult} instead of throwing:
     * `updated`, `conflict` (document changed since it was read) or `not-found`
     * (including a malformed id). The service maps `conflict` to 409/412.
     *
     * Requires `timestamps: true` on the schema. `updatedAt` has millisecond
     * precision, so two writes within the same millisecond are indistinguishable.
     * Existing update methods are unaffected.
     */
    protected async updateByIdIfUnmodified(
        id: string,
        expectedUpdatedAt: Date,
        data: MongoUpdate<MONGO>
    ): Promise<MongoConcurrentUpdateResult<MONGO>> {
        if (!this.isValidId(id)) {
            return { status: 'not-found' };
        }

        const updated = await this.model
            .findOneAndUpdate({ _id: id, updatedAt: expectedUpdatedAt } as never, { $set: data } as never, { new: true })
            .lean<MONGO>() as MONGO | null;

        if (CommonUtils.notNull(updated)) {
            return { status: 'updated', value: this.deserialize(updated) };
        }

        const exists = await this.model.exists({ _id: id } as never);

        return CommonUtils.notNull(exists) ? { status: 'conflict' } : { status: 'not-found' };
    }

    /**
     * Converts a Mongoose `HydratedDocument` to a plain object via `.toObject()`.
     * Use this after `model.create()` which does not support `.lean()`.
     */
    protected convertHydratedDocumentToObject(document: HydratedDocument<MONGO>): MONGO {
        return document.toObject<MONGO>({ virtuals: true, flattenMaps: true });
    }

    /**
     * Deserializes a lean/plain result into a typed `MONGO` instance using Ts.ED.
     *
     * The overload ensures callers receive `MONGO` (not `MONGO | null`) when
     * they provably pass a non-null value.
     */
    protected deserialize(data: MONGO): MONGO;
    protected deserialize(data: MONGO | null): MONGO | null;
    protected deserialize(data: MONGO | null): MONGO | null {
        if (CommonUtils.isNull(data)) {
            return null;
        }

        return Serializer.deserialize<MONGO>(data, this.mongo, {
            useAlias: false,
            additionalProperties: true,
            disabledUnsecureConstructor: false,
            groups: false
        });
    }

    /**
     * Deserializes an array of lean/plain results into typed `MONGO` instances.
     */
    protected deserializeArray(data: MONGO[]): MONGO[] {
        return data.map(item => this.deserialize(item));
    }
}
