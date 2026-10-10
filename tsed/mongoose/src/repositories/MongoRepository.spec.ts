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

            expect.assertions(5);

            const result = await repository.findById(doc._id);

            expect(result).toBeInstanceOf(TestModelMongo);
            expect(result!._id).toBeTypeOf('string');
            expect(result!.label).toBe('hello');
            expect(result!.createdAt).toBeInstanceOf(Date);
            expect(result!.updatedAt).toBeInstanceOf(Date);
        });

        it('returns null when the document does not exist', async () => {
            const nonExistentId = new Types.ObjectId().toHexString();

            expect.assertions(1);

            const result = await repository.findById(nonExistentId);

            expect(result).toBeNull();
        });
    });

    describe('isValidId — via by-id queries', () => {
        const malformedId = 'not-an-id';

        it('resolves null from findById for a malformed id', async () => {
            expect.assertions(1);

            const result = await repository.findById(malformedId);

            expect(result).toBeNull();
        });

        it('resolves null from findByIdAndUpdate for a malformed id and updates nothing', async () => {
            const doc = await repository.create({ label: 'untouched' });

            expect.assertions(2);

            const result = await repository.findByIdAndUpdate(malformedId, { label: 'changed' });

            expect(result).toBeNull();
            expect((await repository.findById(doc._id))!.label).toBe('untouched');
        });

        it('resolves null from findByIdAndDelete for a malformed id and deletes nothing', async () => {
            await repository.create({ label: 'kept' });

            expect.assertions(2);

            const result = await repository.findByIdAndDelete(malformedId);

            expect(result).toBeNull();
            expect(await repository.countDocuments()).toBe(1);
        });
    });

    describe('deserializeArray — via find', () => {
        it('returns TestModelMongo instances for all results', async () => {
            await repository.create({ label: 'first' });
            await repository.create({ label: 'second' });

            expect.assertions(10);

            const results = await repository.find();

            expect(results).toHaveLength(2);
            expect(results[0]).toBeInstanceOf(TestModelMongo);
            expect(results[0]._id).toBeTypeOf('string');
            expect(results[0].createdAt).toBeInstanceOf(Date);
            expect(results[0].updatedAt).toBeInstanceOf(Date);
            expect(results[1]).toBeInstanceOf(TestModelMongo);
            expect(results[1]._id).toBeTypeOf('string');
            expect(results[1].createdAt).toBeInstanceOf(Date);
            expect(results[1].updatedAt).toBeInstanceOf(Date);
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
            expect.assertions(5);

            const result = await repository.create({ label: 'created' });

            expect(result).toBeInstanceOf(TestModelMongo);
            expect(result._id).toBeTypeOf('string');
            expect(result.label).toBe('created');
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('updateByIdIfUnmodified', () => {
        it('applies a fresh update and returns the new document', async () => {
            const doc = await repository.create({ label: 'a' });

            expect.assertions(3);

            const result = await repository.updateByIdIfUnmodified(doc._id, doc.updatedAt, { label: 'b' });

            expect(result.status).toBe('updated');
            expect(result.status === 'updated' && result.value).toBeInstanceOf(TestModelMongo);
            expect(result.status === 'updated' && result.value.label).toBe('b');
        });

        it('rejects a stale update with conflict and leaves the document untouched', async () => {
            const doc = await repository.create({ label: 'a' });
            await new Promise(resolve => setTimeout(resolve, 5));
            await repository.findByIdAndUpdate(doc._id, { label: 'winner' });

            expect.assertions(2);

            const result = await repository.updateByIdIfUnmodified(doc._id, doc.updatedAt, { label: 'loser' });

            expect(result).toEqual({ status: 'conflict' });
            expect((await repository.findById(doc._id))!.label).toBe('winner');
        });

        it('resolves not-found for a missing or malformed id', async () => {
            expect.assertions(2);

            const missing = await repository.updateByIdIfUnmodified(new Types.ObjectId().toHexString(), new Date(), { label: 'x' });
            const malformed = await repository.updateByIdIfUnmodified('not-an-id', new Date(), { label: 'x' });

            expect(missing).toEqual({ status: 'not-found' });
            expect(malformed).toEqual({ status: 'not-found' });
        });

        it('leaves the unconditional findByIdAndUpdate path last-write-wins', async () => {
            const doc = await repository.create({ label: 'a' });
            await repository.findByIdAndUpdate(doc._id, { label: 'b' });

            expect.assertions(1);

            const result = await repository.findByIdAndUpdate(doc._id, { label: 'c' });

            expect(result!.label).toBe('c');
        });
    });
});
