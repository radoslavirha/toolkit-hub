---
name: using-tsed-mongoose
description: Use when writing or changing a Mongoose document, mapper or repository in a Ts.ED service — converting documents to API models, typing create/update payloads, handling refs and populated fields, or extending MongoMapper / MongoRepository. Covers the three-layer contract, the members each base class requires, and the migration traps from the older mutating mapper API.
---

# Using @radoslavirha/tsed-mongoose

Three types per entity, each with one job:

| Layer | Base class | Owns |
|---|---|---|
| Document | `BaseMongo` | the Mongoose shape — `_id` (exposed as `id`), `createdAt`, `updatedAt` |
| API model | `BaseModel` (from `@radoslavirha/tsed-common`) | what leaves the service |
| Translation | `MongoMapper<MONGO, MODEL>` | document ↔ model, in both directions |
| Data access | `MongoRepository<MONGO>` | queries |

Never let a document type reach a controller, and never let an API model reach Mongoose.
The mapper is the only place the two meet.

## The members each base class requires

`MongoMapper` declares two abstract **properties** — not methods — and the compiler will not
let you forget them:

```ts ignore
protected mongo = ItemMongo;   // the Mongoose document class
protected model = ItemModel;   // the API model class
```

`MongoRepository` needs the injected model plus the document class:

```ts ignore
@Inject(ItemMongo) protected model!: MongooseModel<ItemMongo>;
protected mongo = ItemMongo;
```

## The mapper

`MongoMapper` extends `MappingUtils`, so the null-safe mapping helpers
(`this.mapOptionalModel`, `this.mapArray`, …) are already available on `this`. Do not import
`MappingUtils` separately or hand-roll null checks around a mapper call.

- `mongoToModelBase(mongo)` **returns** `{ id, createdAt, updatedAt }` — spread it into your
  model. It does not mutate.
- `buildMongoPayload(data)` builds a create payload; `buildMongoUpdatePayload(data)` builds an
  update payload.
- `getModelValue(model, key)` reads a property applying its `@Default`; pass `true` as the
  third argument to omit undefined instead — that is the PATCH behaviour.

```ts
import { Inject, Injectable } from '@tsed/di';
import { Model, MongooseModel } from '@tsed/mongoose';
import { Property, Required } from '@tsed/schema';
import { BaseModel } from '@radoslavirha/tsed-common';
import { CommonUtils } from '@radoslavirha/utils';
import { BaseMongo, MongoCreate, MongoMapper, MongoRepository, MongoUpdate } from '@radoslavirha/tsed-mongoose';

@Model({ collection: 'items', schemaOptions: { timestamps: true } })
class ItemMongo extends BaseMongo {
    @Required() name!: string;
}

class ItemModel extends BaseModel {
    @Property() name!: string;
}

@Injectable()
class ItemMapper extends MongoMapper<ItemMongo, ItemModel> {
    protected mongo = ItemMongo;
    protected model = ItemModel;

    public mongoToModel(mongo: ItemMongo): ItemModel {
        return CommonUtils.buildModelStrict(ItemModel, {
            ...this.mongoToModelBase(mongo),
            name: mongo.name
        });
    }

    public buildMongoCreate(model: ItemModel): MongoCreate<ItemMongo> {
        return this.buildMongoPayload({ name: this.getModelValue(model, 'name') });
    }

    public buildMongoUpdate(model: ItemModel): MongoUpdate<ItemMongo> {
        return this.buildMongoUpdatePayload({ name: this.getModelValue(model, 'name', true) });
    }
}

@Injectable()
class ItemRepository extends MongoRepository<ItemMongo> {
    @Inject(ItemMongo) protected model!: MongooseModel<ItemMongo>;
    protected mongo = ItemMongo;

    public async findAll(): Promise<ItemMongo[]> {
        return this.deserializeArray(await this.model.find().lean().exec());
    }
}
```

## Payload types

`MongoCreate<T>` and `MongoUpdate<T>` strip `id`, `_id`, `createdAt` and `updatedAt`, so the
compiler rejects an attempt to write a field the database owns. `MongoFilter<T>` does the same
for queries. Use them as the return types of your mapper's build methods — that is what keeps
the repository free of casts.

## The repository owns its queries

`MongoRepository` enforces nothing: it supplies the injection point, the document type, and
deserialization helpers (`deserialize`, `deserializeArray`,
`convertHydratedDocumentToObject`). Every `find`, `create`, `update` and `delete` is written by
the subclass. Always pass lean/plain results through the deserialize helpers so callers get
typed class instances rather than plain objects.

## References and populated fields

A `Ref<T>` may hold an id or a populated document. Do not test for that by hand:

- `canBePopulated(value)` — is it safe to treat as populated?
- `getPopulated(value)` — the populated document
- `getIdFromPotentiallyPopulated(value)` — the id, either way

## Migration traps

These signatures changed and the old shapes still circulate:

| Gone | Now |
|---|---|
| `mongoToModelBase(model, mongo)` mutating the model | `mongoToModelBase(mongo)` returning `{ id, createdAt, updatedAt }` to spread |
| `modelToMongoCreateObject` / `modelToMongoUpdateObject` | `buildMongoPayload` / `buildMongoUpdatePayload` |
| `protected type: Type<T> = T` on the repository | `protected mongo = T` |

The package's own JSDoc still shows the removed `type` property in one example. Trust this
skill and the type declarations over that comment.
