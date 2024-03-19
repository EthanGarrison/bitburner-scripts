import { NS } from "@ns"
import * as iter from "scripts/utils/iterable"
import { genDeepScan } from "scripts/utils/ns-utils"
import { compose } from "scripts/utils/fn"

import { arrayJumping } from "scripts/coding-contract/array-jumping"
import { shortestPathGrid } from "scripts/coding-contract/shortest-path-grid"
import { twoColorCheck } from "scripts/coding-contract/two-color-graph"
import { caesarCipher } from "scripts/coding-contract/caesar-cipher"
import { uniquePaths } from "scripts/coding-contract/unique-path"
import { minPathTriangle } from "scripts/coding-contract/min-path-triangle"
import { spiralizeMatrix } from "scripts/coding-contract/spiralize-matrix"

interface CCFile {
  server: string,
  file: string,
  type: string
}

function runAttempt({ codingcontract }: NS, {file, server, type}: CCFile, attempt: boolean): string {
  const data = codingcontract.getData(file, server)
  const triesRemaining = codingcontract.getNumTriesRemaining(file, server)
  let result: string = "No attempt"
  if(attempt) {
    switch (type) {
      case "Array Jumping Game":
        result = codingcontract.attempt(!!arrayJumping(data) ? 1 : 0, file, server)
        break
      case "Array Jumping Game II":
        result = codingcontract.attempt(arrayJumping(data), file, server)
        break
      // Breaking on quite a few cases
      // case "Proper 2-Coloring of a Graph":
      //   result = codingcontract.attempt(twoColorCheck(data), file, server)
      //   break
      case "Encryption I: Caesar Cipher":
        result = codingcontract.attempt(caesarCipher(data), file, server)
        break
      case "Unique Paths in a Grid I":
        result = codingcontract.attempt(uniquePaths(data), file, server)
        break
      case "Minimum Path Sum in a Triangle":
        result = codingcontract.attempt(minPathTriangle(data), file, server)
        break
      case "Spiralize Matrix":
        result = codingcontract.attempt(spiralizeMatrix(data), file, server)
        break
      // Seems to be hanging in some cases.  Will need to track down inputs that case this
      // case "Shortest Path in a Grid":
      //   result = codingcontract.attempt(shortestPathGrid(data), file, server)
      //   break
    }
  }
  return `* ${file}: ${type}
  Input: ${JSON.stringify(data)}
  Attempts Left: ${(result.length != 0) ? (result == "No attempt" ? triesRemaining : triesRemaining - 1) : 0}
  Attempt Result: ${result}`
}

export async function main(ns: NS) {
  const flags = ns.flags([
    ["attempt", false],
    ["filter", ""]
  ])

  const attempt: boolean = typeof flags["attempt"] == "boolean" && flags["attempt"]
  const filterFor = (typeof flags["filter"] == "string" && flags["filter"].length > 0) ? flags["filter"] : undefined

  const result = compose(
    iter.foldLeft<string, string>("")((acc, info) => acc + "\n------------------------------------------\n" + info),
    iter.map((ccFile: CCFile) => `Found CC file in ${ccFile.server}: \n${runAttempt(ns, ccFile, attempt)}`),
    iter.filter((ccFile: CCFile) => !filterFor || (filterFor[0] == "^" ? !ccFile.type.startsWith(filterFor) : ccFile.type.startsWith(filterFor))),
    iter.flatMap<string, CCFile>((server: string) => 
      iter.map<string, CCFile>((file: string) => ({
        server,
        file,
        "type": ns.codingcontract.getContractType(file, server)
      }))(ns.ls(server, ".cct"))
    )
  )(genDeepScan(ns))

  ns.tprint(result)
}
