
const isDefined = (o: any) => o != null && typeof o != "undefined"

const isIterable = (o: any) => isDefined(o) && typeof o[Symbol.iterator] == "function"

const isString = (o: any) => isDefined(o) && typeof o == "string"

export { isDefined, isIterable, isString }
