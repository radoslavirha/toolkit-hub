import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PlatformTest } from '@tsed/platform-http/testing';
import SuperTest from 'supertest';
import { BaseServer } from './BaseServer.js';
import { BODY_TYPES, bodyModelName, COMBOS, type Combo, createMatrixBodyController, received } from './test/MatrixBodyController.js';
import { MatrixQueryController } from './test/MatrixQueryController.js';

/**
 * Request-validation contract, every type × required/optional × nullable (homelab-apps#234).
 *
 * - strict on: each result must match the agreed policy below.
 * - strict off: the result is snapshotted. It documents Ts.ED's own behaviour, and a `@tsed/*`
 *   upgrade that changes it shows up as a snapshot diff instead of going unnoticed.
 */

type Row = { status: number; received?: string; echo?: unknown };

const MatrixBodyController = createMatrixBodyController();
const ISO = '2026-01-01T00:00:00.000Z';

const isRequired = (combo: Combo): boolean => combo.startsWith('R');
const isNullable = (combo: Combo): boolean => combo.endsWith('N');

async function bootstrap(strict: boolean): Promise<SuperTest.Agent> {
    await PlatformTest.bootstrap(BaseServer, {
        mount: { '/': [MatrixBodyController, MatrixQueryController] },
        requestValidation: { strict }
    } as Partial<TsED.Configuration>)();
    return SuperTest(PlatformTest.callback());
}

function bodyInputs(type: (typeof BODY_TYPES)[number]): [label: string, body: Record<string, unknown>][] {
    return [
        ['missing', {}],
        ['null', { v: null }],
        ...type.valid.map(([input]) => [`valid ${JSON.stringify(input)}`, { v: input }] as [string, Record<string, unknown>]),
        ...type.wrong.map(input => [`wrong ${JSON.stringify(input)}`, { v: input }] as [string, Record<string, unknown>])
    ];
}

/** The agreed body policy (strict on). */
function expectedBody(type: (typeof BODY_TYPES)[number], combo: Combo, label: string, body: Record<string, unknown>): Row {
    if (label === 'missing') {
        return isRequired(combo) ? { status: 400 } : { status: 200, received: '<absent>', echo: {} };
    }
    if (label === 'null') {
        return isNullable(combo) ? { status: 200, received: 'null', echo: { v: null } } : { status: 400 };
    }
    if (label.startsWith('wrong')) {
        return { status: 400 };
    }
    // Ts.ED: @Required() on a string implies minLength 1 (kept deliberately: required string = non-empty)
    if (type.key === 'string' && isRequired(combo) && body.v === '') {
        return { status: 400 };
    }
    const [, description] = type.valid.find(([input]) => JSON.stringify(input) === JSON.stringify(body.v)) as [unknown, string];
    return { status: 200, received: description, echo: body };
}

const QUERY_CASES: Record<string, { valid: [string, string][]; wrong: string[] }> = {
    string: { valid: [['x', 'string:x']], wrong: [] },
    number: { valid: [['1.5', 'number:1.5'], ['0', 'number:0']], wrong: ['abc'] },
    integer: { valid: [['2', 'number:2']], wrong: ['1.5', 'abc'] },
    boolean: { valid: [['true', 'boolean:true'], ['false', 'boolean:false'], ['1', 'boolean:true'], ['0', 'boolean:false']], wrong: ['foo', 'TRUE', 'yes'] },
    stringEnum: { valid: [['RED', 'string:RED']], wrong: ['nope'] },
    dateTime: { valid: [[ISO, `Date(${ISO})`]], wrong: ['nope'] }
};

function queryInputs(key: string): [label: string, query: string | undefined][] {
    const { valid, wrong } = QUERY_CASES[key];
    return [
        ['missing', undefined],
        ['empty', ''],
        ['"null"', 'null'],
        ...valid.map(([value]) => [`valid ${value}`, value] as [string, string]),
        ...wrong.map(value => [`wrong ${value}`, value] as [string, string])
    ];
}

/** The agreed query policy (strict on). */
function expectedQuery(key: string, combo: Combo, label: string, query: string | undefined): Row {
    const absent: Row = isRequired(combo) ? { status: 400 } : { status: 200, received: '<undef>' };
    if (label === 'missing') {
        return absent;
    }
    if (label === 'empty') {
        // "" is a value for plain string params (required string = non-empty); typed and nullable params treat it as absent
        if (key === 'string' && !isNullable(combo)) {
            return isRequired(combo) ? { status: 400 } : { status: 200, received: 'string:' };
        }
        if (key === 'stringEnum' && !isNullable(combo)) {
            return { status: 400 };
        }
        return absent;
    }
    if (label === '"null"') {
        if (isNullable(combo)) {
            return { status: 200, received: 'null' };
        }
        return key === 'string' ? { status: 200, received: 'string:null' } : { status: 400 };
    }
    if (label.startsWith('wrong')) {
        return { status: 400 };
    }
    const [, description] = QUERY_CASES[key].valid.find(([value]) => value === query) as [string, string];
    return { status: 200, received: description };
}

describe.each([true, false])('RequestValidationPipe matrix (requestValidation.strict = %s)', strict => {
    let request: SuperTest.Agent;

    beforeAll(async () => {
        request = await bootstrap(strict);
    });
    afterAll(async () => {
        await PlatformTest.reset();
    });

    describe('body', () => {
        it.each(BODY_TYPES.flatMap(type => COMBOS.map(combo => [type.key, combo, type] as const)))('%s %s', async (_key, combo, type) => {
            const actual: Record<string, Row> = {};
            const expected: Record<string, Row> = {};
            for (const [label, body] of bodyInputs(type)) {
                received.last = '<not called>';
                const response = await request.put(`/matrix/${bodyModelName(type, combo)}`).send(body);
                actual[label] = response.status < 400
                    ? { status: response.status, received: received.last, echo: response.body }
                    : { status: response.status };
                expected[label] = expectedBody(type, combo, label, body);
            }
            if (strict) {
                expect(actual).toStrictEqual(expected);
            } else {
                expect(actual).toMatchSnapshot();
            }
        });
    });

    describe('query', () => {
        it.each(Object.keys(QUERY_CASES).flatMap(key => COMBOS.map(combo => [key, combo] as const)))('%s %s', async (key, combo) => {
            const actual: Record<string, Row> = {};
            const expected: Record<string, Row> = {};
            for (const [label, query] of queryInputs(key)) {
                const response = await request.get(`/matrix-query/${key}/${combo}${query === undefined ? '' : `?v=${encodeURIComponent(query)}`}`);
                actual[label] = response.status < 400 ? { status: response.status, received: response.body.v } : { status: response.status };
                expected[label] = expectedQuery(key, combo, label, query);
            }
            if (strict) {
                expect(actual).toStrictEqual(expected);
            } else {
                expect(actual).toMatchSnapshot();
            }
        });
    });
});
