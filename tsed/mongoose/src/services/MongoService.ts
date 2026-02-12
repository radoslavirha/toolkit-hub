import { BaseModel } from '@radoslavirha/tsed-common';
import { MongooseModel } from '@tsed/mongoose';
import { MongoMapper } from '../mappers/MongoMapper.js';
import { BaseMongo } from '../models/BaseMongo.js';

/**
 * Abstract base service for MongoDB operations in Ts.ED applications.
 * 
 * Provides a standardized foundation for CRUD services that work with Mongoose documents.
 * Handles common operations like mapping between database documents and application models,
 * preparing objects for create/update operations, and processing single or multiple documents.
 * 
 * All MongoDB service classes should extend this base to ensure consistent patterns
 * and reduce boilerplate code.
 * 
 * @template MONGO The Mongoose document type extending BaseMongo
 * @template MODEL The application model type extending BaseModel
 * 
 * @abstract
 * 
 * @example
 * ```typescript
 * import { Injectable } from '@tsed/di';
 * import { MongooseModel } from '@tsed/mongoose';
 * import { MongoService } from './services/MongoService';
 * import { User } from './models/User.mongo';
 * import { UserModel } from './models/User.model';
 * import { UserMapper } from './mappers/UserMapper';
 * 
 * @Injectable()
 * export class UserService extends MongoService<User, UserModel> {
 *   @Inject(User)
 *   protected model: MongooseModel<User>;
 * 
 *   @Inject()
 *   protected mapper: UserMapper;
 * 
 *   async findById(id: string): Promise<UserModel | null> {
 *     const mongo = await this.model.findById(id);
 *     return this.mapSingle(mongo);
 *   }
 * 
 *   async create(model: UserModel): Promise<UserModel> {
 *     const createObj = await this.getCreateObject(model);
 *     const mongo = await this.model.create(createObj);
 *     return this.mapSingle(mongo);
 *   }
 * 
 *   async update(id: string, model: UserModel): Promise<UserModel | null> {
 *     const updateObj = await this.getUpdateObject(model);
 *     const mongo = await this.model.findByIdAndUpdate(id, updateObj, { new: true });
 *     return this.mapSingle(mongo);
 *   }
 * 
 *   async findAll(): Promise<UserModel[]> {
 *     const mongos = await this.model.find();
 *     return this.mapMany(mongos);
 *   }
 * }
 * ```
 * 
 * @remarks
 * - Subclasses must provide implementations for the abstract `model` and `mapper` properties
 * - All mapping operations are asynchronous to support complex transformations
 * - Helper methods simplify common patterns like null-safe mapping and batch processing
 * - Use @Inject decorator to inject the Mongoose model and mapper instances
 */
export abstract class MongoService<MONGO extends BaseMongo, MODEL extends BaseModel> {
    /**
     * The Mongoose model for database operations.
     * 
     * Must be injected by subclasses using @Inject decorator.
     * 
     * @abstract
     * @protected
     */
    protected abstract model: MongooseModel<MONGO>;
    
    /**
     * The mapper for converting between Mongoose documents and application models.
     * 
     * Must be injected by subclasses using @Inject decorator.
     * 
     * @abstract
     * @protected
     */
    protected abstract mapper: MongoMapper<MONGO, MODEL>;

    /**
     * Converts an application model to a plain object for document creation.
     * 
     * Uses the mapper to prepare the model for Mongoose create operations.
     * Excludes fields that should not be set during creation (_id, createdAt, updatedAt).
     * 
     * @param model The application model to convert
     * @returns Promise resolving to a plain object suitable for Mongoose.create()
     * @protected
     * 
     * @example
     * ```typescript
     * async create(model: UserModel): Promise<UserModel> {
     *   const createObj = await this.getCreateObject(model);
     *   const mongo = await this.model.create(createObj);
     *   return this.mapSingle(mongo);
     * }
     * ```
     */
    protected getCreateObject(model: MODEL) {
        return this.mapper.modelToMongoCreateObject(model);
    }

    /**
     * Converts an application model to a plain object for document updates.
     * 
     * Uses the mapper to prepare the model for Mongoose update operations.
     * Excludes fields that should not be modified (_id, createdAt).
     * 
     * @param model The application model to convert
     * @returns Promise resolving to a plain object suitable for Mongoose update operations
     * @protected
     * 
     * @example
     * ```typescript
     * async update(id: string, model: UserModel): Promise<UserModel | null> {
     *   const updateObj = await this.getUpdateObject(model);
     *   const mongo = await this.model.findByIdAndUpdate(id, updateObj, { new: true });
     *   return this.mapSingle(mongo);
     * }
     * ```
     */
    protected getUpdateObject(model: MODEL) {
        return this.mapper.modelToMongoUpdateObject(model);
    }

    /**
     * Maps a single Mongoose document to an application model.
     * 
     * Handles null and undefined values gracefully, returning null if the input is falsy.
     * This is useful for find operations that may not return a document.
     * 
     * @param mongo The Mongoose document to map (can be null or undefined)
     * @returns Promise resolving to the mapped model, or null if input is falsy
     * @protected
     * 
     * @example
     * ```typescript
     * async findById(id: string): Promise<UserModel | null> {
     *   const mongo = await this.model.findById(id);
     *   return this.mapSingle(mongo); // Returns null if not found
     * }
     * 
     * async findOne(query: object): Promise<UserModel | null> {
     *   const mongo = await this.model.findOne(query);
     *   return this.mapSingle(mongo);
     * }
     * ```
     */
    protected async mapSingle(mongo: MONGO | null | undefined) {
        if (!mongo) {
            return null;
        }

        return this.mapper.mongoToModel(mongo);
    }

    /**
     * Maps an array of Mongoose documents to application models.
     * 
     * Processes all documents in parallel using Promise.all for optimal performance.
     * Useful for find operations that return multiple documents.
     * 
     * @param mongo Array of Mongoose documents to map
     * @returns Promise resolving to an array of mapped models
     * @protected
     * 
     * @example
     * ```typescript
     * async findAll(): Promise<UserModel[]> {
     *   const mongos = await this.model.find();
     *   return this.mapMany(mongos);
     * }
     * 
     * async findByStatus(status: string): Promise<UserModel[]> {
     *   const mongos = await this.model.find({ status });
     *   return this.mapMany(mongos);
     * }
     * 
     * async findPaginated(skip: number, limit: number): Promise<UserModel[]> {
     *   const mongos = await this.model.find().skip(skip).limit(limit);
     *   return this.mapMany(mongos);
     * }
     * ```
     */
    protected async mapMany(mongo: MONGO[]): Promise<MODEL[]> {
        const promises = mongo.map((model) => this.mapper.mongoToModel(model));

        return Promise.all(promises);
    }
}
