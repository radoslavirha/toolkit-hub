import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { PlatformTest } from '@tsed/platform-http/testing';
import SuperTest from 'supertest';
import { BaseServer } from './BaseServer.js';
import { StrictController } from './test/StrictController.js';

type Case = [name: string, send: Record<string, unknown>, status: number, received?: Record<string, unknown>];

const VALID = { rString: 'a', rnString: 'a', rNumber: 1, rnNumber: 1, rBoolean: true, rnBoolean: true };

const bootstrap = async (strict: boolean): Promise<SuperTest.Agent> => {
    await PlatformTest.bootstrap(BaseServer, {
        mount: { '/': [StrictController] },
        requestValidation: { strict }
    } as Partial<TsED.Configuration>)();
    return SuperTest(PlatformTest.callback());
};

describe('RequestValidationPipe', () => {
    afterEach(async () => {
        await PlatformTest.reset();
    });

    describe('requestValidation.strict off (Ts.ED behaviour)', () => {
        let request: SuperTest.Agent;

        beforeEach(async () => {
            request = await bootstrap(false);
        });

        it('should coerce null in a required number body field to 0', async () => {
            const response = await request.post('/strict/body').send({ ...VALID, rNumber: null });

            expect(response.status).toBe(200);
            expect(response.body.body.rNumber).toBe(0);
        });

        it('should coerce a numeric string in a body number field', async () => {
            const response = await request.post('/strict/body').send({ ...VALID, rNumber: '42' });

            expect(response.status).toBe(200);
            expect(response.body.body.rNumber).toBe(42);
        });

        it('should turn any text into true for a boolean query', async () => {
            const response = await request.get('/strict/boolean/o?v=foo');

            expect(response.body.v).toBe(true);
        });
    });

    describe('requestValidation.strict on', () => {
        let request: SuperTest.Agent;

        beforeEach(async () => {
            request = await bootstrap(true);
        });

        describe('body', () => {
            const cases: Case[] = [
                ['valid', {}, 200, VALID],
                ['required number null', { rNumber: null }, 400],
                ['required number as numeric string', { rNumber: '42' }, 400],
                ['required boolean as 1', { rBoolean: 1 }, 400],
                ['required string as boolean', { rString: false }, 400],
                ['required string empty', { rString: '' }, 400],
                ['required string missing', { rString: undefined }, 400],
                ['required nullable string null', { rnString: null }, 200, { rnString: null }],
                ['required nullable string missing', { rnString: undefined }, 400],
                ['required nullable number 0', { rnNumber: 0 }, 200, { rnNumber: 0 }],
                ['required nullable number wrong type', { rnNumber: 'x' }, 400],
                ['required nullable boolean false', { rnBoolean: false }, 200, { rnBoolean: false }],
                ['required nullable boolean 0', { rnBoolean: 0 }, 400],
                ['optional string null', { oString: null }, 400],
                ['optional string empty', { oString: '' }, 200, { oString: '' }],
                ['optional number missing', {}, 200],
                ['optional nullable number null', { onNumber: null }, 200, { onNumber: null }],
                ['optional nullable number 0 is not nulled', { onNumber: 0 }, 200, { onNumber: 0 }],
                ['optional nullable boolean false is not nulled', { onBoolean: false }, 200, { onBoolean: false }],
                ['optional nullable string empty is not nulled', { onString: '' }, 200, { onString: '' }],
                ['optional nullable number wrong type', { onNumber: '1' }, 400],
                ['list with null item', { oList: [null] }, 400],
                ['empty list', { oList: [] }, 200, { oList: [] }]
            ];

            it.each(cases)('%s', async (_name, send, status, received) => {
                const response = await request.post('/strict/body').send({ ...VALID, ...send });

                expect(response.status).toBe(status);
                if (received) {
                    expect(response.body.body).toMatchObject(received);
                }
            });

            it('should keep the ajv-errors / format machinery working in the strict instance', async () => {
                const response = await request.post('/strict/body').send({ ...VALID, rNumber: 'x' });

                expect(response.body.name).toBe('AJV_VALIDATION_ERROR');
            });
        });

        describe('query', () => {
            it('should resolve the schema types once per parameter', async () => {
                await request.get('/strict/boolean/o?v=true');
                const response = await request.get('/strict/boolean/o?v=false');

                expect(response.body.v).toBe(false);
            });

            const cases: [path: string, expectedStatus: number, expectedValue?: unknown][] = [
                ['/strict/number/r', 400],
                ['/strict/number/r?v=', 400],
                ['/strict/number/r?v=null', 400],
                ['/strict/number/r?v=5', 200, 5],
                ['/strict/number/r?v=abc', 400],
                ['/strict/number/rn?v=null', 200, null],
                ['/strict/number/rn', 400],
                ['/strict/number/o?v=null', 400],
                ['/strict/number/o', 200],
                ['/strict/number/on?v=null', 200, null],
                ['/strict/number/on?v=7', 200, 7],
                ['/strict/boolean/o?v=foo', 400],
                ['/strict/boolean/o?v=true', 200, true],
                ['/strict/boolean/o?v=0', 200, false],
                ['/strict/boolean/r?v=1', 200, true],
                ['/strict/boolean/on?v=1', 200, true],
                ['/strict/boolean/on?v=0', 200, false],
                ['/strict/boolean/on?v=null', 200, null],
                ['/strict/boolean/on?v=foo', 400],
                ['/strict/string/o?v=null', 200, 'null'],
                ['/strict/string/o?v=', 200, ''],
                ['/strict/string/on?v=null', 200, null]
            ];

            it.each(cases)('GET %s', async (path, status, value) => {
                const response = await request.get(path);

                expect(response.status).toBe(status);
                if (status === 200) {
                    expect(response.body.v).toStrictEqual(value);
                }
            });
        });
    });
});
