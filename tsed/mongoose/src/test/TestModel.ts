import { BaseModel } from '@radoslavirha/tsed-common';
import { Default, Property } from '@tsed/schema';

export class TestModelChild extends BaseModel {
    @Property()
    label!: string;
}

export class TestModel extends BaseModel {
    @Property()
    @Default('label')
    label!: string;

    @Property()
    child_id!: string;

    @Property(TestModelChild)
    child?: TestModelChild;
}
