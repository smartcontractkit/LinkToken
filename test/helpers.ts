import * as utils from 'web3-utils'

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

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
