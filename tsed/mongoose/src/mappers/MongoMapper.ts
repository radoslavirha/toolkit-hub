import { BaseModel } from '@radoslavirha/tsed-common';
import { Type } from '@tsed/core';
import { CommonUtils, MappingUtils } from '@radoslavirha/utils';
import { MongooseDocumentMethods, Ref } from '@tsed/mongoose';
import { SpecTypes, getJsonSchema } from '@tsed/schema';
import { BaseMongo } from '../models/BaseMongo.js';
import { MongoCreate } from '../types/MongoCreate.js';
import { MongoUpdate } from '../types/MongoUpdate.js';


/**
 * Abstract base mapper for converting between Mongoose documents and application models.
 * 
 * Provides a standardized interface and utility methods for bidirectional mapping between:
 * - Mongoose documents (database layer) that extend BaseMongo
 * - Application models (business logic layer) that extend BaseModel
 * 
 * This pattern ensures consistent data transformation across all entities and handles
 * common Mongoose-specific concerns like populated references and default values.
 * 
 * @template MONGO The Mongoose document type extending BaseMongo
 * @template MODEL The application model type extending BaseModel
 * 
 * @abstract
 * 
 * @example
 * ```typescript
 * import { MongoMapper } from './mappers/MongoMapper';
 * import { Item } from './models/Item.mongo';
 * import { ItemModel } from './models/Item.model';
 * 
 * export class ItemMapper extends MongoMapper<Item, ItemModel> {
 *   async mongoToModel(mongo: Item): Promise<ItemModel> {
 *     return CommonUtils.buildModelStrict(ItemModel, {
 *       ...this.mongoToModelBase(mongo),
 *       name: mongo.name,
 *     });
 *   }
 * }
 * ```
 * 
 * @remarks
 * - Subclasses must implement the three abstract methods for complete mapping functionality
 * - Base methods handle common fields like id, createdAt, and updatedAt
 * - Helper methods simplify handling of Mongoose references and populated documents
 * - Supports extracting default values from JSON Schema decorators
 */
export abstract class MongoMapper<MONGO extends BaseMongo, MODEL extends BaseModel> extends MappingUtils {
    /**
     * The Mongoose document class constructor.
     * Used by `buildMongoPayload` and `buildMongoUpdatePayload` to construct typed payloads.
     *
     * @example `protected mongo = UserMongo;`
     */
    protected abstract mongo: Type<MONGO>;

    /**
     * The application model class constructor.
     * Declares the model type associated with this mapper.
     *
     * @example `protected model = UserModel;`
     */
    protected abstract model: Type<MODEL>;

    /**
     * Extracts and returns only the base fields from a Mongoose document.
     *
     * Returns a `BaseModel` instance typed as `Pick<MODEL, 'id' | 'createdAt' | 'updatedAt'>`,
     * containing only the three standard BaseMongo fields mapped to their model equivalents:
     * - `_id` → `id`
     * - `createdAt` → `createdAt`
     * - `updatedAt` → `updatedAt`
     *
     * **Why this return type?**  Returning only the base fields — not the full `MODEL` —
     * is intentional. When you spread the result into `CommonUtils.buildModelStrict`, TypeScript
     * sees that only `id`, `createdAt`, and `updatedAt` are satisfied and requires you to
     * explicitly provide every remaining domain field. This gives compile-time exhaustiveness
     * checking: if you add a field to your model and forget to map it, TypeScript errors.
     *
     * @param mongo The Mongoose document containing source data
     * @returns Plain object with only the three base fields populated
     *
     * @example
     * ```typescript
     * async mongoToModel(mongo: Item): Promise<ItemModel> {
     *   return CommonUtils.buildModelStrict(ItemModel, {
     *     ...this.mongoToModelBase(mongo), // provides id, createdAt, updatedAt
     *     name: mongo.name,               // domain fields must be explicit
     *     status: mongo.status,           // TypeScript errors if any are missing
     *   });
     * }
     * ```
     */
    public mongoToModelBase(mongo: MONGO): Pick<MODEL, 'id' | 'createdAt' | 'updatedAt'> {
        return CommonUtils.buildModelStrict(this.model, {
            id: mongo._id,
            createdAt: mongo.createdAt,
            updatedAt: mongo.updatedAt
        });
    }

    /**
     * Mongoose references can exist in two states:
     * - Unpopulated: Just the ObjectID string
     * - Populated: Full document object with all fields
     * 
     * This method safely extracts the ID string from either state.
     * 
     * @template T The type of the referenced document extending BaseMongo
     * @param value The Mongoose reference (populated or unpopulated)
     * @returns The string representation of the document ID
     * @protected
     * 
     * @example
     * ```typescript
     * // Handle potentially populated author reference
     * async mongoToModel(mongo: Post): Promise<PostModel> {
     *   const model = new PostModel();
     *   model.authorId = this.getIdFromPotentiallyPopulated(mongo.author);
     *   return model;
     * }
     * ```
     */
    protected getIdFromPotentiallyPopulated<T extends BaseMongo>(value: Ref<T>): string {
        return this.canBePopulated(value)
            ? (value as unknown as MongooseDocumentMethods<T>).toClass()._id
            : String(value);
    }

    /**
     * Retrieves the populated document from a Mongoose reference.
     * 
     * Assumes the reference has been populated. Use canBePopulated() first
     * to check if the reference is populated before calling this method.
     * 
     * @template T The type of the referenced document
     * @param value The populated Mongoose reference
     * @returns The populated document as a plain object
     * @protected
     * 
     * @example
     * ```typescript
     * if (this.canBePopulated(mongo.author)) {
     *   const author = this.getPopulated(mongo.author);
     *   model.authorName = author.name;
     * }
     * ```
     */
    protected getPopulated<T>(value: Ref<T>): T {
        return (value as MongooseDocumentMethods<T>).toClass();
    }

    /**
     * Checks whether a Mongoose reference has been populated.
     * 
     * Attempts to call toClass() on the reference. If successful, the reference
     * is populated; if it throws an error, it's just an ID.
     * 
     * @template T The type of the referenced document
     * @param value The Mongoose reference to check
     * @returns true if the reference is populated, false otherwise
     * @protected
     * 
     * @example
     * ```typescript
     * if (this.canBePopulated(mongo.author)) {
     *   // Use populated data
     *   model.authorName = this.getPopulated(mongo.author).name;
     * } else {
     *   // Just get the ID
     *   model.authorId = String(mongo.author);
     * }
     * ```
     */
    protected canBePopulated<T>(value: Ref<T>): boolean {
        try {
            (value as MongooseDocumentMethods<T>).toClass();
            return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return false;
        }
    }

    /**
     * Builds a typed Mongoose create payload using `buildModelPartial`, with TypeScript
     * enforcing that `data` cannot include base fields (`id`, `_id`, `createdAt`, `updatedAt`).
     *
     * The `as` cast is encapsulated here once so concrete mapper implementations
     * remain cast-free. Call sites are protected at compile time by
     * `D extends MongoCreate<MONGO>`.
     *
     * @param type The Mongoose document class constructor
     * @param data The create payload — base fields are forbidden by the type constraint
     * @returns A typed `MongoCreate<MONGO>` payload
     *
     * @example
     * ```typescript
     * buildMongoCreate(model: ItemModel): MongoCreate<Item> {
     *   return this.buildMongoPayload(Item, {
     *     name: this.getModelValue(model, 'name'),
     *   });
     * }
     * ```
     */
    protected buildMongoPayload<D extends MongoCreate<MONGO>>(data: D): MongoCreate<MONGO> {
        return CommonUtils.buildModelPartial(this.mongo, data as unknown as Partial<MONGO>) as MongoCreate<MONGO>;
    }

    /**
     * Builds a typed Mongoose update payload using `buildModelPartial`, with TypeScript
     * enforcing that `data` cannot include base fields (`id`, `_id`, `createdAt`, `updatedAt`).
     *
     * The `as` cast is encapsulated here once so concrete mapper implementations
     * remain cast-free. Call sites are protected at compile time by
     * `D extends MongoUpdate<MONGO>`.
     *
     * @param type The Mongoose document class constructor
     * @param data The update payload — base fields are forbidden by the type constraint
     * @returns A typed `MongoUpdate<MONGO>` payload
     *
     * @example
     * ```typescript
     * buildMongoUpdate(model: ItemModel): MongoUpdate<Item> {
     *   return this.buildMongoUpdatePayload(Item, {
     *     name: this.getModelValue(model, 'name', true),
     *   });
     * }
     * ```
     */
    protected buildMongoUpdatePayload<D extends MongoUpdate<MONGO>>(data: D): MongoUpdate<MONGO> {
        return CommonUtils.buildModelPartial(this.mongo, data as unknown as Partial<MONGO>) as MongoUpdate<MONGO>;
    }

    /**
     * Gets a model property value with fallback to default value from schema.
     * 
     * Retrieves the value of a property from the model. If the value is undefined,
     * attempts to retrieve the default value from the model's JSON Schema definition.
     * 
     * Useful when converting models to Mongoose objects where you want to ensure
     * default values are applied.
     * 
     * @template PROPERTY The property key of the model
     * @param model The application model
     * @param property The property name to retrieve
     * @param patch If true, returns undefined for missing values instead of defaults (for partial updates)
     * @returns The property value, its default value, or undefined
     * @protected
     * 
     * @example
     * ```typescript
     * async modelToMongoCreateObject(model: ItemModel): Promise<MongoCreate<Item>> {
     *   return {
     *     name: this.getModelValue(model, 'name'),
     *     status: this.getModelValue(model, 'status'), // Uses default if undefined
     *   };
     * }
     * 
     * // For updates, use patch mode to avoid overwriting with defaults
     * async modelToMongoUpdateObject(model: ItemModel): Promise<MongoUpdate<Item>> {
     *   return {
     *     name: this.getModelValue(model, 'name', true), // Won't use default
     *   };
     * }
     * ```
     */
    public getModelValue<PROPERTY extends keyof MODEL>(
        model: MODEL,
        property: PROPERTY,
        patch: boolean = false
    ): MODEL[PROPERTY] | undefined {
        if (!CommonUtils.isUndefined(model[property])) {
            return model[property];
        } else if (!patch) {
            return this.getModelDefault(model, property);
        }
        return undefined;
    }

    /**
     * Retrieves the default value for a model property from its JSON Schema.
     * 
     * Extracts the default value defined in the model's @tsed/schema decorators.
     * Used internally by getModelValue().
     * 
     * @template PROPERTY The property key of the model
     * @param model The application model
     * @param property The property name to get the default for
     * @returns The default value from schema, or undefined if no default is defined
     * @private
     */
    private getModelDefault<PROPERTY extends keyof MODEL>(model: MODEL, property: PROPERTY): MODEL[PROPERTY] | undefined {
        const spec = getJsonSchema(model as unknown as Type<MODEL>, { specType: SpecTypes.JSON });

        return spec?.properties[property]?.default ?? undefined;
    }
}
