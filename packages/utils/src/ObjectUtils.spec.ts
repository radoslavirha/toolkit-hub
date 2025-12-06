import { describe, expect, it } from 'vitest';
import { ObjectUtils } from './ObjectUtils.js';
import { FullPartial } from '@radoslavirha/types';

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
    });
});