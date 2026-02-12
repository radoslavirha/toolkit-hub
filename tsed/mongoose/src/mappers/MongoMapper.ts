import { BaseModel } from '@radoslavirha/tsed-common';
import { Type } from '@tsed/core';
import { CommonUtils } from '@radoslavirha/utils';
import { MongooseDocumentMethods, Ref } from '@tsed/mongoose';
import { SpecTypes, getJsonSchema } from '@tsed/schema';
import { BaseMongo } from '../models/BaseMongo.js';
import { MongoosePlainObjectCreate } from '../types/MongoosePlainObjectCreate.js';
import { MongoosePlainObjectUpdate } from '../types/MongoosePlainObjectUpdate.js';

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
 * import { User } from './models/User.mongo';
 * import { UserModel } from './models/User.model';
 * 
 * export class UserMapper extends MongoMapper<User, UserModel> {
 *   async mongoToModel(mongo: User): Promise<UserModel> {
 *     const model = new UserModel();
 *     this.mongoToModelBase(model, mongo);
 *     
 *     model.name = mongo.name;
 *     model.email = mongo.email;
 *     
 *     return model;
 *   }
 *   
 *   async modelToMongoCreateObject(model: UserModel): Promise<MongoosePlainObjectCreate<User>> {
 *     return {
 *       name: model.name,
 *       email: model.email
 *     };
 *   }
 *   
 *   async modelToMongoUpdateObject(model: UserModel): Promise<MongoosePlainObjectUpdate<User>> {
 *     return {
 *       name: model.name,
 *       email: model.email
 *     };
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
export abstract class MongoMapper<MONGO extends BaseMongo, MODEL extends BaseModel> {
    /**
     * Converts a Mongoose document to an application model.
     * 
     * @param mongo The Mongoose document to convert
     * @returns Promise resolving to the converted application model
     * @abstract
     */
    public abstract mongoToModel(mongo: MONGO): Promise<MODEL>;
    
    /**
     * Converts an application model to a plain object for Mongoose document creation.
     * 
     * Used when creating new documents in the database. Should only include fields
     * that are allowed to be set during creation (excludes _id, createdAt, updatedAt).
     * 
     * @param model The application model to convert
     * @returns Promise resolving to a plain object suitable for Mongoose create operations
     * @abstract
     */
    public abstract modelToMongoCreateObject(model: MODEL): Promise<MongoosePlainObjectCreate<MONGO>>;
    
    /**
     * Converts an application model to a plain object for Mongoose document updates.
     * 
     * Used when updating existing documents. Should only include fields that are
     * allowed to be modified (excludes _id, createdAt).
     * 
     * @param model The application model to convert
     * @returns Promise resolving to a plain object suitable for Mongoose update operations
     * @abstract
     */
    public abstract modelToMongoUpdateObject(model: MODEL): Promise<MongoosePlainObjectUpdate<MONGO>>;

    /**
     * Maps base fields from Mongoose document to application model.
     * 
     * Handles the conversion of standard BaseMongo fields:
     * - _id → id (converted to string)
     * - createdAt → createdAt
     * - updatedAt → updatedAt
     * 
     * Should be called by subclass implementations of mongoToModel().
     * 
     * @param model Partial model object to populate (usually a new instance)
     * @param mongo The Mongoose document containing source data
     * @returns The model with base fields populated
     * @protected
     * 
     * @example
     * ```typescript
     * async mongoToModel(mongo: User): Promise<UserModel> {
     *   const model = new UserModel();
     *   this.mongoToModelBase(model, mongo);
     *   // ... map custom fields
     *   return model;
     * }
     * ```
     */
    protected mongoToModelBase(model: Partial<MODEL>, mongo: MONGO): MODEL {
        model.id = String(mongo._id);
        model.createdAt = mongo.createdAt;
        model.updatedAt = mongo.createdAt;

        return model as MODEL;
    }

    /**
     * Extracts the ID from a Mongoose reference that may or may not be populated.
     * 
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
            ? String((value as unknown as MongooseDocumentMethods<T>).toClass()._id)
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
     * async modelToMongoCreateObject(model: UserModel): Promise<MongoosePlainObjectCreate<User>> {
     *   return {
     *     name: this.getModelValue(model, 'name'),
     *     status: this.getModelValue(model, 'status'), // Uses default if undefined
     *     email: model.email
     *   };
     * }
     * 
     * // For updates, use patch mode to avoid overwriting with defaults
     * async modelToMongoUpdateObject(model: UserModel): Promise<MongoosePlainObjectUpdate<User>> {
     *   return {
     *     name: this.getModelValue(model, 'name', true), // Won't use default
     *   };
     * }
     * ```
     */
    protected getModelValue<PROPERTY extends keyof MODEL>(
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
