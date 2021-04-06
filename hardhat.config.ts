// hardhat.config.ts
import { HardhatUserConfig, SolcConfig } from 'hardhat/types'
import { hardhat } from './src'

import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'

const DEFAULT_VERSION = 'v0.6'

const optimizer = {
  runs: 200,
  enabled: true,
}

const versions: Record<string, SolcConfig> = {
  'v0.4': {
    version: '0.4.16',
    settings: { optimizer },
  },
  'v0.6': {
    version: '0.6.12',
    settings: { optimizer },
  },
  'v0.7': {
    version: '0.7.6',
    settings: { optimizer },
  },
}

// Require version exists
const versionLabel = process.env.VERSION || DEFAULT_VERSION
const compiler = versions[versionLabel]
if (!compiler) throw Error(`Compiler for ${versionLabel} could not be found!`)

const config: HardhatUserConfig = {
  paths: {
    sources: `./contracts/${versionLabel}`,
    cache: './build/cache',
    artifacts: './build/artifacts',
  },
  solidity: {
    compilers: Object.values(versions),
    overrides: {
      ...hardhat.generateOverrides(`./contracts/${versionLabel}/**/*.sol`, {}, compiler),
    },
  },
  typechain: {
    outDir: `build/types/${versionLabel}`,
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 10000,
  },
}

export default config
