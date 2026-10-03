import { Format, Property } from '@tsed/schema';

export class BaseModel {
    @Property(String)
    public id: string;

    @Property(Date)
    @Format('date-time')
    public createdAt: Date;

    @Property(Date)
    @Format('date-time')
    public updatedAt: Date;
}
