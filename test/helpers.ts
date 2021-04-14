import { ethers } from 'ethers'
import { assert } from 'chai'

export const REVERT_REASON_EMPTY = 'Transaction reverted without a reason'

export const encodeUint256 = (int: number) => {
  const zeros = '0000000000000000000000000000000000000000000000000000000000000000'
  const payload = int.toString(16)
  return (zeros + payload).slice(payload.length)
}

export const encodeAddress = (address: string) => '000000000000000000000000' + address.slice(2)

export const encodeBytes = (bytes: string) => {
  const padded = bytes.padEnd(64, '0')
  const length = encodeUint256(bytes.length / 2)
  return length + padded
}

export const functionID = (fnSignature: string) =>
  ethers.utils
    .keccak256(ethers.utils.toUtf8Bytes(fnSignature))
    .slice(2)
    .slice(0, 8)

/**
 * Check that a contract's abi exposes the expected interface.
 *
 * @param contract The contract with the actual abi to check the expected exposed methods and getters against.
 * @param expectedPublic The expected public exposed methods and getters to match against the actual abi.
 */
export function publicAbi(
  contract: ethers.Contract | ethers.ContractFactory,
  expectedPublic: string[],
) {
  const actualPublic = []
  for (const method of contract.interface.fragments) {
    if (method.type === 'function') {
      actualPublic.push(method.name)
    }
  }

  for (const method of actualPublic) {
    const index = expectedPublic.indexOf(method)
    assert.isAtLeast(index, 0, `#${method} is NOT expected to be public`)
  }

  for (const method of expectedPublic) {
    const index = actualPublic.indexOf(method)
    assert.isAtLeast(index, 0, `#${method} is expected to be public`)
  }
}
