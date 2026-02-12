/**
 * Converts a Mongoose document type to a plain object type by removing methods.
 * 
 * This utility type strips away Mongoose document methods (save, remove, populate, etc.)
 * and getters, leaving only the data properties. It's useful when you need to work with
 * the raw data structure without Mongoose-specific functionality.
 * 
 * The mapped type preserves all properties from the source type while creating a
 * simple object structure suitable for JSON serialization or data manipulation.
 * 
 * @typeParam T - The Mongoose document type to convert to a plain object
 * 
 * @example
 * ```typescript
 * import { Document } from 'mongoose';
 * 
 * interface UserDocument extends Document {
 *   name: string;
 *   email: string;
 *   save(): Promise<this>;
 * }
 * 
 * // Plain object type without Mongoose methods
 * type UserPlainObject = MongoosePlainObject<UserDocument>;
 * // Result: { name: string, email: string, _id: ObjectId, ... }
 * 
 * // Usage in mapper
 * function toPlainObject(doc: UserDocument): MongoosePlainObject<UserDocument> {
 *   return doc.toObject();
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Use with model creation objects
 * type UserCreateObject = MongoosePlainObject<Omit<UserDocument, '_id' | 'createdAt'>>;
 * 
 * const createData: UserCreateObject = {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * };
 * ```
 */
export type MongoosePlainObject<T> = { [P in keyof T]: T[P] };
