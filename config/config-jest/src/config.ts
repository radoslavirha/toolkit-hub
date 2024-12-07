import type { Config } from 'jest';
import { Coverage90 } from './coverage';

export const config: Config = {
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**'
    ],
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        'index.ts', // barrels
        '/node_modules/'
    ],
    coverageReporters: [
        'clover',
        'json-summary',
        'lcov',
        'text',
        'text-summary', // show in console
        ['text-summary', { file: 'coverage-summary.txt' }] // save in file for CI
    ],
    coverageThreshold: {
        global: Coverage90
    },
    moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
    testEnvironment: 'node',
    testMatch: ['**/src/**/*.spec.ts'],
    transform: {
        '\\.(ts)$': '@swc/jest'
    },
    reporters: [
        'default',
        ['jest-junit', { outputDirectory: 'reports', outputName: 'junit.xml' }],
        ['jest-html-reporters', { publicPath: 'reports', filename: 'report.html', inlineSource: true }]
    ]
};