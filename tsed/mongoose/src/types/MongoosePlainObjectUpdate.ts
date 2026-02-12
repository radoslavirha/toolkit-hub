import { MongoosePlainObject } from './MongoosePlainObject.js';

/**
 * Type utility for updating Mongoose documents with immutable fields excluded.
 * 
 * This type prepares objects for Mongoose update operations (findByIdAndUpdate, updateOne, etc.) by:
 * - Converting Mongoose documents to plain objects (removing methods)
 * - Making all properties optional (Partial) for flexible partial updates
 * - Excluding immutable fields that should never be modified:
 *   - `id` and `_id` (document identifier, set at creation)
 *   - `createdAt` (creation timestamp, never changes)
 *   - `updatedAt` (automatically updated by Mongoose timestamps)
 * 
 * Use this type when defining the structure for document updates,
 * ensuring that only mutable user data can be modified while protecting
 * system-managed and immutable fields from accidental changes.
 * 
 * @typeParam T - The Mongoose document type to prepare for updates
 * 
 * @example
 * ```typescript
 * import { Document } from 'mongoose';
 * 
 * interface UserDocument extends Document {
 *   _id: ObjectId;
 *   name: string;
 *   email: string;
 *   role?: string;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 * 
 * // Type for updating existing users
 * type UserUpdateData = MongoosePlainObjectUpdate<UserDocument>;
 * // Result: Partial<{ name: string, email: string, role?: string }>
 * 
 * const updates: UserUpdateData = {
 *   role: 'admin'
 *   // Only update role, leave other fields unchanged
 *   // _id, createdAt, updatedAt are excluded and protected
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Use in mapper modelToMongoUpdateObject method
 * class UserMapper extends MongoMapper<UserDocument, UserModel> {
 *   async modelToMongoUpdateObject(model: UserModel): Promise<MongoosePlainObjectUpdate<UserDocument>> {
 *     return {
 *       name: model.name,
 *       email: model.email,
 *       role: model.role
 *       // Cannot accidentally include _id, createdAt, or updatedAt
 *     };
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Use in service update operations
 * async updateUser(id: string, updates: UserUpdateData): Promise<UserDocument | null> {
 *   return await UserModel.findByIdAndUpdate(id, updates, { new: true });
 * }
 * ```
 */
export type MongoosePlainObjectUpdate<T> = Omit<Partial<MongoosePlainObject<T>>, 'id' | '_id' | 'createdAt' | 'updatedAt'>;
