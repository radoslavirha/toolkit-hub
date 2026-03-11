import type { MongooseModel } from '@tsed/mongoose';
import { PlatformTest } from '@tsed/platform-http/testing';
import { TestContainersMongo } from '@tsed/testcontainers-mongo';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { BaseModel } from '@radoslavirha/tsed-common';
import { TestModel } from '../test/TestModel.js';
import { TestMongoMapper } from '../test/TestMongoMapper.js';
import { TestModelChildMongo, TestModelMongo } from '../test/TestMongoModel.js';

describe('MongoMapper', () => {
    let mapper: TestMongoMapper;

    beforeEach(() => TestContainersMongo.create());
    beforeEach(() => {
        mapper = PlatformTest.get<TestMongoMapper>(TestMongoMapper);
    });
    afterEach(() => TestContainersMongo.reset());

    it('mongoToModelBase - maps id, createdAt, updatedAt from mongo', async () => {
        const mongo = new TestModelMongo();
        mongo._id = new Types.ObjectId('654bcd82bba81536a4ed4df3').toHexString();
        mongo.createdAt = new Date('2023-12-09T21:08:36.576Z');
        mongo.updatedAt = new Date('2023-12-10T10:00:00.000Z');

        expect.assertions(3);

        const result = mapper.mongoToModelBase(mongo);

        expect(result.id).toEqual('654bcd82bba81536a4ed4df3');
        expect(result.createdAt).toEqual(new Date('2023-12-09T21:08:36.576Z'));
        expect(result.updatedAt).toEqual(new Date('2023-12-10T10:00:00.000Z'));
    });

    it('mongoToModelBase - returns a BaseModel instance, not a POJO', async () => {
        const mongo = new TestModelMongo();
        mongo._id = new Types.ObjectId('654bcd82bba81536a4ed4df3').toHexString();
        mongo.createdAt = new Date('2023-12-09T21:08:36.576Z');
        mongo.updatedAt = new Date('2023-12-09T21:08:36.576Z');

        expect.assertions(1);

        const result = mapper.mongoToModelBase(mongo);

        expect(result).toBeInstanceOf(BaseModel);
    });

    it('mongoToModelBase - returns only base fields, not domain fields', async () => {
        const mongo = new TestModelMongo();
        mongo._id = new Types.ObjectId('654bcd82bba81536a4ed4df3').toHexString();
        mongo.createdAt = new Date('2023-12-09T21:08:36.576Z');
        mongo.updatedAt = new Date('2023-12-09T21:08:36.576Z');
        mongo.label = 'test-label';

        expect.assertions(2);

        const result = mapper.mongoToModelBase(mongo);

        // Only the 3 base fields are returned — domain fields must be mapped explicitly
        // via buildModelStrict, which enforces compile-time exhaustiveness
        expect(Object.keys(result)).toEqual(['id', 'createdAt', 'updatedAt']);
        expect((result as Record<string, unknown>)['label']).toBeUndefined();
    });

    it('canBePopulated - false', async () => {
        const Model = PlatformTest.get<MongooseModel<TestModelMongo>>(TestModelMongo);

        const mongo = new Model({
            createdAt: new Date('2023-12-09T21:08:36.576Z'),
            updatedAt: new Date('2023-12-09T21:08:36.576Z'),
            child_id: new Types.ObjectId()
        });

        expect.assertions(1);

        // @ts-expect-error protected method
        const response = mapper.canBePopulated(mongo.child_id);

        expect(response).toEqual(false);
    });

    it('canBePopulated - true', async () => {
        const Model = PlatformTest.get<MongooseModel<TestModelMongo>>(TestModelMongo);
        const ModelChild = PlatformTest.get<MongooseModel<TestModelChildMongo>>(TestModelChildMongo);

        const mongo = new Model({
            createdAt: new Date('2023-12-09T21:08:36.576Z'),
            updatedAt: new Date('2023-12-09T21:08:36.576Z'),
            child_id: new ModelChild()
        });

        expect.assertions(1);

        // @ts-expect-error protected method
        const response = mapper.canBePopulated(mongo.child_id);

        expect(response).toEqual(true);
    });

    it('getPopulated', async () => {
        const Model = PlatformTest.get<MongooseModel<TestModelMongo>>(TestModelMongo);
        const ModelChild = PlatformTest.get<MongooseModel<TestModelChildMongo>>(TestModelChildMongo);

        const mongo = new Model({
            createdAt: new Date('2023-12-09T21:08:36.576Z'),
            updatedAt: new Date('2023-12-09T21:08:36.576Z'),
            child_id: new ModelChild()
        });

        expect.assertions(1);

        // @ts-expect-error protected method
        const response = mapper.getPopulated(mongo.child_id);

        expect(response).toBeInstanceOf(TestModelChildMongo);
    });

    it('getIdFromPotentiallyPopulated', async () => {
        const childId = '654bcd82bba81536a4ed4df3';
        const Model = PlatformTest.get<MongooseModel<TestModelMongo>>(TestModelMongo);

        const mongo = new Model({
            _id: 'test',
            createdAt: new Date('2023-12-09T21:08:36.576Z'),
            updatedAt: new Date('2023-12-09T21:08:36.576Z'),
            child_id: new Types.ObjectId(childId)
        });

        expect.assertions(1);

        // @ts-expect-error protected method
        const response = mapper.getIdFromPotentiallyPopulated(mongo.child_id);

        expect(response).toEqual(childId);
    });

    it('getIdFromPotentiallyPopulated - from populated', async () => {
        const childId: string = '654bcd82bba81536a4ed4df3';
        const Model = PlatformTest.get<MongooseModel<TestModelMongo>>(TestModelMongo);
        const ModelChild = PlatformTest.get<MongooseModel<TestModelChildMongo>>(TestModelChildMongo);

        const mongo = new Model({
            _id: 'test',
            createdAt: new Date('2023-12-09T21:08:36.576Z'),
            updatedAt: new Date('2023-12-09T21:08:36.576Z'),
            child_id: new ModelChild({
                _id: childId
            })
        });

        expect.assertions(1);

        // @ts-expect-error protected method
        const response = mapper.getIdFromPotentiallyPopulated(mongo.child_id);

        expect(response).toEqual(childId);
    });

    it('getModelValue - POST with value', async () => {
        const model = new TestModel();
        model.label = 'tester';
        // @ts-expect-error protected method
        const spy = vi.spyOn(mapper, 'getModelDefault');

        expect.assertions(2);

        const response = mapper.getModelValue(model, 'label');

        expect(response).toEqual('tester');
        expect(spy).not.toHaveBeenCalled();
    });

    it('getModelValue - POST with undefined', async () => {
        const model = new TestModel();
        // @ts-expect-error protected method
        const spy = vi.spyOn(mapper, 'getModelDefault').mockReturnValue('mocked');

        expect.assertions(2);

        const response = mapper.getModelValue(model, 'label');

        expect(response).toEqual('mocked');
        expect(spy).toHaveBeenCalledWith(model, 'label');
    });

    it('getModelValue - PATCH with value', async () => {
        const model = new TestModel();
        model.label = 'tester';
        // @ts-expect-error protected method
        const spy = vi.spyOn(mapper, 'getModelDefault');

        expect.assertions(2);

        const response = mapper.getModelValue(model, 'label', true);

        expect(response).toEqual('tester');
        expect(spy).not.toHaveBeenCalled();
    });

    it('getModelValue - PATCH with undefined', async () => {
        const model = new TestModel();
        // @ts-expect-error protected method
        const spy = vi.spyOn(mapper, 'getModelDefault');

        expect.assertions(2);

        const response = mapper.getModelValue(model, 'label', true);

        expect(response).toBeUndefined();
        expect(spy).not.toHaveBeenCalled();
    });

    it('getModelDefault', async () => {
        const model = new TestModel();

        expect.assertions(1);

        // @ts-expect-error protected method
        const response = mapper.getModelDefault(model, 'label');

        expect(response).toEqual('label');
    });

    it('getModelDefault - no default value', async () => {
        const model = new TestModel();

        expect.assertions(1);

        // @ts-expect-error protected method
        const response = mapper.getModelDefault(model, 'child_id');

        expect(response).toBeUndefined();
    });

    describe('mongoToModel', () => {
        it('maps all fields from a mongo document', async () => {
            const childId = '654bcd82bba81536a4ed4df3';
            const mongo = new TestModelMongo();
            mongo._id = '654bcd82bba81536a4ed4df4';
            mongo.createdAt = new Date('2023-12-09T21:08:36.576Z');
            mongo.updatedAt = new Date('2023-12-10T10:00:00.000Z');
            mongo.label = 'test-label';
            mongo.child_id = childId as unknown as TestModelMongo['child_id'];

            expect.assertions(5);

            const result = mapper.mongoToModel(mongo);

            expect(result).toBeInstanceOf(TestModel);
            expect(result.id).toBe('654bcd82bba81536a4ed4df4');
            expect(result.label).toBe('test-label');
            expect(result.child_id).toBe(childId);
            expect(result.createdAt).toEqual(new Date('2023-12-09T21:08:36.576Z'));
        });
    });

    describe('mapMany', () => {
        it('maps an empty array', () => {
            expect.assertions(1);

            const result = mapper.mapMany([]);

            expect(result).toEqual([]);
        });

        it('maps multiple documents', () => {
            const childId = '654bcd82bba81536a4ed4df3';

            const mongo1 = new TestModelMongo();
            mongo1._id = 'id1';
            mongo1.createdAt = new Date('2023-12-09T21:08:36.576Z');
            mongo1.updatedAt = new Date('2023-12-09T21:08:36.576Z');
            mongo1.label = 'first';
            mongo1.child_id = childId as unknown as TestModelMongo['child_id'];

            const mongo2 = new TestModelMongo();
            mongo2._id = 'id2';
            mongo2.createdAt = new Date('2023-12-09T21:08:36.576Z');
            mongo2.updatedAt = new Date('2023-12-09T21:08:36.576Z');
            mongo2.label = 'second';
            mongo2.child_id = childId as unknown as TestModelMongo['child_id'];

            expect.assertions(3);

            const result = mapper.mapMany([mongo1, mongo2]);

            expect(result).toHaveLength(2);
            expect(result[0].label).toBe('first');
            expect(result[1].label).toBe('second');
        });
    });

    describe('buildMongoCreate', () => {
        it('builds payload with domain fields', () => {
            const model = new TestModel();
            model.label = 'my-label';
            model.child_id = '654bcd82bba81536a4ed4df3';

            expect.assertions(2);

            const result = mapper.buildMongoCreate(model);

            expect(result.label).toBe('my-label');
            expect(result.child_id).toBe('654bcd82bba81536a4ed4df3');
        });

        it('applies default value for missing field', () => {
            const model = new TestModel();
            model.child_id = '654bcd82bba81536a4ed4df3';

            expect.assertions(1);

            const result = mapper.buildMongoCreate(model);

            expect(result.label).toBe('label');
        });

        it('does not include base fields', () => {
            const model = new TestModel();
            model.label = 'my-label';
            model.child_id = '654bcd82bba81536a4ed4df3';

            expect.assertions(4);

            const result = mapper.buildMongoCreate(model);

            expect(result['id']).toBeUndefined();
            expect(result['_id']).toBeUndefined();
            expect(result['createdAt']).toBeUndefined();
            expect(result['updatedAt']).toBeUndefined();
        });
    });

    describe('buildMongoUpdate', () => {
        it('builds patch payload with provided field', () => {
            const model = new TestModel();
            model.label = 'updated-label';

            expect.assertions(1);

            const result = mapper.buildMongoUpdate(model);

            expect(result.label).toBe('updated-label');
        });

        it('omits undefined field in patch mode', () => {
            const model = new TestModel();

            expect.assertions(1);

            const result = mapper.buildMongoUpdate(model);

            expect(result['label']).toBeUndefined();
        });

        it('does not include base fields', () => {
            const model = new TestModel();
            model.label = 'test';

            expect.assertions(4);

            const result = mapper.buildMongoUpdate(model);

            expect(result['id']).toBeUndefined();
            expect(result['_id']).toBeUndefined();
            expect(result['createdAt']).toBeUndefined();
            expect(result['updatedAt']).toBeUndefined();
        });
    });
});
