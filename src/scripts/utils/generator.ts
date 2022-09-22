import { isIterable } from "scripts/utils/type"
import { identity } from "scripts/utils/fn"

/** Lift values into iterator */
function* pure(gen: Iterable<any> | any) { if (isIterable(gen)) yield* gen; else yield gen }

/**
 * Create generator from [start to end) by step
 */
function* range(start: number, end: number, step: number = 1) {
    const cmp = (i: number) => {
        if(start <= end && step > 0) return i < end 
        else if(start > end && step < 0) return i >= end
        else return false
    }
    for(let i = start; cmp(i); i += step) yield i
}

/**
 * Apply fn to given iterator.  Returns Iterator[B]
 */
const map = <I,O>(fn: (i: I) => O) => function* (gen: Iterable<I>) { for (const i of gen) yield fn(i) }

/**
 * Apply fn to given iterator.  Returns Iterator[B]
 */
const flatMap = <I,O>(fn: (i: I) => Iterable<O>) => function* (gen: Iterable<I>) { for (const i of gen) yield* fn(i) }

/**
 * Apply fn to given iterator, returning only the values that return `true`
 */
const filter = <I>(fn: (i: I) => boolean) => function* (gen: Iterable<I>) { for (const i of gen) if (fn(i)) yield i }

/**
 * Apply fn to given iterator.  Returns Iterator[()]
 */
const foreach = <I>(fn: (i: I) => void) => function (gen: Iterable<I>) { for (const i of gen) { fn(i) } }

/**
 * Apply fn to given iterator.  Returns iterator unchanged
 */
const tap = <I>(fn: (i: I) => void) => function* (gen: Iterable<I>) { for (const i of gen) { fn(i); yield i } }

/**
 * Given a comparator ((A,A) => {-1,0,1}), return a generator with sorted values.
 * NOTE: This will eval the ENTIRE given generator.  Will not work with infinite values.
 * Only real need for this is so that we can stay in the context of Generator...
 */
const sort = <I>(cmp: (l: I, r: I) => number) => function* (gen: Iterable<I>) { yield* [...gen].sort(cmp) }

/**
 * Given an initial value and an aggregate function,
 * fold each value in the generator using the aggregator
 * foldLeft :: a => (a => b => a) => Generator b => a
 */
const foldLeft = <I,O>(init: O) => (fn: (acc: O, value: I) => O) => (gen: Iterable<I>) => {
    let acc = init
    for(const i of gen) acc = fn(acc, i)
    return acc
}

/**
 * Returns the first `cnt` of the given generator
 */
const take = <I>(cnt: number) => function* (gen: Iterable<I>) {
    if(cnt <= 0) return
    let cnti = 0
    for(const i of gen) {
        if(cnti >= cnt) break
        cnti++
        yield i
    }
}

/**
 * Iterators through a given generators in order to evalute for side effects
 */
const consume = foreach(identity)

const toArray = <I>(gen: Iterable<I>) => [...gen]

// TODO: Window/Sliding window functions

/**
 * Generator Utils
 * Exposes a bunch of handy methods for working from generators rather than arrays
 */
export { pure, map, flatMap, filter, foreach, tap, sort, take, range, consume, foldLeft, toArray }
