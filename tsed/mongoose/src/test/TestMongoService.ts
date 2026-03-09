import { Inject, Service } from '@tsed/di';
import { MongoService } from '../services/MongoService.js';
import { TestModel } from './TestModel.js';
import { TestMongoMapper } from './TestMongoMapper.js';
import { TestModelMongo } from './TestMongoModel.js';
import { TestMongoRepository } from './TestMongoRepository.js';

@Service()
export class TestMongoService extends MongoService<TestModelMongo, TestModel> {
    @Inject(TestMongoRepository)
    protected repository!: TestMongoRepository;
    @Inject(TestMongoMapper)
    protected mapper!: TestMongoMapper;
}
