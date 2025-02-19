import { BaseModel } from '@radoslavirha/tsed-common';
import { Default, Property } from '@tsed/schema';

export class TestModelChild extends BaseModel {
    @Property(String)
    label!: string;
}

export class TestModel extends BaseModel {
    @Property(String)
    @Default('label')
    label!: string;

    @Property(String)
    child_id!: string;

    @Property(TestModelChild)
    child?: TestModelChild;
}
