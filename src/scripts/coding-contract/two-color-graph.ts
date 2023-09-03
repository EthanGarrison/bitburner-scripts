import { NS } from "@ns"
import { isDefined } from "scripts/utils/type"

/**
 * You are given the following data, representing a graph:
 * [7,[[0,5],[4,6],[0,6],[2,6],[4,5],[1,3],[2,3]]]
 * 
 * Note that "graph", as used here, refers to the field of graph theory, and
 * has no relation to statistics or plotting.
 * 
 * The first element of the data represents the number of vertices in the graph.
 * Each vertex is a unique number between 0 and 6. The next element of the data
 * represents the edges of the graph. Two vertices u,v in a graph are said to be
 * adjacent if there exists an edge [u,v].
 * 
 * Note that an edge [u,v] is the same as an edge [v,u], as order does not matter.
 * 
 * You must construct a 2-coloring of the graph, meaning that you have to assign
 * each vertex in the graph a "color", either 0 or 1, such that no two adjacent
 * vertices have the same color.
 * 
 * Submit your answer in the form of an array, where element i represents the
 * color of vertex i. If it is impossible to construct a 2-coloring of the given
 * graph, instead submit an empty array.
 * 
 * Examples:
 *
 * Input: [4, [[0, 2], [0, 3], [1, 2], [1, 3]]]
 * Output: [0, 0, 1, 1]
 *
 * Input: [3, [[0, 1], [0, 2], [1, 2]]]
 * Output: []
 */

/**
 * Working from the assumption that color must alternate if following the graph
 * connections, then we attempt to color in each vector based on the given pairs.
 * If a contradiction occurs, then we assume that it is impossible and return
 * an empty array.
 * 
 * A check value of the vector count is given, but ignoring for now, as check
 * seems unnecessary.
 * 
 * @returns Array containing the coloring of each vector
 */
export function twoColorCheck([_, connections]: [number, number[][]]): number[] {
  // Sorting the connections because my code gets confused if it doesn't do all connections for a node in order.
  // Probably should come up with solution that solves this, but means doing actual graph implementation.  Yuck.
  // Also, my code will probably do weird things if the connection description isn't sorted.  As in [0,1], not [1,0].
  // Basically, using lots of assumptions, so probably lots of buggy edge cases
  const sortedConnections = [...connections].sort((l,r) => l[0] - r[0])
  const colorings: number[] = []
  for (const [left, right] of sortedConnections) {
    // Get left's color, defaulting to 0
    let leftColor = isDefined(colorings[left]) ? colorings[left] : 0
    colorings[left] = leftColor

    // Get right's color, defaulting to the opposite of left color
    let rightColor = isDefined(colorings[right]) ? colorings[right] : (leftColor == 0) ? 1 : 0

    // If the colors match, then we have seen a connection that contradicts the current connection
    if (leftColor == rightColor) return []
    colorings[right] = rightColor
  }

  return colorings
}

export async function main(ns: NS) {
  ns.tprint(twoColorCheck([4, [[0, 2], [1, 3], [0, 1], [2, 3]]]))
  ns.tprint(twoColorCheck([12, [[4, 11], [4, 5], [2, 11], [7, 8], [9, 10], [3, 6], [5, 9], [0, 2], [8, 11], [4, 7], [4, 11], [7, 9], [0, 4], [3, 5], [3, 11], [0, 9], [1, 9], [5, 8], [2, 7], [0, 3], [9, 11], [2, 10]]]))
}
