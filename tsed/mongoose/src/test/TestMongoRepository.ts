import { Injectable, Inject } from '@tsed/di';
import { MongooseModel } from '@tsed/mongoose';
import { Type } from '@tsed/core';

import { MongoRepository } from '../repositories/MongoRepository.js';
import { MongoCreate } from '../types/MongoCreate.js';
import { MongoFilter } from '../types/MongoFilter.js';
import { MongoUpdate } from '../types/MongoUpdate.js';
import { MongoDeleteResult } from '../types/MongoDeleteResult.js';
import { MongoUpdateResult } from '../types/MongoUpdateResult.js';
import { TestModelMongo } from './TestMongoModel.js';

@Injectable()
export class TestMongoRepository extends MongoRepository<TestModelMongo> {
    @Inject(TestModelMongo)
    protected model!: MongooseModel<TestModelMongo>;

    protected type: Type<TestModelMongo> = TestModelMongo;

    async findById(id: string): Promise<TestModelMongo | null> {
        const result = await this.model.findById(id).lean<TestModelMongo>();

        return this.deserialize(result);
    }

    async findOne(filter: MongoFilter<TestModelMongo>): Promise<TestModelMongo | null> {
        const result = await this.model.findOne(filter).lean<TestModelMongo>();

        return this.deserialize(result);
    }

    async find(filter?: MongoFilter<TestModelMongo>): Promise<TestModelMongo[]> {
        const results = await this.model.find(filter).lean<TestModelMongo[]>();

        return this.deserializeArray(results);
    }

    async countDocuments(filter?: MongoFilter<TestModelMongo>): Promise<number> {
        return this.model.countDocuments(filter);
    }

    async exists(filter: MongoFilter<TestModelMongo>): Promise<boolean> {
        const result = await this.model.exists(filter);
        return result !== null;
    }

    async create(data: MongoCreate<TestModelMongo>): Promise<TestModelMongo> {
        const doc = await this.model.create(data);

        return this.deserialize(this.convertHydratedDocumentToObject(doc))!;
    }

    async createMany(data: MongoCreate<TestModelMongo>[]): Promise<TestModelMongo[]> {
        const docs = await this.model.insertMany(data, { lean: true });

        return this.deserializeArray(docs as unknown as TestModelMongo[]);
    }

    async findByIdAndUpdate(id: string, data: MongoUpdate<TestModelMongo>): Promise<TestModelMongo | null> {
        const result = await this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean<TestModelMongo>();

        return this.deserialize(result);
    }

    async findOneAndUpdate(filter: MongoFilter<TestModelMongo>, data: MongoUpdate<TestModelMongo>): Promise<TestModelMongo | null> {
        const result = await this.model.findOneAndUpdate(filter, { $set: data }, { new: true }).lean<TestModelMongo>();

        return this.deserialize(result);
    }

    async updateOne(filter: MongoFilter<TestModelMongo>, data: MongoUpdate<TestModelMongo>): Promise<MongoUpdateResult> {
        const result = await this.model.updateOne(filter, { $set: data });

        return {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedCount > 0,
            upsertedId: result.upsertedId ? String(result.upsertedId) : null
        };
    }

    async updateMany(filter: MongoFilter<TestModelMongo>, data: MongoUpdate<TestModelMongo>): Promise<MongoUpdateResult> {
        const result = await this.model.updateMany(filter, { $set: data });

        return {
            matched: result.matchedCount,
            modified: result.modifiedCount,
            upserted: result.upsertedCount > 0,
            upsertedId: result.upsertedId ? String(result.upsertedId) : null
        };
    }

    async findByIdAndDelete(id: string): Promise<TestModelMongo | null> {
        const result = await this.model.findByIdAndDelete(id).lean<TestModelMongo>();

        return this.deserialize(result);
    }

    async findOneAndDelete(filter: MongoFilter<TestModelMongo>): Promise<TestModelMongo | null> {
        const result = await this.model.findOneAndDelete(filter).lean<TestModelMongo>();

        return this.deserialize(result);
    }

    async deleteOne(filter: MongoFilter<TestModelMongo>): Promise<MongoDeleteResult> {
        const result = await this.model.deleteOne(filter);

        return {
            deleted: result.deletedCount > 0,
            deletedCount: result.deletedCount
        };
    }

    async deleteMany(filter: MongoFilter<TestModelMongo>): Promise<MongoDeleteResult> {
        const result = await this.model.deleteMany(filter);

        return {
            deleted: result.deletedCount > 0,
            deletedCount: result.deletedCount
        };
    }
}

