export * as hardhat from './hardhat'
export * as optimism from './optimism'
export * from './contract-defs'

export const enum Versions {
  v0_4 = '0.4',
  v0_6 = '0.6',
  v0_7 = '0.7',
}

export const enum Targets {
  EVM = '', // default target
  OVM = 'ovm',
}

export const enum Networks {
  HARDHAT = 'hardhat',
  OPTIMISM = 'optimism', // AKA 'hardhat-optimism'
  KOVAN_OPTIMISM = 'kovan-optimism',
}
