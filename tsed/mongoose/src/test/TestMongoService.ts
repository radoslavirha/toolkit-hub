import { Inject, Service } from '@tsed/di';
import { TestModel } from './TestModel.js';
import { TestMongoMapper } from './TestMongoMapper.js';
import { TestModelMongo } from './TestMongoModel.js';
import { TestMongoRepository } from './TestMongoRepository.js';

@Service()
export class TestMongoService {
    @Inject(TestMongoRepository)
    private repository!: TestMongoRepository;

    @Inject(TestMongoMapper)
    private mapper!: TestMongoMapper;

    public async mapSingle(mongo: TestModelMongo | null | undefined): Promise<TestModel | null> {
        if (!mongo) return null;
        return this.mapper.mongoToModel(mongo);
    }

    public async mapMany(mongos: TestModelMongo[]): Promise<TestModel[]> {
        return this.mapper.mapMany(mongos);
    }

    public async create(model: TestModel): Promise<TestModel> {
        const payload = this.mapper.buildMongoCreate(model);
        const mongo = await this.repository.create(payload);
        return this.mapper.mongoToModel(mongo);
    }

    public async update(id: string, model: TestModel): Promise<TestModel | null> {
        const payload = this.mapper.buildMongoUpdate(model);
        const mongo = await this.repository.findByIdAndUpdate(id, payload);
        return this.mapSingle(mongo);
    }

    public async findById(id: string): Promise<TestModel | null> {
        const mongo = await this.repository.findById(id);
        return this.mapSingle(mongo);
    }

    public async findAll(): Promise<TestModel[]> {
        const mongos = await this.repository.find();
        return this.mapMany(mongos);
    }
}
