/**
 * Given a triangle, find the minimum path sum from top to bottom. In each step of the path, you may only move to adjacent numbers in the row below. The triangle is represented as a 2D array of numbers:
 * 
 * Example: If you are given the following triangle:
 * [
 *      [2],
 *      [3,4],
 *      [6,5,7],
 *      [4,1,8,3]
 * ]
 * 
 * The minimum path sum is 11 (2 -> 3 -> 5 -> 1).
 */

import { NS } from "@ns";

interface Path {
    row: number,
    col: number,
    result: number
}

export function minPathTriangle(input: number[][]): number {
    const maxRow = input.length - 1
    function recurse(paths: Path[]): Path[] {
        const newPaths: Path[] = []
        for (const { row, col, result } of paths) {
            if (row == maxRow) return paths
            else {
                const nextRow = row + 1
                const leftCol = col
                const rightCol = col + 1
                newPaths.push({ row: nextRow, col: leftCol, result: result + input[nextRow][leftCol] })
                newPaths.push({ row: nextRow, col: rightCol, result: result + input[nextRow][rightCol] })
            }
        }
        return recurse(newPaths)
    }

    return recurse([{ row: 0, col: 0, result: input[0][0] }]).sort((l,r) => l.result - r.result)[0].result
}

export async function main(ns: NS) {
    ns.tprint(minPathTriangle([[2], [3,4], [6,5,7],[4,1,8,3]]))
}