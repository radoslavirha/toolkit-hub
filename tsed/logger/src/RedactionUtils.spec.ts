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
    });
});
