import { MongoosePlainObject } from './MongoosePlainObject.js';

export type MongoosePlainObjectUpdate<T> = Omit<Partial<MongoosePlainObject<T>>, 'id' | '_id' | 'createdAt' | 'updatedAt'>;
