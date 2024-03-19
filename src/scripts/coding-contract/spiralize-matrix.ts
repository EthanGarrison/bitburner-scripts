/**
 * Given the following array of arrays of numbers representing a 2D matrix, return the elements of the matrix as an array in spiral order:
 *
 * Here is an example of what spiral order should be:
 *
 * [
 *      [1, 2, 3]
 *      [4, 5, 6]
 *      [7, 8, 9]
 * ]
 *
 * Answer: [1, 2, 3, 6, 9, 8 ,7, 4, 5]
 *
 * Note that the matrix will not always be square:
 * 
 * [
 *      [1,  2,  3,  4]
 *      [5,  6,  7,  8]
 *      [9, 10, 11, 12]
 * ]
 *
 * Answer: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
 */

import { NS } from "@ns"
import { range } from "scripts/utils/iterable"

export function spiralizeMatrix(input: number[][]): number[] {

    const maxRow = input.length
    const maxCol = input[0].length
    const totalElems = (maxRow) * (maxCol)
    const result: number[] = []

    let counter = 0
    function generateRing(ringXStart: number, ringYStart: number, ringXEnd: number, ringYEnd: number) {
        counter++
        if (counter >= 100) return
        for (const rowIdx of range(ringXStart, ringXEnd))
            result.push(input[ringYStart][rowIdx])

        for (const colIdx of range(ringYStart + 1, ringYEnd))
            result.push(input[colIdx][ringXEnd - 1])

        // Exit here in case we are in a non-even width matrix
        if (result.length == totalElems) return
        for (const rowIdx of range(ringXEnd - 2, ringXStart, -1))
            result.push(input[ringYEnd - 1][rowIdx])

        for (const colIdx of range(ringYEnd - 1, ringYStart, -1))
            result.push(input[colIdx][ringXStart])

        if (result.length != totalElems) generateRing(ringXStart + 1, ringYStart + 1, ringXEnd - 1, ringYEnd - 1)
    }

    generateRing(0, 0, maxCol, maxRow)
    return result
}

// export async function main(ns: NS) {
//     ns.tprint(
//         spiralizeMatrix(
//             ns,
//             // [
//             //     [1, 2, 3],
//             //     [4, 5, 6],
//             //     [7, 8, 9],
//             // ]
//             // [
//             //     [1, 3],
//             //     [4, 6],
//             //     [7, 9],
//             // ]
//             // [
//             //     [1,  2,  3,  4],
//             //     [5,  6,  7,  8],
//             //     [9, 10, 11, 12],
//             // ]
//         )
//     )
// }
