---
description: Old mapper and repository APIs are migrated to the current ones.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

I upgraded @radoslavirha/tsed-mongoose and this no longer compiles. Update it to the
current API and reply with only the updated code:

```ts
@Injectable()
export class ItemMapper extends MongoMapper<ItemMongo, ItemModel> {
    public mongoToModel(mongo: ItemMongo): ItemModel {
        const model = new ItemModel();
        this.mongoToModelBase(model, mongo);
        model.name = mongo.name;
        return model;
    }
    public modelToMongoCreateObject(model: ItemModel) {
        return { name: model.name };
    }
}

@Injectable()
export class ItemRepository extends MongoRepository<ItemMongo> {
    @Inject(ItemMongo) protected model!: MongooseModel<ItemMongo>;
    protected type = ItemMongo;
}
```
