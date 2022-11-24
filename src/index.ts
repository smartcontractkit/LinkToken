export * as hardhat from './hardhat'
// export * as optimism from './optimism'
export * from './contract-defs'

export const enum Versions { 
  v0_6 = '0.6',
  
}

export const enum Targets {
  EVM = '', // default target
}

export const enum Networks {
  HARDHAT = 'hardhat',
  NAHMII = 'nahmii'
}
