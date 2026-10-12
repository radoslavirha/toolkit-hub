import { Linter } from 'eslint';
import { parser } from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import Nullable, { storageDtoRules } from './nullable.mjs';

function lint(code: string, config: Linter.Config[] = Nullable as Linter.Config[], filename = 'model.ts'): string[] {
    const linter = new Linter();
    const messages = linter.verify(code, [{ files: ['**/*.ts'], languageOptions: { parser } }, ...config], filename);
    return messages.map(message => message.message);
}

const model = (decorators: string, property: string): string => `class A { ${decorators} ${property} }`;

describe('nullable rules', () => {
    describe('property-needs-type', () => {
        it('reports a bare @Property() on a nullable property', () => {
            expect(lint(model('@Property()', 'a!: B | null;'))).toHaveLength(1);
        });

        it('accepts @Property() on a non-nullable property', () => {
            expect(lint(model('@Property()', 'a!: B;'))).toStrictEqual([]);
        });

        it('accepts @Property(B) and NullableOf on a nullable property', () => {
            expect(lint(model('@Property(B)', 'a!: B | null;'))).toStrictEqual([]);
            expect(lint(model('@NullableOf(B)', 'a!: B | null;'))).toStrictEqual([]);
        });

        it('ignores null nested in a generic argument', () => {
            expect(lint(model('@Property()', 'a!: Foo<null>;'))).toStrictEqual([]);
        });
    });

    describe('collection-of-needs-type', () => {
        it('reports @CollectionOf(X) on a nullable property', () => {
            expect(lint(model('@CollectionOf(B)', 'a!: B[] | null;'))).toHaveLength(1);
        });

        it('accepts @CollectionOf(X) on a non-nullable property and with a collection type', () => {
            expect(lint(model('@CollectionOf(B)', 'a!: B[];'))).toStrictEqual([]);
            expect(lint(model('@CollectionOf(B)', 'a!: Map<string, B> | null;').replace('(B)', '(B, Map)'))).toStrictEqual([]);
        });
    });

    describe('no-allow-null', () => {
        it('reports @Allow(null)', () => {
            expect(lint(model('@Allow(null)', 'a!: string | null;'))).toHaveLength(1);
        });

        it('accepts @Allow with another argument', () => {
            expect(lint(model('@Allow("")', 'a!: string;'))).toStrictEqual([]);
        });
    });

    describe('no-nullable-array', () => {
        it('reports @Nullable(Array)', () => {
            expect(lint(model('@Nullable(Array)', 'a!: string[] | null;'))).toHaveLength(1);
        });

        it('accepts @Nullable(String)', () => {
            expect(lint(model('@Nullable(String)', 'a!: string | null;'))).toStrictEqual([]);
        });
    });

    describe('storageDtoRules', () => {
        const storage = [...Nullable, ...storageDtoRules(['storage/**/*.ts'])] as Linter.Config[];

        it('reports @Nullable on a scalar in a storage folder', () => {
            expect(lint(model('@Nullable(String)', 'a!: string | null;'), storage, 'storage/dto.ts')).toHaveLength(1);
            expect(lint(model('@Nullable(Date)', 'a!: Date | null;'), storage, 'storage/dto.ts')).toHaveLength(1);
        });

        it('does not report it outside the storage folder', () => {
            expect(lint(model('@Nullable(String)', 'a!: string | null;'), storage, 'domain/model.ts')).toStrictEqual([]);
        });

        it('is off unless enabled', () => {
            expect(lint(model('@Nullable(String)', 'a!: string | null;'), Nullable as Linter.Config[], 'storage/dto.ts')).toStrictEqual([]);
        });
    });
});
