import { z } from 'zod';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ZodValidator } from './ZodValidator.js';

const ValidSchema = z.object({
    name: z.string(),
    age: z.number().optional()
});

describe('ZodValidator', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('validate', () => {
        it('returns validated value when input is valid', () => {
            const result = ZodValidator.validate(ValidSchema, { name: 'Alice', age: 30 });

            expect(result.name).toBe('Alice');
            expect(result.age).toBe(30);
        });

        it('strips unknown fields (Zod default strip mode)', () => {
            const result = ZodValidator.validate(ValidSchema, { name: 'Alice', extra: 'ignored' });

            expect(result.name).toBe('Alice');
            expect((result as Record<string, unknown>).extra).toBeUndefined();
        });

        it('throws when a required field is missing', () => {
            expect(() => ZodValidator.validate(ValidSchema, { age: 30 })).toThrow();
        });

        it('thrown error has an issues array', () => {
            expect.hasAssertions();

            try {
                ZodValidator.validate(ValidSchema, { age: 30 });
            } catch (error) {
                expect(error).toEqual(
                    expect.objectContaining({
                        issues: expect.arrayContaining([
                            expect.objectContaining({ message: expect.any(String) })
                        ])
                    })
                );
            }
        });

        it('does not log when debug is false', () => {
            ZodValidator.validate(ValidSchema, { name: 'Bob' });

            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('logs raw data and schema description when debug is true', () => {
            const schema = ValidSchema.describe('ValidSchema');

            ZodValidator.validate(schema, { name: 'Bob' }, true);

            expect(consoleLogSpy).toHaveBeenCalledWith('Raw data:', expect.any(String));
        });

        it('works with z.union for conditional required fields', () => {
            const MqttSchema = z.union([
                z.object({ enabled: z.literal(true), url: z.string() }),
                z.object({ enabled: z.literal(false).optional(), url: z.string().optional() })
            ]);

            const enabled = ZodValidator.validate(MqttSchema, { enabled: true, url: 'mqtt://host' });
            expect(enabled.enabled).toBe(true);

            const disabled = ZodValidator.validate(MqttSchema, { enabled: false });
            expect(disabled.enabled).toBe(false);
            expect(disabled.url).toBeUndefined();

            const omitted = ZodValidator.validate(MqttSchema, {});
            expect(omitted.enabled).toBeUndefined();

            expect(() => ZodValidator.validate(MqttSchema, { enabled: true })).toThrow();
        });
    });
});
