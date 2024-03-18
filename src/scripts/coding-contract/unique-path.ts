/**
 * You are in a grid with 3 rows and 10 columns, and you are positioned in the top-left corner of that grid.
 * You are trying to reach the bottom-right corner of the grid, but you can only move down or right on each step.
 * Determine how many unique paths there are from start to finish.
 * 
 * NOTE: The data returned for this contract is an array with the number of rows and columns:
 * [3, 10]
 */

type Pair = [number, number]

export function uniquePaths([boundX, boundY]: Pair): number {
    function recurse(paths: Pair[]): Pair[] {
        const newPaths: Pair[] = []
        for(const [pathX, pathY] of paths) {
            if(pathX < boundX-1) newPaths.push([pathX+1, pathY])
            if(pathY < boundY-1) newPaths.push([pathX, pathY+1])
            if(pathX == boundX && pathY == boundY) newPaths.push([pathX, pathY])
        }
        return newPaths.length == paths.length ? paths : recurse(newPaths)
    }

    return recurse([[0,0]]).length
}
