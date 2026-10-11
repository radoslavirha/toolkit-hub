import { MongooseSchema } from '@tsed/mongoose';

/**
 * Disables the implicit default of a Mongoose array path.
 *
 * Mongoose gives every array an implicit `[]` default, so an omitted array is stored as empty.
 * Use this on a nullable array where "not provided" (or `null`) must stay distinct from "empty".
 *
 * `@MongooseSchema({ default: undefined })` does not work: @tsed/mongoose strips `undefined`
 * options. A default function returning `undefined` is kept, which is what this decorator applies.
 *
 * @example
 * ```typescript
 * @Schema({ nullable: true })
 * @CollectionOf(String, Array)
 * @NoDefault()
 * tags?: string[] | null;
 * ```
 */
export function NoDefault(): PropertyDecorator {
    return MongooseSchema({ default: () => undefined }) as PropertyDecorator;
}
