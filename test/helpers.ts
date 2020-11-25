import * as utils from 'web3-utils'

export const encodeUint256 = (int: number) => {
  let zeros = '0000000000000000000000000000000000000000000000000000000000000000'
  let payload = int.toString(16)
  return (zeros + payload).slice(payload.length)
}

export const encodeAddress = (address: string) => {
  return '000000000000000000000000' + address.slice(2)
}

export const encodeBytes = (bytes: string) => {
  let padded = bytes.padEnd(64, '0')
  let length = encodeUint256(bytes.length / 2)
  return length + padded
}

export const functionID = (signature: string) => {
  return utils
    .sha3(signature)
    ?.slice(2)
    .slice(0, 8)
}

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'
