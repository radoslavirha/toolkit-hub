import type { MongooseModel } from '@tsed/mongoose';
import { PlatformTest } from '@tsed/platform-http/testing';
import { TestContainersMongo } from '@tsed/testcontainers-mongo';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestNullableScalarMongo, TestStorageMongo } from './test/TestStorageModel.js';

describe('Mongoose storage contract', () => {
    let model: MongooseModel<TestStorageMongo>;

    beforeEach(() => TestContainersMongo.create());
    beforeEach(() => {
        model = PlatformTest.get<MongooseModel<TestStorageMongo>>(TestStorageMongo)!;
    });
    afterEach(() => TestContainersMongo.reset());

    it('maps @Nullable scalars to Mixed paths that neither cast nor validate (trap)', async () => {
        expect.assertions(3);

        const scalar = PlatformTest.get<MongooseModel<TestNullableScalarMongo>>(TestNullableScalarMongo)!;
        const doc = await scalar.create({ note: 'x', at: '2024-01-01T00:00:00.000Z' as unknown as Date });
        const stored = await scalar.findById(doc._id).lean();

        expect(scalar.schema.path('note').instance).toBe('Mixed');
        expect(scalar.schema.path('at').instance).toBe('Mixed');
        expect(stored!.at).toBe('2024-01-01T00:00:00.000Z');
    });

    describe('updates', () => {
        it('strips $set undefined and stores $set null', async () => {
            expect.assertions(2);

            const doc = await model.create({ name: 'a', note: 'keep' });
            await model.updateOne({ _id: doc._id }, { $set: { note: undefined } });
            expect((await model.findById(doc._id).lean())!.note).toBe('keep');

            await model.updateOne({ _id: doc._id }, { $set: { note: null } });
            expect((await model.findById(doc._id).lean())!.note).toBeNull();
        });

        it('persists null and $unset of a required field without runValidators (trap)', async () => {
            expect.assertions(2);

            const doc = await model.create({ name: 'a' });
            await model.updateOne({ _id: doc._id }, { $set: { name: null } });
            expect((await model.findById(doc._id).lean())!.name).toBeNull();

            await model.updateOne({ _id: doc._id }, { $unset: { name: '' } });
            expect((await model.findById(doc._id).lean())!.name).toBeUndefined();
        });

        it('rejects null and $unset of a required field with runValidators while valid updates pass', async () => {
            expect.assertions(3);

            const doc = await model.create({ name: 'a' });

            await expect(model.updateOne({ _id: doc._id }, { $set: { name: null } }, { runValidators: true })).rejects.toThrow();
            await expect(model.updateOne({ _id: doc._id }, { $unset: { name: '' } }, { runValidators: true })).rejects.toThrow();
            await model.updateOne({ _id: doc._id }, { $set: { name: 'b' } }, { runValidators: true });
            expect((await model.findById(doc._id).lean())!.name).toBe('b');
        });
    });

    describe('collections', () => {
        it('keeps Array and Map types for nullable collections and stores null', async () => {
            expect.assertions(3);

            expect(model.schema.path('tags').instance).toBe('Array');
            expect(model.schema.path('scores').instance).toBe('Map');

            const doc = await model.create({ name: 'a', tags: null, scores: null });
            const stored = await model.findById(doc._id).lean();

            expect([stored!.tags, stored!.scores]).toStrictEqual([null, null]);
        });

        it('returns lean maps as plain objects', async () => {
            expect.assertions(2);

            const doc = await model.create({ name: 'a', scores: new Map([['x', 1]]) });
            const stored = await model.findById(doc._id).lean();

            expect(stored!.scores).not.toBeInstanceOf(Map);
            expect(stored!.scores).toStrictEqual({ x: 1 });
        });

        it.each(['a.b', '$a'])('rejects the map key %s with a cast error (trap)', async (key) => {
            expect.assertions(1);

            await expect(model.create({ name: 'a', scores: new Map([[key, 1]]) })).rejects.toThrow();
        });

        it('does not enforce enum keys in Mongo', async () => {
            expect.assertions(1);

            const doc = await model.create({ name: 'a', scores: new Map([['not-in-any-enum', 1]]) });

            expect((await model.findById(doc._id).lean())!.scores).toStrictEqual({ 'not-in-any-enum': 1 });
        });
    });

    describe('sparse unique index', () => {
        it('allows two missing values but collides on two null values', async () => {
            expect.assertions(2);

            await model.init();
            await model.create({ name: 'a' });
            await model.create({ name: 'b' });
            await model.create({ name: 'c', code: null });

            expect(await model.countDocuments()).toBe(3);
            await expect(model.create({ name: 'd', code: null })).rejects.toThrow(/E11000/);
        });
    });
});
