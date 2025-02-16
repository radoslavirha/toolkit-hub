import { MongooseModel } from '@tsed/mongoose';
import { PlatformTest } from '@tsed/platform-http/testing';
import { TestContainersMongo } from '@tsed/testcontainers-mongo';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
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

    it('mongoToModelBase', async () => {
        const mongo = new TestModelMongo();
        mongo._id = new Types.ObjectId('654bcd82bba81536a4ed4df3');
        mongo.createdAt = new Date('2023-12-09T21:08:36.576Z');
        mongo.updatedAt = new Date('2023-12-09T21:08:36.576Z');

        const model = new TestModel();

        expect.assertions(3);

        // @ts-expect-error protected method
        mapper.mongoToModelBase(model, mongo);

        expect(model.id).toEqual('654bcd82bba81536a4ed4df3');
        expect(model.createdAt).toEqual(expect.any(Date));
        expect(model.updatedAt).toEqual(expect.any(Date));
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
        const childId = '654bcd82bba81536a4ed4df3';
        const Model = PlatformTest.get<MongooseModel<TestModelMongo>>(TestModelMongo);
        const ModelChild = PlatformTest.get<MongooseModel<TestModelChildMongo>>(TestModelChildMongo);

        const mongoChild = new ModelChild();
        mongoChild._id = new Types.ObjectId(childId);

        const mongo = new Model({
            _id: 'test',
            createdAt: new Date('2023-12-09T21:08:36.576Z'),
            updatedAt: new Date('2023-12-09T21:08:36.576Z'),
            child_id: mongoChild
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

        // @ts-expect-error protected method
        const response = mapper.getModelValue(model, 'label');

        expect(response).toEqual('tester');
        expect(spy).not.toHaveBeenCalled();
    });

    it('getModelValue - POST with undefined', async () => {
        const model = new TestModel();
        // @ts-expect-error protected method
        const spy = vi.spyOn(mapper, 'getModelDefault').mockReturnValue('mocked');

        expect.assertions(2);

        // @ts-expect-error protected method
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

        // @ts-expect-error protected method
        const response = mapper.getModelValue(model, 'label', true);

        expect(response).toEqual('tester');
        expect(spy).not.toHaveBeenCalled();
    });

    it('getModelValue - PATCH with undefined', async () => {
        const model = new TestModel();
        // @ts-expect-error protected method
        const spy = vi.spyOn(mapper, 'getModelDefault');

        expect.assertions(2);

        // @ts-expect-error protected method
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
});
