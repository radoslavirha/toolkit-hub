import { Model, Ref } from '@tsed/mongoose';
import { Property } from '@tsed/schema';
import { BaseMongo } from '../models/BaseMongo.js';

@Model({
    collection: 'model-child',
    schemaOptions: { timestamps: true }
})
export class TestModelChildMongo extends BaseMongo {
    @Property(String)
    label!: string;
}

@Model({
    collection: 'model',
    schemaOptions: { timestamps: true }
})
export class TestModelMongo extends BaseMongo {
    @Property(String)
    label!: string;

    @Ref(() => TestModelChildMongo)
    child_id!: Ref<TestModelChildMongo>;
}
