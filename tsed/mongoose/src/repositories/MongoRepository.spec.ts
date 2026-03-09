import { PlatformTest } from '@tsed/platform-http/testing';
import { TestContainersMongo } from '@tsed/testcontainers-mongo';
import { Types } from 'mongoose';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestMongoRepository } from '../test/TestMongoRepository.js';
import { TestModelMongo } from '../test/TestMongoModel.js';

describe('MongoRepository', () => {
    let repository: TestMongoRepository;

    beforeEach(() => TestContainersMongo.create());
    beforeEach(() => {
        repository = PlatformTest.get<TestMongoRepository>(TestMongoRepository);
    });
    afterEach(() => TestContainersMongo.reset());

    describe('deserialize — via findById', () => {
        it('returns a TestModelMongo instance (not just a plain shape) after lean() query', async () => {
            const doc = await repository.create({ label: 'hello' });

            expect.assertions(2);

            const result = await repository.findById(doc._id);

            expect(result).toBeInstanceOf(TestModelMongo);
            expect(result!.label).toBe('hello');
        });

        it('returns null when the document does not exist', async () => {
            const nonExistentId = new Types.ObjectId().toHexString();

            expect.assertions(1);

            const result = await repository.findById(nonExistentId);

            expect(result).toBeNull();
        });
    });

    describe('deserializeArray — via find', () => {
        it('returns TestModelMongo instances for all results', async () => {
            await repository.createMany([{ label: 'first' }, { label: 'second' }]);

            expect.assertions(4);

            const results = await repository.find();

            expect(results).toHaveLength(2);
            expect(results[0]).toBeInstanceOf(TestModelMongo);
            expect(results[1]).toBeInstanceOf(TestModelMongo);
            expect(results.map(r => r.label).sort()).toStrictEqual(['first', 'second']);
        });

        it('returns an empty array when no documents match the filter', async () => {
            expect.assertions(1);

            const results = await repository.find({ label: 'nonexistent' });

            expect(results).toHaveLength(0);
        });
    });

    describe('convertHydratedDocumentToObject — via create', () => {
        it('returns a TestModelMongo instance after inserting via model.create()', async () => {
            expect.assertions(2);

            const result = await repository.create({ label: 'created' });

            expect(result).toBeInstanceOf(TestModelMongo);
            expect(result.label).toBe('created');
        });
    });
});
