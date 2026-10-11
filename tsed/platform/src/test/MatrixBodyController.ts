import { ArrayOf, EnumMapOf, MapOf, NullableDateTime, NullableEnum, NullableOf } from '@radoslavirha/tsed-common';
import { ArrayUtils, CommonUtils, ObjectUtils } from '@radoslavirha/utils';
import { Controller } from '@tsed/di';
import { BodyParams } from '@tsed/platform-params';
import { AdditionalProperties, DateTime, Enum, Integer, Nullable, Property, Put, Required, Returns } from '@tsed/schema';

/**
 * Body side of the request-validation matrix: every type × required/optional × nullable, declared
 * the way the toolkit recommends. Models are built programmatically — every declaration passes its
 * type explicitly, so nothing depends on `design:type`.
 */

export enum Color {
    Red = 'RED',
    Blue = 'BLUE'
}

export enum Level {
    Low = 1,
    High = 2
}

export class Child {
    @Required()
    @Property(String)
    public name!: string;
}

export type Combo = 'R' | 'RN' | 'O' | 'ON';
export const COMBOS: Combo[] = ['R', 'RN', 'O', 'ON'];

export interface BodyType {
    key: string;
    /** Decorators in source order (outermost first), without `@Required()`. */
    declare(nullable: boolean, combo: Combo): PropertyDecorator[];
    /** Valid inputs and how the handler must see them (see `describeValue`). */
    valid: [input: unknown, received: string][];
    /** Inputs of the wrong JSON type or shape. */
    wrong: unknown[];
}

const ISO = '2026-01-01T00:00:00.000Z';

export const BODY_TYPES: BodyType[] = [
    { key: 'string', declare: n => [n ? Nullable(String) : Property(String)], valid: [['x', 'string:x'], ['', 'string:']], wrong: [0, 42, false, {}, []] },
    { key: 'number', declare: n => [n ? Nullable(Number) : Property(Number)], valid: [[1.5, 'number:1.5'], [0, 'number:0']], wrong: ['5', '', false, true, {}] },
    { key: 'integer', declare: n => (n ? [Nullable(Number), Integer()] : [Integer()]), valid: [[2, 'number:2'], [0, 'number:0']], wrong: [1.5, '2', false] },
    { key: 'boolean', declare: n => [n ? Nullable(Boolean) : Property(Boolean)], valid: [[true, 'boolean:true'], [false, 'boolean:false']], wrong: [0, 1, '', 'true'] },
    { key: 'dateTime', declare: n => (n ? [NullableDateTime()] : [Property(Date), DateTime()]), valid: [[ISO, `Date(${ISO})`]], wrong: ['nope', '', '2026-01-01', 0] },
    { key: 'stringEnum', declare: n => [n ? NullableEnum(Color) : Enum(Color)], valid: [['RED', 'string:RED']], wrong: ['nope', '', 0] },
    { key: 'numericEnum', declare: n => [n ? NullableEnum(Level) : Enum(Level)], valid: [[1, 'number:1']], wrong: [3, '1', 0] },
    { key: 'model', declare: n => [n ? NullableOf(Child) : Property(Child)], valid: [[{ name: 'x' }, 'Child{name:string:x}']], wrong: [false, 0, '', 'x', [], {}] },
    { key: 'stringArray', declare: n => [ArrayOf(String, { nullable: n })], valid: [[['a'], '[string:a]'], [[], '[]']], wrong: ['a', 0, {}, [1], [null]] },
    { key: 'modelArray', declare: n => [ArrayOf(Child, { nullable: n })], valid: [[[{ name: 'x' }], '[Child{name:string:x}]'], [[], '[]']], wrong: ['a', {}, [1], [null], [{}]] },
    { key: 'map', declare: n => [MapOf(Number, { nullable: n })], valid: [[{ a: 1 }, 'Map{a:number:1}'], [{}, 'Map{}']], wrong: [{ a: '1' }, { a: null }, [], 'x'] },
    { key: 'modelMap', declare: n => [MapOf(Child, { nullable: n })], valid: [[{ a: { name: 'x' } }, 'Map{a:Child{name:string:x}}']], wrong: [{ a: {} }, { a: null }, { a: 1 }, []] },
    {
        key: 'enumMap',
        declare: (n, combo) => [EnumMapOf(Color, Number, { name: `MatrixColorCounts${combo}`, nullable: n })],
        valid: [[{ RED: 1, BLUE: 2 }, 'ColorCounts{RED:number:1,BLUE:number:2}']],
        wrong: [{ RED: 1 }, { RED: 1, BLUE: 2, GREEN: 3 }, { RED: '1', BLUE: 2 }, { RED: null, BLUE: 2 }, []]
    }
];

/** Compact, comparable description of what a handler received. */
export function describeValue(value: unknown): string {
    if (CommonUtils.isUndefined(value)) {
        return '<undef>';
    }
    if (CommonUtils.isNull(value)) {
        return 'null';
    }
    if (ObjectUtils.isDate(value)) {
        const date = value as Date;
        return Number.isNaN(date.getTime()) ? 'Date(Invalid)' : `Date(${date.toISOString()})`;
    }
    if (value instanceof Map) {
        return `Map{${[...value.entries()].map(([k, v]) => `${String(k)}:${describeValue(v)}`).join(',')}}`;
    }
    if (ArrayUtils.isArray(value)) {
        return `[${value.map(describeValue).join(',')}]`;
    }
    if (typeof value === 'object') {
        const object = value as object;
        const name = object.constructor.name.replace(/^MatrixColorCounts(R|RN|O|ON)$/, 'ColorCounts');
        return `${name}{${Object.entries(object).map(([k, v]) => `${k}:${describeValue(v)}`).join(',')}}`;
    }
    return `${typeof value}:${String(value)}`;
}

export function bodyModelName(type: BodyType, combo: Combo): string {
    return `Matrix_${type.key}_${combo}`;
}

function bodyModel(type: BodyType, combo: Combo): new () => object {
    const name = bodyModelName(type, combo);
    const model = { [name]: class {} }[name];
    // decorators run bottom-up in source order, so apply the innermost first
    for (const decorator of [...type.declare(combo.endsWith('N'), combo)].reverse()) {
        decorator(model.prototype, 'v');
    }
    if (combo.startsWith('R')) {
        Required()(model.prototype, 'v');
    }
    AdditionalProperties(false)(model);
    return model;
}

export const received = { last: '<not called>' as string };

/** One `PUT /matrix/<model>` per model; echoes the body so serialization is covered too. */
export function createMatrixBodyController(): new () => object {
    const controller = class MatrixBodyController {};
    for (const type of BODY_TYPES) {
        for (const combo of COMBOS) {
            const model = bodyModel(type, combo);
            const name = bodyModelName(type, combo);
            Object.defineProperty(controller.prototype, name, {
                value: function (body: { v?: unknown }): object {
                    received.last = Object.prototype.hasOwnProperty.call(body, 'v') ? describeValue(body.v) : '<absent>';
                    return body;
                },
                writable: true,
                configurable: true
            });
            BodyParams(model)(controller.prototype, name, 0);
            const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, name) as PropertyDescriptor;
            Put(`/${name}`)(controller.prototype, name, descriptor);
            Returns(200, model)(controller.prototype, name, descriptor);
        }
    }
    Controller('/matrix')(controller);
    return controller;
}
