import { describe, expect, it } from 'vitest';
import { Dictionary, FullPartial } from '@radoslavirha/types';
import { ObjectUtils } from './ObjectUtils.js';

describe('ObjectUtils', () => {
    describe('cloneDeep', () => {
        it('should deep clone an object', () => {
            const original = {
                a: 1,
                b: {
                    c: 2,
                    d: [3, 4, 5]
                }
            };

            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toEqual(original);
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

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original); // Ensure it's a different reference
            expect(cloned instanceof TestClass).toBe(true); // Ensure the cloned object is still an instance of TestClass
        });

        it('should handle null values', () => {
            const original = { a: null, b: { c: null } };
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should handle undefined values', () => {
            const original = { a: undefined, b: { c: undefined } };
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should handle Date objects', () => {
            const original = { date: new Date('2023-01-01') };
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned.date).toEqual(original.date);
            expect(cloned.date).not.toBe(original.date);
        });

        it('should handle empty objects', () => {
            const original = {};
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
        });

        it('should handle arrays with mixed types', () => {
            const original = [1, 'string', { a: 1 }, [2, 3], null, undefined];
            const cloned = ObjectUtils.cloneDeep(original);

            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned[2]).not.toBe(original[2]);
        });
    });

    describe('mergeDeep', () => {
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

            expect(merged).toEqual({
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

            expect(merged).toEqual(target);
            expect(merged).not.toBe(target);
        });

        it('should handle empty target object', () => {
            const target = {};
            const source = { a: 1, b: { c: 2 } };
            
            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged).toEqual(source);
        });

        it('should merge nested arrays by concatenation', () => {
            const target = { arr: [1, 2, 3] };
            const source = { arr: [4, 5] };
            
            const merged = ObjectUtils.mergeDeep(target, source);

            expect(merged.arr).toEqual([1, 2, 3, 4, 5]);
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

            expect(merged).toEqual({
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
    });

    describe('keys', () => {
        it('returns typed keys from a plain object', () => {
            const obj = { host: 'localhost', port: 3000 };
            const result: ('host' | 'port')[] = ObjectUtils.keys(obj);

            expect(result).toEqual(['host', 'port']);
        });

        it('returns string keys from a dictionary', () => {
            const dict: Dictionary<number> = { a: 1, b: 2 };
            const result: string[] = ObjectUtils.keys(dict);

            expect(result).toEqual(['a', 'b']);
        });

        it('returns empty array for null', () => {
            expect(ObjectUtils.keys(null)).toEqual([]);
        });

        it('returns empty array for undefined', () => {
            expect(ObjectUtils.keys(undefined)).toEqual([]);
        });

        it('returns empty array for an empty object', () => {
            expect(ObjectUtils.keys({})).toEqual([]);
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
});