import { describe, expect, it } from 'vitest';
import { LogErrorUtils } from './LogErrorUtils.js';

describe('LogErrorUtils', () => {
    describe('toFields', () => {
        it('returns the error name, message and stack', () => {
            const error = new TypeError('card declined');

            expect(LogErrorUtils.toFields(error)).toEqual({
                error_name: 'TypeError',
                error_message: 'card declined',
                error_stack: error.stack
            });
        });

        it('omits the stack when stack is false', () => {
            expect(LogErrorUtils.toFields(new Error('card declined'), { stack: false })).not.toHaveProperty('error_stack');
        });

        it('falls back to error.code when name is missing', () => {
            const error = Object.assign(new Error('missing'), { name: undefined, code: 'ENOENT' }) as unknown as Error & { code: string };

            expect(LogErrorUtils.toFields(error).error_name).toBe('ENOENT');
        });

        it('does not copy other own properties of the error', () => {
            const error = Object.assign(new Error('failed'), { headers: { authorization: 'secret' } });

            expect(LogErrorUtils.toFields(error)).not.toHaveProperty('headers');
        });
    });
});
