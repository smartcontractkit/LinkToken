import * as path from 'path'
import * as glob from 'glob'
import { ethers, ContractFactory, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'

export const getContractDefinition = (name: string, version?: string): any => {
  const match = glob.sync(
    path.resolve(__dirname, `../build/artifacts/contracts${version ? `/${version}` : ''}`) +
      `/**/${name}.json`,
  )

  if (match.length > 0) {
    return require(match[0])
  } else {
    throw new Error(`Unable to find artifact for contract: ${name}`)
  }
}

export const getContractInterface = (name: string, version?: string): Interface => {
  const definition = getContractDefinition(name, version)
  return new ethers.utils.Interface(definition.abi)
}

export const getContractFactory = (
  name: string,
  signer?: Signer,
  version?: string,
): ContractFactory => {
  const definition = getContractDefinition(name, version)
  const contractInterface = getContractInterface(name, version)
  return new ContractFactory(contractInterface, definition.bytecode, signer)
}
