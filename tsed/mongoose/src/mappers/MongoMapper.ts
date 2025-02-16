import { BaseModel } from '@radoslavirha/tsed-common';
import { CommonUtils } from '@radoslavirha/utils';
import { MongooseDocumentMethods, Ref } from '@tsed/mongoose';
import { SpecTypes, getJsonSchema } from '@tsed/schema';
import { BaseMongo } from '../models/BaseMongo.js';
import { MongoosePlainObjectCreate } from '../types/MongoosePlainObjectCreate.js';
import { MongoosePlainObjectUpdate } from '../types/MongoosePlainObjectUpdate.js';

export abstract class MongoMapper<MONGO extends BaseMongo, MODEL extends BaseModel> {
    public abstract mongoToModel(mongo: MONGO): Promise<MODEL>;
    public abstract modelToMongoCreateObject(model: MODEL): Promise<MongoosePlainObjectCreate<MONGO>>;
    public abstract modelToMongoUpdateObject(model: MODEL): Promise<MongoosePlainObjectUpdate<MONGO>>;

    protected mongoToModelBase(model: Partial<MODEL>, mongo: MONGO): MODEL {
        model.id = String(mongo._id);
        model.createdAt = mongo.createdAt;
        model.updatedAt = mongo.createdAt;

        return model as MODEL;
    }

    protected getIdFromPotentiallyPopulated<T extends BaseMongo>(value: Ref<T>): string {
        return this.canBePopulated(value)
            ? String((value as unknown as MongooseDocumentMethods<T>).toClass()._id)
            : String(value);
    }

    protected getPopulated<T>(value: Ref<T>): T {
        return (value as MongooseDocumentMethods<T>).toClass();
    }

    protected canBePopulated<T>(value: Ref<T>): boolean {
        try {
            (value as MongooseDocumentMethods<T>).toClass();
            return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return false;
        }
    }

    protected getModelValue<PROPERTY extends keyof MODEL>(
        model: MODEL,
        property: PROPERTY,
        patch: boolean = false
    ): MODEL[PROPERTY] | undefined {
        if (!CommonUtils.isUndefined(model[property])) {
            return model[property];
        } else if (!patch) {
            return this.getModelDefault(model, property);
        }
        return undefined;
    }

    private getModelDefault<PROPERTY extends keyof MODEL>(model: MODEL, property: PROPERTY): MODEL[PROPERTY] | undefined {
        const spec = getJsonSchema(model, { specType: SpecTypes.JSON });

        return spec?.properties[property]?.default ?? undefined;
    }
}
