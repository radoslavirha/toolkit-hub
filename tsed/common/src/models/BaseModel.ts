import { Format, Property } from '@tsed/schema';

export class BaseModel {
    @Property(String)
    public id: string;

    @Format('date-time')
    public createdAt: Date;

    @Format('date-time')
    public updatedAt: Date;
}
