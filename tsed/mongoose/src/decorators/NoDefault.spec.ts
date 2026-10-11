import type { MongooseModel } from '@tsed/mongoose';
import { PlatformTest } from '@tsed/platform-http/testing';
import { TestContainersMongo } from '@tsed/testcontainers-mongo';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestStorageMongo } from '../test/TestStorageModel.js';

describe('NoDefault', () => {
    let model: MongooseModel<TestStorageMongo>;

    beforeEach(() => TestContainersMongo.create());
    beforeEach(() => {
        model = PlatformTest.get<MongooseModel<TestStorageMongo>>(TestStorageMongo)!;
    });
    afterEach(() => TestContainersMongo.reset());

    it('keeps an omitted array absent instead of defaulting it to []', async () => {
        expect.assertions(2);

        const doc = await model.create({ name: 'a' });
        const stored = await model.findById(doc._id).lean();

        expect(stored!.tags).toBeUndefined();
        expect(stored!.plainTags).toStrictEqual([]);
    });

    it('stores null and an empty array as distinct values', async () => {
        expect.assertions(2);

        const withNull = await model.create({ name: 'n', tags: null });
        const withEmpty = await model.create({ name: 'e', tags: [] });

        expect((await model.findById(withNull._id).lean())!.tags).toBeNull();
        expect((await model.findById(withEmpty._id).lean())!.tags).toStrictEqual([]);
    });
});
