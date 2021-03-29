import { assert } from 'chai'
import * as utils from 'web3-utils'
import { helpers } from '@chainlink/test-helpers'

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

// Only if local env is setup to accept tests
export const isIntegrationOVM = () => helpers.isOVM() && process.env.TEST_INTEGRATION === 'true'

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

export const functionID = (signature: string) =>
  utils
    .sha3(signature)
    ?.slice(2)
    .slice(0, 8)

/**
 * Check that an evm operation reverts
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
    const hasErrored = ERROR_MESSAGES.some(msg => e?.message?.includes(msg))

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
