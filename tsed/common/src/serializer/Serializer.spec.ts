import { Property } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { CommonUtils } from '@radoslavirha/utils';
import { BaseModel } from '../models/BaseModel.js';
import { Serializer } from './Serializer.js';

class ChildModel extends BaseModel {
    @Property(String)
    tag!: string;
}

class TestModel extends BaseModel {
    @Property(String)
    name!: string;

    @Property(Number)
    age!: number;

    @Property(ChildModel)
    child?: ChildModel;
}

const CREATED_AT = new Date('2024-01-15T10:00:00.000Z');
const UPDATED_AT = new Date('2024-01-15T11:00:00.000Z');

const makeModel = (): TestModel => CommonUtils.buildModel(TestModel, {
    id: '1',
    name: 'Alice',
    age: 30,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
});

const makeChild = (): ChildModel => CommonUtils.buildModel(ChildModel, {
    id: '2',
    tag: 'vip',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT
});

describe('Serializer', () => {
    describe('serialize', () => {
        it('serializes a model instance to a plain object with all properties', () => {
            const result = Serializer.serialize(makeModel(), TestModel);

            expect(result).toEqual({
                id: '1',
                name: 'Alice',
                age: 30,
                createdAt: '2024-01-15T10:00:00.000Z',
                updatedAt: '2024-01-15T11:00:00.000Z'
            });
        });

        it('serializes nested models to nested plain objects', () => {
            const model = makeModel();
            model.child = makeChild();

            const result = Serializer.serialize(model, TestModel);

            expect(result).toEqual({
                id: '1',
                name: 'Alice',
                age: 30,
                createdAt: '2024-01-15T10:00:00.000Z',
                updatedAt: '2024-01-15T11:00:00.000Z',
                child: {
                    id: '2',
                    tag: 'vip',
                    createdAt: '2024-01-15T10:00:00.000Z',
                    updatedAt: '2024-01-15T11:00:00.000Z'
                }
            });
        });

        it('accepts additional serializer options', () => {
            expect(() => Serializer.serialize(makeModel(), TestModel, { useAlias: true })).not.toThrow();
        });
    });

    describe('deserialize', () => {
        it('deserializes a plain object into a fully populated model instance', () => {
            const plain = {
                id: '1',
                name: 'Alice',
                age: 30,
                createdAt: '2024-01-15T10:00:00.000Z',
                updatedAt: '2024-01-15T11:00:00.000Z'
            };

            const result = Serializer.deserialize(plain, TestModel);

            expect(result).toBeInstanceOf(TestModel);
            expect(result).toEqual(expect.objectContaining({
                id: '1',
                name: 'Alice',
                age: 30,
                createdAt: CREATED_AT,
                updatedAt: UPDATED_AT
            }));
        });

        it('deserializes nested plain objects into nested model instances', () => {
            const plain = {
                id: '1',
                name: 'Alice',
                age: 30,
                createdAt: '2024-01-15T10:00:00.000Z',
                updatedAt: '2024-01-15T11:00:00.000Z',
                child: {
                    id: '2',
                    tag: 'vip',
                    createdAt: '2024-01-15T10:00:00.000Z',
                    updatedAt: '2024-01-15T11:00:00.000Z'
                }
            };

            const result = Serializer.deserialize(plain, TestModel);

            expect(result).toBeInstanceOf(TestModel);
            expect(result.child).toBeInstanceOf(ChildModel);
            expect(result).toEqual(expect.objectContaining({
                id: '1',
                name: 'Alice',
                age: 30,
                createdAt: CREATED_AT,
                updatedAt: UPDATED_AT,
                child: expect.objectContaining({
                    id: '2',
                    tag: 'vip',
                    createdAt: CREATED_AT,
                    updatedAt: UPDATED_AT
                })
            }));
        });

        it('accepts additional deserializer options', () => {
            const plain = { id: '1', name: 'Alice', age: 30 };

            expect(() => Serializer.deserialize(plain, TestModel, { useAlias: true })).not.toThrow();
        });

        it('round-trips a model through serialize then deserialize', () => {
            const original = makeModel();

            const plain = Serializer.serialize(original, TestModel);
            const restored = Serializer.deserialize(plain as object, TestModel);

            expect(restored).toBeInstanceOf(TestModel);
            expect(restored).toEqual(expect.objectContaining({
                id: '1',
                name: 'Alice',
                age: 30,
                createdAt: CREATED_AT,
                updatedAt: UPDATED_AT
            }));
        });
    });

    describe('deserializeArray', () => {
        it('deserializes an array of plain objects into fully populated model instances', () => {
            const items = [
                { id: '1', name: 'Alice', age: 30, createdAt: '2024-01-15T10:00:00.000Z', updatedAt: '2024-01-15T11:00:00.000Z' },
                { id: '2', name: 'Bob', age: 25, createdAt: '2024-01-15T10:00:00.000Z', updatedAt: '2024-01-15T11:00:00.000Z' }
            ];

            const result = Serializer.deserializeArray(items, TestModel);

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(TestModel);
            expect(result[1]).toBeInstanceOf(TestModel);
            expect(result[0]).toEqual(expect.objectContaining({ id: '1', name: 'Alice', age: 30, createdAt: CREATED_AT, updatedAt: UPDATED_AT }));
            expect(result[1]).toEqual(expect.objectContaining({ id: '2', name: 'Bob', age: 25, createdAt: CREATED_AT, updatedAt: UPDATED_AT }));
        });

        it('returns an empty array for an empty input', () => {
            const result = Serializer.deserializeArray([], TestModel);

            expect(result).toEqual([]);
        });

        it('deserializes array items with nested models', () => {
            const items = [
                {
                    id: '1', name: 'Alice', age: 30,
                    createdAt: '2024-01-15T10:00:00.000Z', updatedAt: '2024-01-15T11:00:00.000Z',
                    child: { id: '3', tag: 'gold', createdAt: '2024-01-15T10:00:00.000Z', updatedAt: '2024-01-15T11:00:00.000Z' }
                }
            ];

            const result = Serializer.deserializeArray(items, TestModel);

            expect(result[0]).toBeInstanceOf(TestModel);
            expect(result[0].child).toBeInstanceOf(ChildModel);
            expect(result[0]).toEqual(expect.objectContaining({
                id: '1',
                name: 'Alice',
                age: 30,
                child: expect.objectContaining({ id: '3', tag: 'gold' })
            }));
        });
    });
});
