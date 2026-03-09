import { MongooseModel } from '@tsed/mongoose';
import { Type } from '@tsed/core';
import { CommonUtils } from '@radoslavirha/utils';
import { Serializer } from '@radoslavirha/tsed-common';
import { HydratedDocument } from 'mongoose';
import { BaseMongo } from '../models/BaseMongo.js';

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
 * Mapper / business logic does NOT belong in this layer — it lives in
 * `MongoMapper` and `MongoService`.
 *
 * @template MONGO - Mongoose document type extending BaseMongo
 *
 * @abstract
 *
 * @example
 * ```typescript
 * import { Injectable, Inject } from '@tsed/di';
 * import { MongooseModel } from '@tsed/mongoose';
 * import { Type } from '@tsed/core';
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
 *   protected type: Type<Item> = Item;
 *
 *   async findById(id: string): Promise<Item | null> {
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
     * @example `protected type = User;`
     */
    protected abstract type: Type<MONGO>;

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

        return Serializer.deserialize<MONGO>(data, this.type);
    }

    /**
     * Deserializes an array of lean/plain results into typed `MONGO` instances.
     */
    protected deserializeArray(data: MONGO[]): MONGO[] {
        return data.map(item => this.deserialize(item));
    }
}
