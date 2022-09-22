import * as gen from "scripts/utils/generator"

export function arrayJumping(arr: number[]): boolean {
    function recurse(currentSlice: number[]): boolean {
        // Get first elem of arr
        const head = currentSlice[0]

        // If any are end of array, return true
        if(head >= currentSlice.length - 1) return true

        // Else, get all possible nodes that I can jump to based on first elem and recurse
        for(const len of gen.range(1, head)) {
            if(recurse(currentSlice.slice(len))) return true
        }

        return false
    }

    return recurse(arr)
}

export async function main(ns: typeof NS) {
    ns.tprint(arrayJumping([2,9,8,0,3,5,0,0,5,5,2,5]))
}