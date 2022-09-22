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

    function recurse(path: number[][]): number[][] {
        // console.log(`Testing path [${path.map(p => `[${p.join(",")}]`).join(",")}]`)
        const [recentX, recentY] = path[path.length - 1]
        // If we are at the end, no need for other checks, just return the path
        if(recentX == endX && recentY == endY) return path

        // Check for cycles.  If I was smarter, I would use a tree instead of array for my path.
        // Then I could check for cycles more efficiently
        if(path.length >= 3) {
            let cycleFound = false
            for(const [prevX, prevY] of path.slice(0, -1)) {
                cycleFound = prevX == recentX && prevY == recentY
                if(cycleFound) break
            }
            if(cycleFound) return []
        }

        if(recentX < 0 || recentX > endX || recentY < 0 || recentY > endY) return []
        if(grid[recentX][recentY] == 1) return []

        const newPaths = [
            path.concat([[recentX + 1, recentY]]),
            path.concat([[recentX, recentY + 1]]),
            path.concat([[recentX - 1, recentY]]),
            path.concat([[recentX, recentY - 1]])
        ]
        const possiblePaths = newPaths.map(recurse).filter(path => path.length > 0).sort((l,r) => l.length - r.length)
        return possiblePaths.length > 0 ? possiblePaths[0] : []
    }

    const finalPath = recurse([[0,0]])
    if(finalPath.length == 0) return ""

    let [prevX, prevY] = [0,0]
    let result = []
    for(const [nodeX, nodeY] of finalPath) {
        if(nodeX > prevX) result.push("D")
        else if(nodeX < prevX) result.push("U")
        else if(nodeY > prevY) result.push("R")
        else if(nodeY < prevY) result.push("L")
        prevX = nodeX
        prevY = nodeY
    }

    return result.join()
}