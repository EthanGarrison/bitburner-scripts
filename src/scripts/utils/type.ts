
export const isDefined = (o: any) => o != null && typeof o != "undefined"

export const isIterable = (o: any) => isDefined(o) && typeof o[Symbol.iterator] == "function"

export const isString = (o: any) => isDefined(o) && typeof o == "string"
