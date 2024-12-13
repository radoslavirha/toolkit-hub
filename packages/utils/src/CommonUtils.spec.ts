import { describe, expect, it } from 'vitest';
import { CommonUtils } from './CommonUtils';

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
});
