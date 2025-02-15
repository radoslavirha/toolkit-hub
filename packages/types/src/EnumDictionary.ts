export type EnumDictionary<TKey extends string | symbol | number, TType> = { [key in TKey]: TType };
