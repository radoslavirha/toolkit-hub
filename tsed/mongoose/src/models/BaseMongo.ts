import { ObjectID } from '@tsed/mongoose';
import { Format } from '@tsed/schema';

export class BaseMongo {
    @ObjectID('id')
    public _id: ObjectID;

    @Format('date-time')
    public createdAt: Date;

    @Format('date-time')
    public updatedAt: Date;
}
