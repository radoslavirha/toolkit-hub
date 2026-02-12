import { describe, expect, it } from 'vitest';
import { PackageJsonProvider } from './PackageJsonProvider.js';

describe('PackageJsonProvider', () => {
    describe('Package.json loading', () => {
        it('Should load package.json metadata', () => {
            const provider = new PackageJsonProvider();
            const pkg = provider.config;

            // Should load actual package.json from the project
            expect(pkg.name).toBe('@radoslavirha/tsed-configuration');
            expect(pkg.version).toBeDefined();
            expect(typeof pkg.version).toBe('string');
            expect(pkg.description).toBe('Ts.ED server configuration');
        });

        it('Should have semantic version format', () => {
            const provider = new PackageJsonProvider();
            const pkg = provider.config;

            // Semantic version pattern (simplified)
            const semverPattern = /^\d+\.\d+\.\d+/;
            expect(pkg.version).toMatch(semverPattern);
        });

        it('Should have required fields', () => {
            const provider = new PackageJsonProvider();
            const pkg = provider.config;

            expect(pkg).toHaveProperty('name');
            expect(pkg).toHaveProperty('version');
            expect(pkg).toHaveProperty('description');

            expect(pkg.name).toBeTruthy();
            expect(pkg.version).toBeTruthy();
            // Description might be empty string but should be defined
            expect(pkg.description).toBeDefined();
        });
    });

    describe('Immutability', () => {
        it('Should return immutable configuration', () => {
            const provider = new PackageJsonProvider();
            const pkg1 = provider.config;

            // Store original values
            const originalName = pkg1.name;
            const originalVersion = pkg1.version;
            const originalDescription = pkg1.description;

            // Try to mutate
            pkg1.name = 'modified-name';
            pkg1.version = '999.999.999';
            pkg1.description = 'modified description';

            // Get a fresh copy
            const pkg2 = provider.config;

            // Original values should be preserved
            expect(pkg2.name).toBe(originalName);
            expect(pkg2.version).toBe(originalVersion);
            expect(pkg2.description).toBe(originalDescription);
        });

        it('Should return different instances on each access', () => {
            const provider = new PackageJsonProvider();
            const pkg1 = provider.config;
            const pkg2 = provider.config;

            // Should be different instances
            expect(pkg1).not.toBe(pkg2);
            
            // But with same values
            expect(pkg1).toEqual(pkg2);
        });
    });

    describe('Type safety', () => {
        it('Should provide type-safe access', () => {
            const provider = new PackageJsonProvider();
            const pkg = provider.config;

            // TypeScript should ensure these are strings
            const name: string = pkg.name;
            const version: string = pkg.version;
            const description: string = pkg.description;

            expect(typeof name).toBe('string');
            expect(typeof version).toBe('string');
            expect(typeof description).toBe('string');
        });

        it('Should match PkgJson interface structure', () => {
            const provider = new PackageJsonProvider();
            const pkg = provider.config;

            // Should only have the three expected properties
            const keys = Object.keys(pkg);
            expect(keys).toContain('name');
            expect(keys).toContain('version');
            expect(keys).toContain('description');
            expect(keys.length).toBe(3);
        });
    });

    describe('Reusability', () => {
        it('Should provide consistent data across multiple instances', () => {
            const provider1 = new PackageJsonProvider();
            const provider2 = new PackageJsonProvider();

            const pkg1 = provider1.config;
            const pkg2 = provider2.config;

            // Different providers should load the same package.json
            expect(pkg1.name).toBe(pkg2.name);
            expect(pkg1.version).toBe(pkg2.version);
            expect(pkg1.description).toBe(pkg2.description);
        });

        it('Should maintain consistency across multiple reads', () => {
            const provider = new PackageJsonProvider();

            const read1 = provider.config;
            const read2 = provider.config;
            const read3 = provider.config;

            // All reads should return the same values
            expect(read1).toEqual(read2);
            expect(read2).toEqual(read3);
        });
    });
});
