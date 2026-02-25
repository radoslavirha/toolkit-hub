import { Required, Property } from '@tsed/schema';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { JSONSchemaValidator } from './JSONSchemaValidator.js';

class ValidModel {
    @Required()
    name!: string;

    @Property()
    age?: number;
}

describe('JSONSchemaValidator', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('validate', () => {
        it('returns deserialized instance when input is valid', () => {
            const result = JSONSchemaValidator.validate(ValidModel, { name: 'Alice', age: 30 });

            expect(result).toBeInstanceOf(ValidModel);
            expect(result.name).toBe('Alice');
            expect(result.age).toBe(30);
        });

        it('throws an array of AJV errors when a required field is missing', () => {
            expect.hasAssertions();

            try {
                JSONSchemaValidator.validate(ValidModel, { age: 30 });
            } catch (errors) {
                expect(Array.isArray(errors)).toBe(true);
                expect(errors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ keyword: expect.any(String) })
                    ])
                );
            }
        });

        it('logs raw data and JSON Schema when debug is true', () => {
            JSONSchemaValidator.validate(ValidModel, { name: 'Bob' }, true);

            expect(consoleLogSpy).toHaveBeenCalledWith('Raw data:', expect.any(String));
            expect(consoleLogSpy).toHaveBeenCalledWith('Generated JSON Schema:', expect.any(String));
        });

        it('does not log when debug is false', () => {
            JSONSchemaValidator.validate(ValidModel, { name: 'Bob' });

            expect(consoleLogSpy).not.toHaveBeenCalled();
        });
    });
});
