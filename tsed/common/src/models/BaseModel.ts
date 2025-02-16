import { Format, Property } from '@tsed/schema';

export class BaseModel {
    @Property()
    public id: string;

    @Format('date-time')
    public createdAt: Date;

    @Format('date-time')
    public updatedAt: Date;
}
