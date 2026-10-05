import { DiscriminatorKey, DiscriminatorValue, OneOf, Property, Required } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { JSONSchemaValidator } from './JSONSchemaValidator.js';

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
    describe('validate', () => {
        it('returns the discriminated subtype for a model using @DiscriminatorKey', () => {
            const result = JSONSchemaValidator.validate(EventEnvelope, { event: { type: 'click', x: 1 } });

            expect(result.event).toBeInstanceOf(ClickEvent);
        });

        it('throws AJV errors for an unknown discriminator value', () => {
            expect(() => JSONSchemaValidator.validate(EventEnvelope, { event: { type: 'scroll' } }))
                .toThrow(expect.arrayContaining([expect.objectContaining({ instancePath: '/event' })]) as never);
        });
    });
});
