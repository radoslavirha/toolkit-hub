import { PlatformTest } from '@tsed/platform-http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestModel } from '../test/TestModel.js';
import { TestMongoMapper } from '../test/TestMongoMapper.js';
import { TestModelMongo } from '../test/TestMongoModel.js';
import { TestMongoService } from '../test/TestMongoService.js';
import { Types } from 'mongoose';
import { MongoosePlainObjectCreate } from '../types/MongoosePlainObjectCreate.js';
import { MongoosePlainObjectUpdate } from '../types/MongoosePlainObjectUpdate.js';

describe('MongoService', () => {
    let service: TestMongoService;
    let mapper: TestMongoMapper;

    beforeEach(() => PlatformTest.create());
    beforeEach(async () => {
        mapper = PlatformTest.get<TestMongoMapper>(TestMongoMapper);
        service = PlatformTest.get<TestMongoService>(TestMongoService);
        
    });
    afterEach(() => PlatformTest.reset());

    it('getCreateObject', async () => {
        const spy = vi
            .spyOn(mapper, 'modelToMongoCreateObject')
            .mockResolvedValue(<MongoosePlainObjectCreate<TestModelMongo>>{ label: 'label', child_id: 'child_id' });
        const model = new TestModel();
        model.label = 'label';

        expect.assertions(2);

        // @ts-expect-error protected method
        const response = await service.getCreateObject(model);

        expect(spy).toHaveBeenCalledWith(model);
        expect(response).toStrictEqual({ label: 'label', child_id: 'child_id' });
    });

    it('getUpdateObject', async () => {
        const spy = vi
            .spyOn(mapper, 'modelToMongoUpdateObject')
            .mockResolvedValue(<MongoosePlainObjectUpdate<TestModelMongo>>{ label: 'label', child_id: 'child_id' });
        const model = new TestModel();
        model.label = 'label';

        expect.assertions(2);

        // @ts-expect-error protected method
        const response = await service.getUpdateObject(model);

        expect(spy).toHaveBeenCalledWith(model);
        expect(response).toStrictEqual({ label: 'label', child_id: 'child_id' });
    });

    it('mapSingle', async () => {
        const spy = vi
            .spyOn(mapper, 'mongoToModel')
            .mockResolvedValue(<TestModel>{ label: 'label', child_id: 'child_id' });
        const mongo = new TestModelMongo();
        mongo._id = new Types.ObjectId('654bcd82bba81536a4ed4df3');
        mongo.label = 'label';
        mongo.createdAt = new Date('2023-12-09T21:08:36.576Z');
        mongo.updatedAt = new Date('2023-12-09T21:08:36.576Z');

        expect.assertions(2);

        // @ts-expect-error protected method
        const response = await service.mapSingle(mongo);

        expect(response).toStrictEqual({ label: 'label', child_id: 'child_id' });
        expect(spy).toHaveBeenCalledWith(mongo);
    });

    it('mapSingle - null', async () => {
        const spy = vi.spyOn(mapper, 'mongoToModel');

        expect.assertions(2);

        // @ts-expect-error protected method
        const response = await service.mapSingle();

        expect(response).toBe(null);
        expect(spy).not.toHaveBeenCalled();
    });

    it('mapMany', async () => {
        const spy = vi
            .spyOn(mapper, 'mongoToModel')
            .mockResolvedValue(<TestModel>{ label: 'label', child_id: 'child_id' });
        const mongo = new TestModelMongo();
        mongo._id = new Types.ObjectId('654bcd82bba81536a4ed4df3');
        mongo.label = 'label';
        mongo.createdAt = new Date('2023-12-09T21:08:36.576Z');
        mongo.updatedAt = new Date('2023-12-09T21:08:36.576Z');

        const mongo2 = new TestModelMongo();
        mongo2._id = new Types.ObjectId('654bcd82bba81536a4ed4df3');
        mongo2.label = 'label2';
        mongo2.createdAt = new Date('2023-12-09T21:08:36.576Z');
        mongo2.updatedAt = new Date('2023-12-09T21:08:36.576Z');

        expect.assertions(4);

        // @ts-expect-error protected method
        const response = await service.mapMany([mongo, mongo2]);

        expect(response.length).toBe(2);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, mongo);
        expect(spy).toHaveBeenNthCalledWith(2, mongo2);
    });
});
