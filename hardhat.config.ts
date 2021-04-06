// hardhat.config.ts
import { HardhatUserConfig, SolcConfig } from 'hardhat/types'
import { hardhat } from './src'

import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import '@eth-optimism/plugins/hardhat/compiler'

const DEFAULT_VERSION = 'v0.6'

const optimizer = {
  runs: 200,
  enabled: true,
}

const settings = {
  optimizer,
  metadata: {
    // To support Go code generation from build artifacts
    // we need to remove the metadata from the compiled bytecode.
    bytecodeHash: 'none',
  },
}

const versions: Record<string, SolcConfig> = {
  'v0.4': { version: '0.4.16', settings },
  'v0.6': { version: '0.6.12', settings },
  'v0.7': { version: '0.7.6', settings },
}

// Require version exists
const versionLabel = process.env.VERSION || DEFAULT_VERSION
const compiler = versions[versionLabel]
if (!compiler) throw Error(`Compiler for ${versionLabel} could not be found!`)

const typesDir = process.env.TARGET === 'ovm' ? 'types-ovm' : 'types'

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
    outDir: `build/${typesDir}/${versionLabel}`,
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 5000,
  },
}

export default config
