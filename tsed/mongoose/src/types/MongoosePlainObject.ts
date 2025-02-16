export type MongoosePlainObject<T> = { [P in keyof T]: T[P] };
