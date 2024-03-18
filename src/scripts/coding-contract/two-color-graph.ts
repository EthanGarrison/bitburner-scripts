import { NS } from "@ns"
import { isDefined } from "scripts/utils/type"
import { range } from "scripts/utils/iterable"

type ColorTree = {
  vertex: number,
  color?: number,
  connections: ColorTree[]
}

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

/** */
export function twoColorCheck([_, connections]: [number, number[][]]): number[] {
  const vertices: ColorTree[] = []
  const oppColor = (c: number) => c == 0 ? 1 : 0

  for (const [left, right] of connections) {
    if (typeof vertices[left] == "undefined") vertices[left] = { vertex: left, connections: [] }
    if (typeof vertices[right] == "undefined") vertices[right] = { vertex: right, connections: [] }
    vertices[left].connections.push(vertices[right])
    vertices[right].connections.push(vertices[left])
  }

  let first = vertices.find(v => typeof v != "undefined")
  if(first) first.color = 0
  // Kickstart the colors by assigning the first vertex with a color

  // The messy bits.
  // Basically, dual check.  If vertex has color, check all links are valid and then assign colors
  // If vertex doesn't have color, then try to find if there the links have a color.
  // If links don't have colors and vertex doesn't have color, then just guess
  for (const idx of range(0, vertices.length)) {
    const vertex = vertices[idx]

    // For the weird cases were they do not use a vertex
    if(typeof vertex == "undefined") {
      vertices[idx] = { vertex: idx, color: 0, connections: [] }
      continue
    }
    const links = vertex.connections

    // If vertex has a color, check that all links have the opposite color
    if (vertex.color) {
      for (const link of links) {
        if (typeof link.color == "undefined") link.color = oppColor(vertex.color)
        else if (link.color == vertex.color) return []
      }
    }
    // If vertex doesn't have a color, find out if the links have already been assigned a color
    // If they haven't, ignore this node,  If they have, assign this vertex the opposite color and validate the other links
    // Potentially an issue here, as if we have a situation were two nodes are only connected to each other, they will never get a color
    else {
      let linkColor = links.find(i => typeof i.color != "undefined")?.color
      if (typeof linkColor != "undefined") {
        vertex.color = oppColor(linkColor)
        for (const link of links) {
          if (typeof link.color == "undefined") link.color = linkColor
          else if (link.color != linkColor) return []
        }
      }
    }
  }

  return vertices.map(c => c?.color ?? -1)
}


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
function old_twoColorCheck([_, connections]: [number, number[][]]): number[] {
  // Sorting the connections because my code gets confused if it doesn't do all connections for a node in order.
  // Probably should come up with solution that solves this, but means doing actual graph implementation.  Yuck.
  // Also, my code will probably do weird things if the connection description isn't sorted.  As in [0,1], not [1,0].
  // Basically, using lots of assumptions, so probably lots of buggy edge cases
  const sortedConnections = [...connections].sort((l, r) => l[0] - r[0])
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
  ns.tail()
  // // [0,1,1,0]
  // ns.print(twoColorCheck([4, [[0, 2], [1, 3], [0, 1], [2, 3]]], ns))
  // // [0,0,1,1,1,0,0,0,1,1,0,0]
  // ns.print(twoColorCheck([12, [[4, 11], [4, 5], [2, 11], [7, 8], [9, 10], [3, 6], [5, 9], [0, 2], [8, 11], [4, 7], [4, 11], [7, 9], [0, 4], [3, 5], [3, 11], [0, 9], [1, 9], [5, 8], [2, 7], [0, 3], [9, 11], [2, 10]]], ns))
  // // [0,1,1,1,0,0,1,0]
  // ns.print(twoColorCheck([9, [[1, 7], [0, 3], [3, 4], [4, 6], [3, 5], [2, 7], [3, 7], [0, 2], [2, 4], [1, 5]]], ns))
  ns.print(twoColorCheck([10, [[2, 4], [5, 9], [0, 7], [2, 7], [6, 9], [7, 9], [8, 9], [0, 6], [0, 4]]]))
}
