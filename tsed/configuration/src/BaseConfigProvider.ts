import { CommonUtils } from '@radoslavirha/utils';

export class BaseConfigProvider<T> {
    private configuration: T;

    public get config(): T {
        return CommonUtils.cloneDeep(this.configuration);
    }

    constructor(config: T) {
        this.configuration = config;
    }
}
