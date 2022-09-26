/**
 * Generator Utils
 * Exposes a bunch of handy methods for working from generators rather than arrays
 */
import { identity } from "scripts/utils/fn"

type Zipped<A, B> = { fst: A, snd: B }
type Iter<A> = Generator<A, void, undefined>

export function* forever<I>(i: I): Iter<I> { while (true) yield i }

/**
 * Create generator from [start to end) by step
 */
export function* range(start: number, end: number, step: number = 1) {
    const cmp = (i: number) => {
        if (start <= end && step > 0) return i < end
        else if (start > end && step < 0) return i > end
        else return false
    }
    for (let i = start; cmp(i); i += step) yield i
}

/**
 * Apply fn to given iterator.  Returns Iterator[B]
 */
export const map = <I, O>(fn: (i: I) => O) => function* (gen: Iterable<I>): Iter<O> { for (const i of gen) yield fn(i) }

/**
 * Apply fn to given iterator.  Returns Iterator[B]
 */
export const flatMap = <I, O>(fn: (i: I) => Iterable<O>) => function* (gen: Iterable<I>): Iter<O> { for (const i of gen) yield* fn(i) }

/**
 * Apply fn to given iterator, returning only the values that return `true`
 */
export const filter = <I>(fn: (i: I) => boolean) => function* (gen: Iterable<I>): Iter<I> { for (const i of gen) if (fn(i)) yield i }

/**
 * Apply fn to given iterator.  Returns Iterator[()]
 */
export const foreach = <I>(fn: (i: I) => void) => function (gen: Iterable<I>): void { for (const i of gen) { fn(i) } }

/**
 * Apply fn to given iterator.  Returns iterator unchanged
 */
export const tap = <I>(fn: (i: I) => void) => function* (gen: Iterable<I>): Iter<I> { for (const i of gen) { fn(i); yield i } }

/**
 * Given a comparator ((A,A) => {-1,0,1}), return a generator with sorted values.
 * NOTE: This will eval the ENTIRE given generator.  Will not work with infinite values.
 * Only real need for this is so that we can stay in the context of Generator...
 */
export const sort = <I>(cmp: (l: I, r: I) => number) => function* (gen: Iterable<I>): Iter<I> { yield* [...gen].sort(cmp) }

/**
 * Given an initial value and an aggregate function,
 * fold each value in the generator using the aggregator
 * foldLeft :: a => (a => b => a) => Generator b => a
 */
export const foldLeft = <I, O>(init: O) => (fn: (acc: O, value: I) => O) => (gen: Iterable<I>): O => {
    let acc = init
    for (const i of gen) acc = fn(acc, i)
    return acc
}

/**
 * Returns the first `cnt` of the given generator
 */
export const take = <I>(cnt: number) => function* (gen: Iterable<I>): Iter<I> {
    if (cnt <= 0) return
    let cnti = 0
    for (const i of gen) {
        if (cnti >= cnt) break
        cnti++
        yield i
    }
}

/**
 * Iterators through a given generators in order to evalute for side effects
 */
export const consume = foreach(identity)

export const concat = function*<I>(...gen: Iterable<I>[]): Iter<I> { for (const genI of gen) yield* genI }

/**
 * Yield values from gen while fn returns true
 */
export const takeWhile = <I>(fn: (i: I) => boolean) => function* (gen: Iterable<I>): Iter<I> { for (const i of gen) { if (fn(i)) yield i; else break } }

/**
 * Wrap values from other and gen into a tuple, stop with one of them stops producing values
 */
export const zip2 = <A, B>(other: Iterable<A>) => function* (gen: Iterable<B>): Iter<Zipped<A,B>> {
    // Get the iterators for our given iterables
    const otherIter = other[Symbol.iterator]()
    const genIter = gen[Symbol.iterator]()

    // While neither iterator is finished, wrap them in a tuple and yield
    let otherVal = otherIter.next()
    let genVal = genIter.next()
    while (!(otherVal.done && genVal.done)) {
        yield ({ "fst": otherVal.value, "snd": genVal.value })
        otherVal = otherIter.next()
        genVal = genIter.next()
    }

    // Clean-up
    otherIter.return()
    genIter.return()
}

/**
 * Handy method for collecting all the values from an iterable into an Array
 */
export const toArray = <I>(gen: Iterable<I>): I[] => [...gen]

// TODO: Window/Sliding window functions
