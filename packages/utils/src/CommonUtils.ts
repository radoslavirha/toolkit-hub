import _ from 'lodash';

export class CommonUtils {
    public static cloneDeep<T>(obj: T): T {
        return _.cloneDeep(obj);
    }

    public static buildModel<T extends object>(type: { new (): T }, data: Partial<T>): T {
        const instance = new type();
        return Object.assign(instance, data) as T;
    }
}
