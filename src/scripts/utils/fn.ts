type AnonFn = (_: any) => any
type Predicate<I> = (_: I) => boolean

/**
 * Given a list of fns, apply them to each other from right to left (or last to first)
 */
const compose = (...fns: AnonFn[]): AnonFn => fns.reduceRight((acc, fn) => (_: any) => fn(acc(_)), identity)

const identity = <I>(_: I) => _

const empty = () => {}

function not<I>(p: Predicate<I>): Predicate<I> {
    return (_: I) => !p(_)
}

export { compose, identity, empty }
