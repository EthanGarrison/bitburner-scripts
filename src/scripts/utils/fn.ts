
/**
 * Given a list of fns, apply them to each other from right to left (or last to first)
 */
const compose = (...fns: Function[]) => (x: any) => (fns.reduceRight((acc, fn) => (_: any) => fn(acc(_)), (_: any) => _))(x)

const identity = <I>(_: I) => _

const empty = () => {}

export { compose, identity, empty }
