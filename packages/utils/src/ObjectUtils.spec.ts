import { describe, expect, it } from 'vitest';
import { Dictionary, FullPartial } from '@radoslavirha/types';
import { ObjectUtils } from './ObjectUtils.js';

describe('ObjectUtils', () => {
    describe('cloneDeep', () => {
        it('should preserve shared references reachable through an Error', () => {
            const shared = { value: 1 };
            const error = Object.assign(new Error('boom'), { context: shared });
            const original = { shared, error };

            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned.error.context).toBe(cloned.shared);
            expect(cloned.shared).not.toBe(shared);
        });

        it('should preserve shared references when the Error is visited first', () => {
            const shared = { value: 1 };
            const error = Object.assign(new Error('boom'), { context: shared });
            const original = { error, shared };

            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned.error.context).toBe(cloned.shared);
        });

        it('should preserve a cycle that passes through an Error', () => {
            const original: { error?: Error & { owner?: unknown } } = {};
            original.error = Object.assign(new Error('boom'), { owner: original });

            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned.error!.owner).toBe(cloned);
        });

        it('should deep clone an object', () => {
            const original = {
                a: 1,
                b: {
                    c: 2,
                    d: [3, 4, 5]
                }
            };

            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toStrictEqual(original);
            expect(cloned).not.toBe(original); // Ensure it's a different reference
            expect(cloned.b).not.toBe(original.b); // Ensure nested objects are also cloned
            expect(cloned.b.d).not.toBe(original.b.d); // Ensure nested arrays are also cloned
        });

        it('should deep clone a class instance', () => {
            class TestClass {
                prop1: string;
                prop2: number;
                constructor(prop1: string, prop2: number) {
                    this.prop1 = prop1;
                    this.prop2 = prop2;
                }
            }

            const original = new TestClass('value1', 42);
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toStrictEqual(original);
            expect(cloned).not.toBe(original); // Ensure it's a different reference
            expect(cloned instanceof TestClass).toBe(true); // Ensure the cloned object is still an instance of TestClass
        });

        it('should clone an Error instance', () => {
            const error = new Error('boom', { cause: { code: 1 } });

            const cloned = ObjectUtils.cloneDeep(error);

            expect(cloned).toBeInstanceOf(Error);
            expect(cloned).not.toBe(error);
            expect(cloned.message).toBe('boom');
            expect(cloned.stack).toBe(error.stack);
            expect(cloned.cause).toStrictEqual({ code: 1 });
            expect(cloned.cause).not.toBe(error.cause);
        });

        it('should clone Error subclasses with their own properties', () => {
            class HttpError extends Error {
                details = { status: 404 };
            }
            const error = new HttpError('missing');

            const cloned = ObjectUtils.cloneDeep(error);

            expect(cloned).toBeInstanceOf(HttpError);
            expect(cloned.details).toStrictEqual({ status: 404 });
            expect(cloned.details).not.toBe(error.details);
        });

        it('should clone a nested Error without sharing the reference', () => {
            const original = { err: new Error('x') };

            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned.err).toBeInstanceOf(Error);
            expect(cloned.err).not.toBe(original.err);
            expect(cloned.err.message).toBe('x');
        });

        it('should clone an Error with a circular cause', () => {
            const error = new Error('loop');
            error.cause = error;

            const cloned = ObjectUtils.cloneDeep(error);

            expect(cloned).not.toBe(error);
            expect(cloned.cause).toBe(cloned);
        });

        it('should handle null values', () => {
            const original = { a: null, b: { c: null } };
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toStrictEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should handle undefined values', () => {
            const original = { a: undefined, b: { c: undefined } };
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toStrictEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should handle Date objects', () => {
            const original = { date: new Date('2023-01-01') };
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned.date).toStrictEqual(original.date);
            expect(cloned.date).not.toBe(original.date);
        });

        it('should handle empty objects', () => {
            const original = {};
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toStrictEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should handle arrays with mixed types', () => {
            const original = [1, 'string', { a: 1 }, [2, 3], null, undefined];
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toStrictEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[2]).not.toBe(original[2]);
        });
    });

    describe('mergeDeep', () => {
        it('does not mutate an Error nested in target', () => {
            const error = new Error('boom');

            const result = ObjectUtils.mergeDeep({ error }, { error: { code: 'E_BOOM' } });

            expect(error).not.toHaveProperty('code');
            expect(result.error).not.toBe(error);
            expect(result.error).toHaveProperty('code', 'E_BOOM');
        });

        it('does not alias an Error nested in source', () => {
            const error = new Error('boom');

            const result = ObjectUtils.mergeDeep({ a: 1 }, { error });

            expect(result.error).not.toBe(error);
            expect(result.error.message).toBe('boom');
        });

        it('concatenates arrays passed as target and source', () => {
            const result = ObjectUtils.mergeDeep([1, 2], [3]);

            expect(result).toEqual([1, 2, 3]);
        });

        it('returns a result that shares no references with source', () => {
            const source = { items: [{ name: 'b' }], nested: { list: [{ name: 'c' }] } };
            const result = ObjectUtils.mergeDeep({ items: [{ name: 'a' }], nested: { list: [] as { name: string }[] } }, source);

            result.items[1].name = 'mutated';
            result.nested.list[0].name = 'mutated';

            expect(source.items[0].name).toBe('b');
            expect(source.nested.list[0].name).toBe('c');
        });

        it('deep merges a class instance nested in source into the target subtree', () => {
            class DatabaseConfig {
                port: number = 27018;
                options: string[] = ['tls'];
            }
            const target = { db: { host: 'localhost', port: 27017, options: ['retryWrites'] } };
            const source = { db: new DatabaseConfig() };

            const result = ObjectUtils.mergeDeep(target, source);

            expect(result.db).toStrictEqual({ host: 'localhost', port: 27018, options: ['retryWrites', 'tls'] });
            expect(result.db).not.toBe(source.db);
        });

        it('should deep merge two objects', () => {
            interface TestObj {
                a: number;
                b: {
                    c: number;
                    d: number[];
                    e?: number;
                };
            }
            const target: TestObj = {
                a: 1,
                b: {
                    c: 2,
                    d: [3, 4]
                }
            };

            const source: FullPartial<TestObj> = {
                b: {
                    c: 20,
                    e: 30,
                    d: [5]
                }
            };

            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged).toStrictEqual({
                a: 1,
                b: {
                    c: 20,
                    d: [3, 4, 5],
                    e: 30
                }
            });

            expect(merged).not.toBe(target); // Ensure it's a different reference
            expect(merged.b).not.toBe(target.b); // Ensure nested objects are also new references
        });

        it('should handle empty source object', () => {
            const target = { a: 1, b: { c: 2 } };
            const source = {};
            
            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged).toStrictEqual(target);
            expect(merged).not.toBe(target);
        });

        it('should handle empty target object', () => {
            const target = {};
            const source = { a: 1, b: { c: 2 } };
            
            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged).toStrictEqual(source);
        });

        it('should merge nested arrays by concatenation', () => {
            const target = { arr: [1, 2, 3] };
            const source = { arr: [4, 5] };
            
            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged.arr).toStrictEqual([1, 2, 3, 4, 5]);
        });

        it('should handle null values in source', () => {
            const target = { a: 1, b: { c: 2 } };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const source = { b: { c: null as any } };
            
            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged.b.c).toBeNull();
        });

        it('should deeply merge multiple levels', () => {
            const target = { 
                a: { 
                    b: { 
                        c: { 
                            d: 1 
                        } 
                    } 
                } 
            };
            const source = { 
                a: { 
                    b: { 
                        c: { 
                            e: 2 
                        } 
                    } 
                } 
            };
            
            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged).toStrictEqual({
                a: {
                    b: {
                        c: {
                            d: 1,
                            e: 2
                        }
                    }
                }
            });
        });

        it('does not mutate a class instance nested in target', () => {
            class DbConfig {
                host = 'localhost';
                port = 27017;
            }
            const target = { db: new DbConfig() };
            const source = { db: { host: 'mongo.prod' } };

            const result = ObjectUtils.mergeDeep(target, source);

            expect(result.db.host).toBe('mongo.prod');
            expect(result.db).toBeInstanceOf(DbConfig);
            expect(result.db).not.toBe(target.db);
            expect(target.db.host).toBe('localhost');
        });

        it('replaces a typed array nested in an object when target and source both hold one', () => {
            const result = ObjectUtils.mergeDeep({ tls: { ca: new Uint16Array([1, 2]) } }, { tls: { ca: new Uint16Array([7]) } });

            expect(result.tls.ca).toBeInstanceOf(Uint16Array);
            expect(result.tls.ca).toStrictEqual(new Uint16Array([7]));
        });

        it('keeps a typed array typed when target and source both hold one', () => {
            const result = ObjectUtils.mergeDeep({ data: new Uint8Array([1, 2, 3]) }, { data: new Uint8Array([9]) });

            expect(result.data).toBeInstanceOf(Uint8Array);
            expect(result.data).toStrictEqual(new Uint8Array([9]));
        });
    });

    describe('keys', () => {
        it('returns typed keys from a plain object', () => {
            const obj = { host: 'localhost', port: 3000 };
            const result: ('host' | 'port')[] = ObjectUtils.keys(obj);

            expect(result).toStrictEqual(['host', 'port']);
        });

        it('returns string keys from a dictionary', () => {
            const dict: Dictionary<number> = { a: 1, b: 2 };
            const result: string[] = ObjectUtils.keys(dict);

            expect(result).toStrictEqual(['a', 'b']);
        });

        it('returns empty array for null', () => {
            expect(ObjectUtils.keys(null)).toStrictEqual([]);
        });

        it('returns empty array for undefined', () => {
            expect(ObjectUtils.keys(undefined)).toStrictEqual([]);
        });

        it('returns empty array for an empty object', () => {
            expect(ObjectUtils.keys({})).toStrictEqual([]);
        });
    });

    describe('values', () => {
        it('returns typed values from a plain object', () => {
            const obj = { host: 'localhost', port: 3000 };
            const result: (string | number)[] = ObjectUtils.values(obj);

            expect(result).toStrictEqual(['localhost', 3000]);
        });

        it('returns typed values from a dictionary', () => {
            const dict: Dictionary<number> = { a: 1, b: 2 };
            const result: number[] = ObjectUtils.values(dict);

            expect(result).toStrictEqual([1, 2]);
        });

        it('returns enum values from a string enum', () => {
            enum Direction { Up = 'UP', Down = 'DOWN' }
            const result = ObjectUtils.values(Direction);

            expect(result).toStrictEqual(['UP', 'DOWN']);
        });

        it('returns enum values from a numeric enum', () => {
            enum Status { Active = 1, Inactive = 2 }
            // Numeric enums have reverse mappings, so _.values returns both keys and values
            const numericValues = ObjectUtils.values(Status).filter((v) => typeof v === 'number');

            expect(numericValues).toStrictEqual([1, 2]);
        });

        it('returns empty array for null', () => {
            expect(ObjectUtils.values(null)).toStrictEqual([]);
        });

        it('returns empty array for undefined', () => {
            expect(ObjectUtils.values(undefined)).toStrictEqual([]);
        });

        it('returns empty array for an empty object', () => {
            expect(ObjectUtils.values({})).toStrictEqual([]);
        });
    });

    describe('isObject', () => {
        it('returns true for a plain object', () => {
            expect(ObjectUtils.isObject({ a: 1 })).toBe(true);
        });

        it('returns true for an array', () => {
            expect(ObjectUtils.isObject([1, 2])).toBe(true);
        });

        it('returns true for a function', () => {
            expect(ObjectUtils.isObject(() => {})).toBe(true);
        });

        it('returns true for a class instance', () => {
            class Foo {}

            expect(ObjectUtils.isObject(new Foo())).toBe(true);
        });

        it('returns false for a string', () => {
            expect(ObjectUtils.isObject('string')).toBe(false);
        });

        it('returns false for a number', () => {
            expect(ObjectUtils.isObject(42)).toBe(false);
        });

        it('returns false for null', () => {
            expect(ObjectUtils.isObject(null)).toBe(false);
        });
    });

    describe('isPlainObject', () => {
        it('returns true for a plain object literal', () => {
            expect(ObjectUtils.isPlainObject({ a: 1 })).toBe(true);
        });

        it('returns true for Object.create(null)', () => {
            expect(ObjectUtils.isPlainObject(Object.create(null))).toBe(true);
        });

        it('returns false for an array', () => {
            expect(ObjectUtils.isPlainObject([1, 2])).toBe(false);
        });

        it('returns false for a class instance', () => {
            class Foo {}

            expect(ObjectUtils.isPlainObject(new Foo())).toBe(false);
        });

        it('returns false for a string', () => {
            expect(ObjectUtils.isPlainObject('string')).toBe(false);
        });

        it('returns false for null', () => {
            expect(ObjectUtils.isPlainObject(null)).toBe(false);
        });

        it('returns false for a function', () => {
            expect(ObjectUtils.isPlainObject(() => {})).toBe(false);
        });
    });

    describe('isEnabled', () => {
        class Feature {
            constructor(
                public name: string,
                public enabled?: boolean
            ) {}
        }

        class ChildFeature {
            constructor(
                public score: number,
                public enabled?: boolean
            ) {}
        }

        class ParentFeature {
            constructor(
                public name: string,
                public child?: ChildFeature
            ) {}
        }

        it('returns true when enabled is true', () => {
            expect(ObjectUtils.isEnabled(new Feature('feature', true))).toBe(true);
        });

        it('returns false when enabled is false', () => {
            expect(ObjectUtils.isEnabled(new Feature('feature', false))).toBe(false);
        });

        it('returns false when enabled is undefined', () => {
            expect(ObjectUtils.isEnabled(new Feature('feature'))).toBe(false);
        });

        it('returns false when value is null', () => {
            expect(ObjectUtils.isEnabled(null)).toBe(false);
        });

        it('returns false when value is undefined', () => {
            expect(ObjectUtils.isEnabled(undefined)).toBe(false);
        });

        it('works on nested object with enabled: true', () => {
            const parent = new ParentFeature('parent', new ChildFeature(99, true));

            expect(ObjectUtils.isEnabled(parent.child)).toBe(true);
        });

        it('returns false on nested object with enabled: false', () => {
            const parent = new ParentFeature('parent', new ChildFeature(99, false));

            expect(ObjectUtils.isEnabled(parent.child)).toBe(false);
        });

        it('returns false on nested object with enabled missing', () => {
            const parent = new ParentFeature('parent', new ChildFeature(99));

            expect(ObjectUtils.isEnabled(parent.child)).toBe(false);
        });

        it('returns false on nested object with enabled missing', () => {
            const parent = new ParentFeature('parent', new ChildFeature(99, true));

            if(ObjectUtils.isEnabled(parent.child)) {
                expect(parent.child.enabled).toBe(true); // TypeScript should narrow parent.child to ChildFeature with enabled: true
                expect(parent.child.score).toBe(99); // TypeScript should narrow parent.child to ChildFeature with enabled: true
            }
        });
    });

    describe('isDate', () => {
        it('returns true for a Date instance', () => {
            expect(ObjectUtils.isDate(new Date())).toBe(true);
        });

        it('returns true for an invalid Date, which is still a Date', () => {
            expect(ObjectUtils.isDate(new Date('nope'))).toBe(true);
        });

        it('returns false for a date string', () => {
            expect(ObjectUtils.isDate('2026-01-01')).toBe(false);
        });

        it('returns false for a timestamp number', () => {
            expect(ObjectUtils.isDate(Date.now())).toBe(false);
        });
    });
});
