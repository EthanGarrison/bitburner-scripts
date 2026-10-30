// `any` is only the upper bound for inference; callers see the chain computed below
type AnonFn = (_: any) => any
type Predicate<I> = (_: I) => boolean

type Reverse<T extends unknown[]> = T extends [infer H, ...infer R] ? [...Reverse<R>, H] : []

type Input<Fns extends AnonFn[]> = Fns extends [infer H extends AnonFn, ...any[]] ? Parameters<H>[0] : never
type Output<Fns extends AnonFn[]> = Fns extends [...any[], infer L extends AnonFn] ? ReturnType<L> : never

/**
 * Left-to-right check that every fn accepts the previous fn's output.
 * On failure, resolves to the offending pair instead of a callable, so misuse fails loudly at the call site.
 */
type Link<Out, Rest extends AnonFn[]> =
    Rest extends [infer H extends AnonFn, ...infer T extends AnonFn[]]
        ? [Out] extends [Parameters<H>[0]] ? Link<ReturnType<H>, T> : { error: "fn input does not accept previous output", output: Out, input: Parameters<H>[0] }
        : true

type Chain<Fns extends AnonFn[]> =
    Fns extends [infer H extends AnonFn, ...infer T extends AnonFn[]] ? Link<ReturnType<H>, T> : true

type Composed<Fns extends AnonFn[]> =
    Chain<Fns> extends true ? (_: Input<Fns>) => Output<Fns> : Chain<Fns>

/**
 * Given a list of fns, apply them to each other from left to right (or first to last)
 * Bare generic fns lose their type parameters, so instantiate them (ex: `toArray<number>`)
 */
const pipe = <Fns extends AnonFn[]>(...fns: Fns): Composed<Fns> =>
    fns.reduce((acc, fn) => (_: any) => fn(acc(_)), identity) as Composed<Fns>

/**
 * Given a list of fns, apply them to each other from right to left (or last to first)
 */
const compose = <Fns extends AnonFn[]>(...fns: Fns): Composed<Reverse<Fns>> =>
    fns.reduceRight((acc, fn) => (_: any) => fn(acc(_)), identity) as Composed<Reverse<Fns>>

const identity = <I>(_: I) => _

const empty = () => {}

function not<I>(p: Predicate<I>): Predicate<I> {
    return (_: I) => !p(_)
}

export { compose, pipe, identity, empty }
