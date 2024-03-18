/**
 * Caesar cipher is one of the simplest encryption technique. It is a type of substitution cipher in which each letter in the plaintext is replaced by a letter some fixed number of positions down the alphabet. For example, with a left shift of 3, D would be replaced by A, E would become B, and A would become X (because of rotation).
 * 
 * You are given an array with two elements:
 * ["VIRUS EMAIL LOGIN MEDIA SHELL", 12]
 * The first element is the plaintext, the second element is the left shift value.
 * 
 * Return the ciphertext as uppercase string. Spaces remains the same.
 */

import { map, foldLeft } from "scripts/utils/iterable"
import { compose } from "scripts/utils/fn"

const alphaLength = 26
const alphaStart = 65

export function caesarCipher([input, leftShift]: [string, number]): string {
    function caesarCipherShift(charCode: number): string {
        return ((charCode == 32) ? " " : String.fromCharCode(((alphaLength + (charCode - alphaStart - leftShift)) % alphaLength) + alphaStart))
    }
    return compose(
        foldLeft<number, string>("")((acc, charCode: number) => acc + caesarCipherShift(charCode)),
        map((c: string) => c.charCodeAt(0))
    )(input)
}
