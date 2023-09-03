import { NS } from "@ns"
import * as iter from "scripts/utils/iterable"
import { genDeepScan } from "scripts/utils/ns-utils"

import { arrayJumping } from "scripts/coding-contract/array-jumping"
import { shortestPathGrid } from "scripts/coding-contract/shortest-path-grid"
import { twoColorCheck } from "scripts/coding-contract/two-color-graph"

function attempt({ codingcontract }: NS, server: string, file: string): string {
  const type = codingcontract.getContractType(file, server)
  const data = codingcontract.getData(file, server)
  let result: string = "No attempt"
  switch (type) {
    case "Array Jumping Game":
      result = codingcontract.attempt(!!arrayJumping(data) ? 1 : 0, file, server)
      break
    case "Array Jumping Game II":
      result = codingcontract.attempt(arrayJumping(data), file, server)
      break
    case "Proper 2-Coloring of a Graph":
      result = codingcontract.attempt(twoColorCheck(data), file, server)
      break
    // case "Shortest Path in a Grid":
    //   result = codingcontract.attempt(shortestPathGrid(data), file, server)
    //   break
  }
  return ` * ${file}: ${type}
  \tInput: ${JSON.stringify(data)}
  \tAttempts Left: ${(result.length == 0) ? codingcontract.getNumTriesRemaining(file, server) : 0}
  \tAttempt Result: ${result}`
}

export async function main(ns: NS) {
  iter.foreach((server: string) => {
    const ccFiles = ns.ls(server, ".cct")
    if (ccFiles.length > 0) {
      ns.tprint(`Found CC files in ${server}:`)
      iter.foreach((file: string) => ns.tprint(attempt(ns, server, file)))(ccFiles)
    }
  })(genDeepScan(ns))
}
