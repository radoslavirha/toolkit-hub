import { DiscriminatorKey, DiscriminatorValue, OneOf, Property, Required } from '@tsed/schema';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BaseModel } from '../models/BaseModel.js';
import { JSONSchemaValidator } from './JSONSchemaValidator.js';

class ValidModel {
    @Required()
    name!: string;

    @Property()
    age?: number;
}

class UserModel extends BaseModel {
    @Required()
    name!: string;
}

class Event {
    @DiscriminatorKey()
    type!: string;
}

@DiscriminatorValue('click')
class ClickEvent extends Event {
    @Required()
    x!: number;
}

@DiscriminatorValue('key')
class KeyEvent extends Event {
    @Property()
    key!: string;
}

class EventEnvelope {
    @OneOf(ClickEvent, KeyEvent)
    @Required()
    event!: ClickEvent | KeyEvent;
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
                expect(errors).toStrictEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ keyword: expect.any(String) })
                    ])
                );
            }
        });

        it('returns the instance for a valid BaseModel subclass', () => {
            const result = JSONSchemaValidator.validate(UserModel, {
                id: '1',
                name: 'Alice',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z'
            });

            expect(result).toBeInstanceOf(UserModel);
            expect(result.name).toBe('Alice');
            expect(result.createdAt).toBeInstanceOf(Date);
        });

        it('throws an array of AJV errors when a date-time field is not a valid date-time', () => {
            expect.hasAssertions();

            try {
                JSONSchemaValidator.validate(UserModel, {
                    id: '1',
                    name: 'Alice',
                    createdAt: 'not-a-date',
                    updatedAt: '2026-01-01T00:00:00.000Z'
                });
            } catch (errors) {
                expect(errors).toStrictEqual([
                    expect.objectContaining({ keyword: 'format', instancePath: '/createdAt' })
                ]);
            }
        });

        it('returns the discriminated subtype for a model using @DiscriminatorKey', () => {
            const result = JSONSchemaValidator.validate(EventEnvelope, { event: { type: 'click', x: 1 } });

            expect(result.event).toBeInstanceOf(ClickEvent);
        });

        it('throws AJV errors for an unknown discriminator value', () => {
            expect(() => JSONSchemaValidator.validate(EventEnvelope, { event: { type: 'scroll' } }))
                .toThrow(expect.arrayContaining([expect.objectContaining({ instancePath: '/event' })]) as never);
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
