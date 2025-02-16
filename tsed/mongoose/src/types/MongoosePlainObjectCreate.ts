import { MongoosePlainObject } from './MongoosePlainObject.js';

export type MongoosePlainObjectCreate<T> = Omit<Partial<MongoosePlainObject<T>>, 'id' | '_id' | 'createdAt' | 'updatedAt'>;
