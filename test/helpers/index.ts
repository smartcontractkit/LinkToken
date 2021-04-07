import { ethers } from 'ethers'
import { assert } from 'chai'

export const REVERT_REASON_EMPTY = 'Transaction reverted without a reason'

// Only if local env is setup to accept tests
export const isIntegration = () => process.env.TEST_INTEGRATION === 'true'

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

export const functionID = (fnSignature: string) => {
  const { keccak256, toUtf8Bytes } = ethers.utils
  return keccak256(toUtf8Bytes(fnSignature)).slice(2).slice(0, 8)
}

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

/**
 * Check that an evm transaction fails
 *
 * @param action The asynchronous action to execute, which should cause an evm revert.
 */
export async function txRevert(action: (() => Promise<any>) | Promise<any>) {
  try {
    if (typeof action === 'function') {
      await action()
    } else {
      await action
    }
  } catch (e) {
    assert(e.message, 'Expected an error to contain a message')

    const ERROR_MESSAGES = ['transaction failed']
    const hasErrored = ERROR_MESSAGES.some((msg) => e.message.includes(msg))

    assert(
      hasErrored,
      `expected following error message to include ${ERROR_MESSAGES.join(' or ')}. Got: "${
        e.message
      }"`,
    )
    return
  }

  const err = undefined
  assert.exists(err, 'Expected an error to be raised')
}
