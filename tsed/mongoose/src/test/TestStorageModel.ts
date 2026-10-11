import { Model, MongooseSchema } from '@tsed/mongoose';
import { CollectionOf, Nullable, Property, Required, Schema } from '@tsed/schema';
import { NoDefault } from '../decorators/NoDefault.js';
import { BaseMongo } from '../models/BaseMongo.js';

// the typings only accept a JsonSchema builder, the runtime accepts the plain option
const NULLABLE = { nullable: true } as never;

@Model({
    collection: 'storage-contract',
    schemaOptions: { timestamps: true }
})
export class TestStorageMongo extends BaseMongo {
    @Property(String)
    @Required()
    name!: string;

    @Property(String)
    @Schema(NULLABLE)
    note?: string | null;

    @CollectionOf(String, Array)
    plainTags?: string[];

    @CollectionOf(String, Array)
    @Schema(NULLABLE)
    @NoDefault()
    tags?: string[] | null;

    @CollectionOf(Number, Map)
    @Schema(NULLABLE)
    scores?: Map<string, number> | null;

    @Property(String)
    @MongooseSchema({ index: { unique: true, sparse: true } })
    code?: string | null;
}

@Model({
    collection: 'storage-contract-nullable-scalar',
    schemaOptions: { timestamps: true }
})
export class TestNullableScalarMongo extends BaseMongo {
    @Nullable(String)
    note?: string | null;

    @Nullable(Date)
    at?: Date | null;
}
