import { Service } from '@tsed/di';
import { MongoMapper } from '../mappers/MongoMapper.js';
import { TestModel } from './TestModel.js';
import { TestModelMongo } from './TestMongoModel.js';
import { CommonUtils } from '@radoslavirha/utils';
import { MongoCreate } from '../types/MongoCreate.js';
import { MongoUpdate } from '../types/MongoUpdate.js';

@Service()
export class TestMongoMapper extends MongoMapper<TestModelMongo, TestModel> {
    protected mongo = TestModelMongo;
    protected model = TestModel;

    public mongoToModel(mongo: TestModelMongo): TestModel {
        return CommonUtils.buildModelStrict(TestModel, {
            ...this.mongoToModelBase(mongo),
            label: mongo.label,
            child_id: this.getIdFromPotentiallyPopulated(mongo.child_id)
        });
    }

    public mapMany(mongos: TestModelMongo[]): TestModel[] {
        return mongos.map(m => this.mongoToModel(m));
    }

    public buildMongoCreate(model: TestModel): MongoCreate<TestModelMongo> {
        return this.buildMongoPayload({
            label: this.getModelValue(model, 'label'),
            child_id: this.getModelValue(model, 'child_id')
        });
    }

    public buildMongoUpdate(model: TestModel): MongoUpdate<TestModelMongo> {
        return this.buildMongoUpdatePayload({
            label: this.getModelValue(model, 'label', true)
        });
    }
}
