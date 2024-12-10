import stylisticPlugin from '@stylistic/eslint-plugin';
import { config, configs } from 'typescript-eslint';

const ignores = ['coverage/**', 'dist/**', 'node_modules/**'];

export default config(
    { ignores },
    ...configs.recommended, // Apply recommended TS rules
    {
        files: ['**/*.js', '**/*.ts'],
        plugins: {
            '@stylistic': stylisticPlugin
        },
        rules: {
            'eqeqeq': ['error', 'always'],
            '@typescript-eslint/no-inferrable-types': 0,
            '@typescript-eslint/no-unused-vars': 2,
            '@typescript-eslint/no-var-requires': 0,
            '@typescript-eslint/no-non-null-assertion': 0,
            '@stylistic/array-bracket-spacing': ['error', 'never'],
            '@stylistic/brace-style': ['error', '1tbs'],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/key-spacing': ['error', { beforeColon: false }],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
            '@stylistic/indent': ['error', 4],
            '@stylistic/no-whitespace-before-property': 'error',
            '@stylistic/object-curly-spacing': ['error', 'always']
        }
    }
);
