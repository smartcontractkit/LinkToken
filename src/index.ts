import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
export * as hardhat from './hardhat'
export * as optimism from './optimism'
export * from './contract-defs'

export const enum Versions {
  v0_4 = 'v0.4',
  v0_6 = 'v0.6',
  v0_7 = 'v0.7',
}

export const enum Targets {
  EVM = '', // default target
  OVM = 'ovm',
}

// Parse CLI arguments
export const argv = yargs(hideBin(process.argv)).argv
