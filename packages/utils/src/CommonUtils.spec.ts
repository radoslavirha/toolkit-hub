import { describe, expect, it } from 'vitest';
import { CommonUtils } from './CommonUtils.js';

describe('CommonUtils', () => {

    describe('isEmpty', () => {
        it('check empty object', async () => {
            const response = CommonUtils.isEmpty({});

            expect(response).toBeTruthy();
        });

        it('check non-empty object', async () => {
            const response = CommonUtils.isEmpty({ key: 'value' });

            expect(response).toBeFalsy();
        });

        it('check empty array', async () => {
            const response = CommonUtils.isEmpty([]);

            expect(response).toBeTruthy();
        });

        it('check non-empty array', async () => {
            const response = CommonUtils.isEmpty([1, 2, 3]);

            expect(response).toBeFalsy();
        });

        it('check empty string', async () => {
            const response = CommonUtils.isEmpty('');

            expect(response).toBeTruthy();
        });

        it('check non-empty string', async () => {
            const response = CommonUtils.isEmpty('string');

            expect(response).toBeFalsy();
        });
    });

    describe('isNil', () => {
        it('check null', async () => {
            const response = CommonUtils.isNil(null);

            expect(response).toBeTruthy();
        });

        it('check undefined', async () => {
            const response = CommonUtils.isNil(undefined);

            expect(response).toBeTruthy();
        });

        it('check non-nil value', async () => {
            const response = CommonUtils.isNil('string');

            expect(response).toBeFalsy();
        });
    });

    describe('notNil', () => {
        it('check null', async () => {
            const response = CommonUtils.notNil(null);

            expect(response).toBeFalsy();
        });

        it('check undefined', async () => {
            const response = CommonUtils.notNil(undefined);

            expect(response).toBeFalsy();
        });

        it('check non-nil value', async () => {
            const response = CommonUtils.notNil('string');

            expect(response).toBeTruthy();
        });
    });

    describe('isNull', () => {
        it('check number', async () => {
            const response = CommonUtils.isNull(24);

            expect(response).toBeFalsy();
        });

        it('check boolean', async () => {
            const response = CommonUtils.isNull(true);

            expect(response).toBeFalsy();
        });

        it('check undefined', async () => {
            const response = CommonUtils.isNull(undefined);

            expect(response).toBeFalsy();
        });

        it('check null', async () => {
            const response = CommonUtils.isNull(null);

            expect(response).toBeTruthy();
        });
    });

    describe('notNull', () => {
        it('check string', async () => {
            const response = CommonUtils.notNull('string');

            expect(response).toBeTruthy();
        });

        it('check number', async () => {
            const response = CommonUtils.notNull(24);

            expect(response).toBeTruthy();
        });

        it('check boolean', async () => {
            const response = CommonUtils.notNull(true);

            expect(response).toBeTruthy();
        });

        it('check undefined', async () => {
            const response = CommonUtils.notNull(undefined);

            expect(response).toBeTruthy();
        });

        it('check null', async () => {
            const response = CommonUtils.notNull(null);

            expect(response).toBeFalsy();
        });
    });

    describe('isUndefined', () => {

        it('check string', async () => {
            const response = CommonUtils.isUndefined('string');

            expect(response).toBeFalsy();
        });

        it('check number', async () => {
            const response = CommonUtils.isUndefined(24);

            expect(response).toBeFalsy();
        });

        it('check boolean', async () => {
            const response = CommonUtils.isUndefined(true);

            expect(response).toBeFalsy();
        });

        it('check null', async () => {
            const response = CommonUtils.isUndefined(null);

            expect(response).toBeFalsy();
        });

        it('check undefined', async () => {
            const response = CommonUtils.isUndefined(undefined);

            expect(response).toBeTruthy();
        });
    });

    describe('notUndefined', () => {
        it('check string', async () => {
            const response = CommonUtils.notUndefined('string');

            expect(response).toBeTruthy();
        });

        it('check number', async () => {
            const response = CommonUtils.notUndefined(24);

            expect(response).toBeTruthy();
        });

        it('check boolean', async () => {
            const response = CommonUtils.notUndefined(true);

            expect(response).toBeTruthy();
        });

        it('check null', async () => {
            const response = CommonUtils.notUndefined(null);

            expect(response).toBeTruthy();
        });

        it('check undefined', async () => {
            const response = CommonUtils.notUndefined(undefined);

            expect(response).toBeFalsy();
        });
    });

    describe('buildModel', () => {
        class TestModel {
            public property!: string;
        }

        it('should build model', async () => {
            const model = CommonUtils.buildModel(TestModel, { property: 'value 1' });

            expect(model).toBeInstanceOf(TestModel);
            expect(model.property).toEqual('value 1');
        });
    });
});
