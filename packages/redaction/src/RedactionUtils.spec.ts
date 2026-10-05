import { describe, expect, it } from 'vitest';

import { RedactionUtils } from './RedactionUtils.js';

describe('RedactionUtils', () => {
    describe('stringifyForLog', () => {
        it('returns original string values unchanged', () => {
            expect(RedactionUtils.stringifyForLog('plain-string')).toBe('plain-string');
        });

        it('returns [[ UNSERIALIZABLE ]] for circular objects', () => {
            const circular: Record<string, unknown> = {};
            circular['self'] = circular;

            expect(RedactionUtils.stringifyForLog(circular)).toBe('[[ UNSERIALIZABLE ]]');
        });

        it('falls back to String(value) when JSON serialization returns undefined', () => {
            const value = Symbol('secret');

            expect(RedactionUtils.stringifyForLog(value)).toBe(String(value));
        });
    });

    describe('compileRedactor', () => {
        it('returns serializer function for empty selector list', () => {
            const redactor = RedactionUtils.compileRedactor([]);

            expect(redactor({ value: 1 })).toBe('{"value":1}');
            expect(redactor('text')).toBe('text');
        });

        it('redacts configured paths inside BOM-prefixed JSON text', () => {
            const redactor = RedactionUtils.compileRedactor(['access_token']);

            expect(redactor('\uFEFF{"access_token":"live-secret"}')).toBe('{"access_token":"***"}');
        });

        it('rejects malformed selectors', () => {
            expect(() => {
                RedactionUtils.compileRedactor(['user..id']);
            }).toThrow();
        });

        it('redacts explicit nested paths and wildcard paths', () => {
            const source = {
                user: {
                    id: 'u-1',
                    profile: {
                        password: 'secret'
                    }
                },
                items: [
                    { token: 'a' },
                    { token: 'b' }
                ]
            };

            const redactor = RedactionUtils.compileRedactor(['user.profile.password', 'items.*.token']);
            const parsed = JSON.parse(redactor(source)) as Record<string, unknown>;
            const parsedUser = parsed['user'] as Record<string, unknown>;
            const parsedProfile = parsedUser['profile'] as Record<string, unknown>;
            const parsedItems = parsed['items'] as Array<Record<string, unknown>>;

            expect(parsedProfile['password']).toBe('***');
            expect(parsedItems[0]['token']).toBe('***');
            expect(parsedItems[1]['token']).toBe('***');
        });

        it('redacts root-level keys only for single-segment selectors', () => {
            const source = {
                token: 'root',
                nested: {
                    token: 'nested'
                }
            };

            const redactor = RedactionUtils.compileRedactor(['token']);

            expect(redactor(source)).toBe('{"token":"***","nested":{"token":"nested"}}');
        });

        it('supports wildcard paths that redact whole array elements', () => {
            const redactor = RedactionUtils.compileRedactor(['items.*']);

            expect(redactor({
                items: [
                    { token: 'a' },
                    { token: 'b' }
                ]
            })).toBe('{"items":["***","***"]}');
        });

        it('reuses wildcard selector branches for multiple wildcard paths', () => {
            const redactor = RedactionUtils.compileRedactor(['items.*.token', 'items.*.secret']);

            expect(redactor({
                items: [
                    { token: 'a', secret: 'x' },
                    { token: 'b', secret: 'y' }
                ]
            })).toBe('{"items":[{"token":"***","secret":"***"},{"token":"***","secret":"***"}]}');
        });

        it('keeps unmatched array elements and primitive tails unchanged', () => {
            const redactor = RedactionUtils.compileRedactor(['items[0].id', 'value.id']);

            expect(redactor({
                items: [
                    { id: '1' },
                    { id: '2' }
                ],
                value: 5
            })).toBe('{"items":[{"id":"***"},{"id":"2"}],"value":5}');
        });

        it('handles circular and shared references during redaction', () => {
            const shared: Record<string, unknown> = {
                id: 'shared'
            };
            const redactor = RedactionUtils.compileRedactor(['list.*.id']);

            expect(redactor({ list: [shared, shared] })).toBe('{"list":[{"id":"***"},{"id":"***"}]}');

            const cyclic: unknown[] = [];
            cyclic.push(cyclic);

            expect(redactor({ payload: cyclic })).toBe('[[ UNSERIALIZABLE ]]');
        });

        it('redacts paths inside frozen objects nested in a writable value', () => {
            const redactor = RedactionUtils.compileRedactor(['user.password', 'items.*.token']);

            expect(redactor({
                user: Object.freeze({ id: 'u-1', password: 'secret' }),
                items: Object.freeze([Object.freeze({ token: 'a' })])
            })).toBe('{"user":{"id":"u-1","password":"***"},"items":[{"token":"***"}]}');
        });

        it('does not modify a frozen input while redacting it', () => {
            const source = Object.freeze({ password: 'secret' });
            const redactor = RedactionUtils.compileRedactor(['password']);

            expect(redactor(source)).toBe('{"password":"***"}');
            expect(source.password).toBe('secret');
        });

        it('serialises a frozen value that JSON cannot represent like an unfrozen one', () => {
            const redactor = RedactionUtils.compileRedactor(['password']);

            expect(redactor(Object.freeze({ big: 1n }))).toBe('[[ UNSERIALIZABLE ]]');
            expect(redactor(Object.freeze({ toJSON: () => undefined }))).toBe('[object Object]');
        });

        it('redacts a non-writable own property', () => {
            const value = { user: 'ada' };
            Object.defineProperty(value, 'password', { value: 'hunter2', enumerable: true, writable: false });
            const redactor = RedactionUtils.compileRedactor(['password']);

            expect(redactor(value)).toBe('{"user":"ada","password":"***"}');
        });

        it('redacts a getter-only own property', () => {
            const value = {
                user: 'ada',
                get password() {
                    return 'hunter2';
                }
            };
            const redactor = RedactionUtils.compileRedactor(['password']);

            expect(redactor(value)).toBe('{"user":"ada","password":"***"}');
        });

        it('redacts the output of toJSON', () => {
            const value = { toJSON: () => ({ user: 'ada', password: 'hunter2' }) };
            const redactor = RedactionUtils.compileRedactor(['password']);

            expect(redactor(value)).toBe('{"user":"ada","password":"***"}');
        });

        it('redacts configured paths inside a JSON object or array string', () => {
            const redactor = RedactionUtils.compileRedactor(['password', '*.token']);

            expect(redactor('{"user":"ada","password":"hunter2"}')).toBe('{"user":"ada","password":"***"}');
            expect(redactor('[{"token":"a"},{"id":1}]')).toBe('[{"token":"***"},{"id":1}]');
        });

        it('returns non-JSON and JSON primitive strings unchanged', () => {
            const redactor = RedactionUtils.compileRedactor(['token']);

            expect(redactor('a=1&token=x')).toBe('a=1&token=x');
            expect(redactor('"token"')).toBe('"token"');
            expect(redactor('42')).toBe('42');
            expect(redactor('null')).toBe('null');
            expect(redactor('')).toBe('');
        });

        it('leaves strings untouched when no paths are configured', () => {
            const redactor = RedactionUtils.compileRedactor([]);

            expect(redactor('{ "password": "hunter2" }')).toBe('{ "password": "hunter2" }');
        });

        it('handles recursive array and object references while traversing matching paths', () => {
            const cyclicArray: unknown[] = [];
            cyclicArray.push(cyclicArray);

            const cyclicObject: Record<string, unknown> = {};
            cyclicObject['self'] = cyclicObject;

            const redactor = RedactionUtils.compileRedactor(['payload[0].id', 'node.self.id']);

            expect(redactor({
                payload: cyclicArray,
                node: cyclicObject
            })).toBe('[[ UNSERIALIZABLE ]]');
        });

        it('preserves integers beyond Number.MAX_SAFE_INTEGER in JSON text', () => {
            const redactor = RedactionUtils.compileRedactor(['token']);

            expect(redactor('{"id":1234567890123456789,"token":"x","n":[9007199254740993,1.5,2]}'))
                .toBe('{"id":1234567890123456789,"token":"***","n":[9007199254740993,1.5,2]}');
        });

        it('still redacts an unsafe integer that is itself selected', () => {
            const redactor = RedactionUtils.compileRedactor(['id']);

            expect(redactor('{"id":1234567890123456789}')).toBe('{"id":"***"}');
        });
    });
});
