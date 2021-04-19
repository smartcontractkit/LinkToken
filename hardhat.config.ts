// hardhat.config.ts
import { HardhatUserConfig, SolcConfig } from 'hardhat/types'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import '@eth-optimism/hardhat-ovm'

import { argv, hardhat, Versions } from './src'

const DEFAULT_NETWORK = 'hardhat'
const DEFAULT_VERSION = Versions.v0_6

const _settings = (runs: number) => ({
  optimizer: {
    runs,
    enabled: true,
  },
  metadata: {
    // To support Go code generation from build artifacts
    // we need to remove the metadata from the compiled bytecode.
    bytecodeHash: 'none',
  },
})

const versions: Record<Versions, SolcConfig> = {
  [Versions.v0_4]: { version: '0.4.16', settings: _settings(200) },
  [Versions.v0_6]: { version: '0.6.12', settings: _settings(200) },
  [Versions.v0_7]: { version: '0.7.6', settings: _settings(1_000_000) },
}

// Require version exists
const versionLabel = process.env.VERSION || DEFAULT_VERSION
const compiler = versions[versionLabel as Versions]
if (!compiler) throw Error(`Compiler for ${versionLabel} could not be found!`)

// Setup networks
const networks: { [key: string]: any } = {
  optimism: {
    url: 'http://127.0.0.1:8545',
    ovm: true, // ensures contracts will be compiled to OVM target.
  },
}
const targetNetwork = (argv.network as string) || DEFAULT_NETWORK
const typesDir = networks[targetNetwork]?.ovm ? `types-ovm` : 'types'

const config: HardhatUserConfig = {
  defaultNetwork: DEFAULT_NETWORK,
  networks,
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
