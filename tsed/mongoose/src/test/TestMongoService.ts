import { Inject, Service } from '@tsed/di';
import { MongooseModel } from '@tsed/mongoose';
import { MongoService } from '../services/MongoService.js';
import { TestModel } from './TestModel.js';
import { TestMongoMapper } from './TestMongoMapper.js';
import { TestModelMongo } from './TestMongoModel.js';

@Service()
export class TestMongoService extends MongoService<TestModelMongo, TestModel> {
    @Inject(TestModelMongo)
    protected model!: MongooseModel<TestModelMongo>;
    @Inject(TestMongoMapper)
    protected mapper!: TestMongoMapper;
}
