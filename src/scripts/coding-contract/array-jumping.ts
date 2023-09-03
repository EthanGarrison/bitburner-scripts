import { NS } from "@ns"
import * as gen from "scripts/utils/iterable"

export function arrayJumping(arr: number[]): number {
    function recurse(currentSlice: number[], jumps = 0): number {
        // Get first elem of arr
        const head = currentSlice[0]

        // If we are at the end of array, return jumps
        if(currentSlice.length == 1) return jumps
        // If we can't jump from here, return 0
        if(head == 0) return 0
        // If we can jump to the end, return jumps + 1
        if(head >= currentSlice.length - 1) return jumps + 1

        // Else, get all possible nodes that I can jump to and recurse
        let minJump = Infinity

        // Minor optimization.  By trying the largest jump first, then walking backwards,
        // we have a better shot of finding the end of the array.  This can of course hurt
        // the performance if the array is left-balanced rather than even/random
        for(const len of gen.range(head, 0, -1)) {
            const recursiveJump = recurse(currentSlice.slice(len), jumps + 1)
            if(recursiveJump < minJump && recursiveJump > 0) minJump = recursiveJump
            // Minor optimization.  Assumption is that if we have found a jump smaller
            // than the length we are checking, then we know that we have found something
            // that can jump past us.  If we can jump past this point, no need to check
            if(minJump <= len) break
        }

        return isFinite(minJump) ? minJump : 0
    }

    return recurse(arr)
}

export async function main(ns: NS) {
    ns.tprint(arrayJumping([2,4,9,0,3,5,0,0,5,5,2,5])) // 2
    ns.tprint(arrayJumping([0,6,3,1,6,1,0,7,1,0,10,7,0,5,8,2,7,0])) // 0
    ns.tprint(arrayJumping([6,3,1,6,1,0,7,1,0,10,7,0,5,8,2,7,0])) // 3
    ns.tprint(arrayJumping([1,9,6,0,0,1,3,6])) // 2
    ns.tprint(arrayJumping([2,5,1,2,4,3,3,3,2,4,3,2,5,3,1,2,0,4,2,6,1,4,7,6])) // 7
    ns.tprint(arrayJumping([1,0,4,0,6,3,2,4,2,4,6,3,2,3,3,6,1])) // 0
}
