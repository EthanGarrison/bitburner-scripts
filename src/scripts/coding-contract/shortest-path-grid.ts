import { NS } from "@ns"

import * as gen from "scripts/utils/iterable"
import * as fn from "scripts/utils/fn"

type Point = [number,number]
type Grid = number[][]

function shortestPathGrid2(grid: Grid): string {
    const endX = grid.length - 1
    const endY = grid[0].length - 1
    // Stupid check, make sure the grid is even possible
    if (grid[endX][endY] == 1) return ""

    type Path = { path: Point[], traveled: Grid }

    function pathCheck(path: Point[], traveled: Grid): [Point[][], Grid] {
        const [recentX, recentY] = path[path.length - 1]
        // If we are at the end, no need for other checks, just return the path
        if (recentX == endX && recentY == endY) return [[path], traveled]

        if (recentX < 0 || recentX > endX || recentY < 0 || recentY > endY) return [[], traveled]
        if (grid[recentX][recentY] == 1) return [[], traveled]

        // If we have traveled this path before, we are in a cycle
        if (traveled[recentX][recentY] == 1) return [[], traveled]
        // God, immutable values would be nice...
        let updatedTravel = [...traveled]
        updatedTravel[recentX] = [...updatedTravel[recentX]]
        updatedTravel[recentX][recentY] = 1;

        return [[
            path.concat([[recentX + 1, recentY]]),
            path.concat([[recentX, recentY + 1]]),
            path.concat([[recentX - 1, recentY]]),
            path.concat([[recentX, recentY - 1]])
        ], updatedTravel]
    }

    function checkAllPaths(paths: Path[]): Point[] {
        let allPaths: Path[] = [] 
        for(const path of paths) {
            const [newPaths, updatedTravel] = pathCheck(path.path, path.traveled)
            if(newPaths.length == 0) continue
            else if (newPaths.length == 1) return newPaths[0]
            else allPaths = allPaths.concat(newPaths.map(p => ({ path: p, traveled: updatedTravel })))
        }
        if(allPaths.length == 0) return []
        return checkAllPaths(allPaths.sort((l, r) => l.path.length - r.path.length))
    }

    function recurse(path: Point[], traveled: Grid): Point[] {
        const [newPaths, updatedTravel] = pathCheck(path, traveled)
        if(newPaths.length == 0) return []
        else if (newPaths.length == 1) return newPaths[0]
        else {
            const parsePaths = fn.compose(
                gen.toArray,
                gen.sort((l: Point[], r: Point[]) => l.length - r.length),
                gen.filter((path: Point[]) => path.length > 0),
                gen.map((path: Point[]) => recurse(path, updatedTravel))
            )

            const possiblePaths = parsePaths(newPaths)
            return possiblePaths.length > 0 ? possiblePaths[0] : []
        }
    }

    const finalPath = checkAllPaths([{ path: [[0, 0]], traveled: new Array(grid.length).fill([])}])
    if (finalPath.length == 0) return ""

    const convertToDirection = gen.foldLeft<Point, {result: string, prev: Point}>({ result: "", prev: [0, 0] })(({ result, prev }, [nodeX, nodeY]) => {
        const [prevX, prevY] = prev
        let dir = ""
        if (nodeX > prevX) dir = "D"
        else if (nodeX < prevX) dir = "U"
        else if (nodeY > prevY) dir = "R"
        else if (nodeY < prevY) dir = "L"
        return { result: result + dir, prev: [nodeX, nodeY] }
    })

    return convertToDirection(finalPath).result
}

/**
 * You are given a 2D array of numbers (array of array of numbers) representing
 * a grid. The 2D array contains 1’s and 0’s, where 1 represents an obstacle and
 * 0 represents a free space.
 * 
 * Assume you are initially positioned in top-left corner of that grid and that you
 * are trying to reach the bottom-right corner. In each step, you may move to the up,
 * down, left or right. Furthermore, you cannot move onto spaces which have obstacles.
 * 
 * Determine if paths exist from start to destination, and find the shortest one.
 * 
 * Examples:
 * [
 *  [0,1,0,0,0],
 *  [0,0,0,1,0]
 * ] -> "DRRURRD"
 * [
 *  [0,1],
 *  [1,0]
 * ] -> ""
 */
export function shortestPathGrid(grid: number[][]): string {
    const endX = grid.length - 1
    const endY = grid[0].length - 1
    // Stupid check, make sure the grid is even possible
    if (grid[endX][endY] == 1) return ""

    function recurse(path: Point[]): Point[] {
        const [recentX, recentY] = path[path.length - 1]
        // If we are at the end, no need for other checks, just return the path
        if (recentX == endX && recentY == endY) return path

        // Check for cycles.  If I was smarter, I would use a tree instead of array for my path.
        // Then I could check for cycles more efficiently
        if (path.length >= 3) {
            let cycleFound = false
            for (const [prevX, prevY] of path.slice(0, -1)) {
                cycleFound = prevX == recentX && prevY == recentY
                if (cycleFound) break
            }
            if (cycleFound) return []
        }

        if (recentX < 0 || recentX > endX || recentY < 0 || recentY > endY) return []
        if (grid[recentX][recentY] == 1) return []

        const newPaths = [
            path.concat([[recentX + 1, recentY]]),
            path.concat([[recentX, recentY + 1]]),
            path.concat([[recentX - 1, recentY]]),
            path.concat([[recentX, recentY - 1]])
        ]
        const parsePaths = fn.compose(
            gen.toArray,
            gen.sort((l: Point[], r: Point[]) => l.length - r.length),
            gen.filter((path: Point[]) => path.length > 0),
            gen.map(recurse)
        )

        const possiblePaths = parsePaths(newPaths)
        return possiblePaths.length > 0 ? possiblePaths[0] : []
    }

    const finalPath = recurse([[0, 0]])
    if (finalPath.length == 0) return ""

    const convertToDirection = gen.foldLeft<Point, {result: string, prev: Point}>({ result: "", prev: [0, 0] })(({ result, prev }, [nodeX, nodeY]) => {
        const [prevX, prevY] = prev
        let dir = ""
        if (nodeX > prevX) dir = "D"
        else if (nodeX < prevX) dir = "U"
        else if (nodeY > prevY) dir = "R"
        else if (nodeY < prevY) dir = "L"
        return { result: result + dir, prev: [nodeX, nodeY] }
    })

    return convertToDirection(finalPath).result
}

export async function main(ns: NS) {
    // // DRRURRD
    // ns.tprint(shortestPathGrid([[0, 1, 0, 0, 0], [0, 0, 0, 1, 0]]))
    // // ''
    // ns.tprint(shortestPathGrid([[0,1,1,0,1,0],[0,0,1,1,1,1],[0,0,0,1,0,0],[1,0,1,1,1,1],[0,1,1,0,0,1],[1,1,0,0,0,1],[0,0,1,0,1,0]]))
    // // DRRDDDRDDDRDDRRRDR
    // ns.tprint([[0,0,0,1,0,0,0,1,0],[0,0,0,0,0,0,0,1,0],[0,1,0,0,0,1,1,0,0],[1,1,0,1,1,0,0,0,1],[0,1,0,0,0,1,1,0,0],[0,0,1,0,0,0,1,1,0],[0,0,1,0,0,1,0,0,0],[1,1,1,0,0,0,0,1,0],[0,1,0,1,0,0,0,0,0],[0,1,0,1,0,0,0,0,1],[0,0,0,0,0,0,1,0,0]])
    // // ''
    // ns.tprint(shortestPathGrid([[0,0,0,1,0,0,1,1,0,1,0,0],[0,0,0,0,0,0,1,1,0,0,0,0],[0,0,0,0,0,1,0,1,0,0,0,0],[0,0,0,0,1,0,0,1,0,0,0,0],[0,1,0,0,1,0,0,1,0,1,0,0],[1,0,1,0,0,1,0,0,0,0,0,0]]))
    // // 'DDDRRRRRRDRRRRRD'
    // ns.tprint(shortestPathGrid([[0,1,0,0,0,0,1,1,1,0,0,0],[0,0,0,1,0,0,1,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,1,0,1],[0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,1,0,0,1,0,0,1,0]]))

    ns.tprint(shortestPathGrid([[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,0],[0,0,0,0,0,0,1,0],[0,0,1,1,0,0,1,0],[0,0,1,0,0,0,1,0],[0,1,0,1,1,1,0,1],[0,0,1,0,0,0,0,0],[0,1,0,0,0,0,0,0],[0,0,1,0,0,0,0,0],[0,0,1,0,0,0,0,0],[0,0,1,0,0,0,0,1],[0,0,0,0,0,0,1,0]]))

    ns.tprint(shortestPathGrid([[0,1,0,0,1,1,0],[1,0,0,0,0,0,0],[1,0,1,0,0,1,0],[1,0,0,1,0,1,0],[1,0,1,1,0,0,0],[1,0,0,0,0,0,0],[0,0,0,0,1,0,0],[0,0,0,0,0,0,0]]))

    ns.tprint(shortestPathGrid([[0,0,0,0,0,0,1,0,0,0],[0,1,0,1,0,0,1,0,0,0],[0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,1,0,0,0],[1,0,0,0,0,0,1,0,1,0],[0,0,1,1,0,1,0,0,1,0],[0,1,0,1,0,0,1,1,1,0],[0,0,1,1,0,0,0,1,0,0],[1,1,1,0,0,1,0,0,0,0],[0,0,1,1,0,1,0,0,0,0]]))

    ns.tprint(shortestPathGrid([[0,0,0,1,0,0,0,1],[1,0,0,0,0,0,0,0],[0,0,1,1,0,1,0,0],[0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0],[0,1,1,0,0,0,0,0]]))

    ns.tprint(shortestPathGrid([[0,0,1,0,0,1,1,1],[1,0,0,0,0,0,0,1],[0,0,0,0,1,0,0,0],[1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0],[0,0,1,1,0,1,0,0],[1,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0]]))

    ns.tprint(shortestPathGrid([[0,0,0,0,0,0,0,1,0],[0,1,0,0,0,0,1,1,1],[0,0,0,0,1,0,0,0,0],[1,0,0,0,0,1,1,0,1],[0,1,0,1,0,1,1,0,0],[1,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,1,0,0],[0,1,0,0,0,0,0,1,0],[1,0,1,1,1,0,0,0,0],[1,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0],[0,0,0,1,0,1,0,0,0]]))

    ns.tprint(shortestPathGrid([[0,1,0,0,1,0,1,1,0,1,1,1],[0,0,0,1,1,1,0,0,0,1,0,1],[0,1,0,0,1,0,0,1,1,0,0,0],[0,0,0,1,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,0,0,0,0],[0,1,1,0,0,1,0,0,1,0,0,0]]))

    ns.tprint(shortestPathGrid([[0,0,1,0,0,0,0,0],[0,0,0,1,1,1,0,0],[0,1,1,0,0,1,0,0],[0,0,1,0,1,0,0,0],[0,0,0,1,0,0,0,0],[0,1,0,0,0,1,1,1],[0,0,0,0,0,1,0,0],[1,0,1,1,1,0,0,1],[0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1],[0,0,1,0,0,0,1,0]]))

    ns.tprint(shortestPathGrid([[0,0,0,0,0,0,0,1,1],[0,0,1,1,0,0,0,0,0],[0,0,0,1,1,1,1,0,0],[0,0,1,1,1,1,0,0,0],[1,0,1,0,1,0,0,1,1],[0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0]]))

    ns.tprint(shortestPathGrid([[0,0,0,0,0,0,1,0,0,1],[1,1,0,0,0,1,0,0,0,0],[0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0],[0,0,1,0,0,1,1,0,1,0],[0,1,0,0,0,0,0,0,0,1],[0,0,0,0,1,1,0,0,0,1],[0,0,1,1,0,0,1,0,0,0],[1,0,0,0,0,0,0,0,0,0],[1,1,0,1,0,0,0,0,1,0]]))

    ns.tprint(shortestPathGrid([[0,0,0,1,0,0,1,1],[0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0],[0,0,1,0,0,0,1,0],[0,0,0,0,0,0,0,0],[1,1,1,1,0,0,0,0]]))

}
