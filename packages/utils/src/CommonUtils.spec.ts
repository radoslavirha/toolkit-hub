import { describe, expect, it } from 'vitest';
import { CommonUtils } from './CommonUtils.js';

describe('CommonUtils', () => {
    describe('cloneDeep', () => {
        class TestModel {
            public property: string;

            constructor(property: string) {
                this.property = property;
            }
        }

        it('should deeply clone', async () => {
            const model = new TestModel('value 1');

            const clone = CommonUtils.cloneDeep(model);

            expect(clone).toBeInstanceOf(TestModel);
            expect(clone.property).toEqual('value 1');

            model.property = 'value 2';

            expect(clone.property).toEqual('value 1');
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

        it('check empty', async () => {
            const response = CommonUtils.isUndefined();

            expect(response).toBeTruthy();
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
