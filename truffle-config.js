const HDWalletProvider = require('@truffle/hdwallet-provider')

const MNEMONIC =
  process.env.MNEMONIC ||
  'clock radar mass judge dismiss just intact mind resemble fringe diary casino'
const API_KEY = process.env.API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

module.exports = {
  //$ truffle test --network <network-name>
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // match any network
    },
    goerli: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://goerli.infura.io/v3/${API_KEY}`),
      network_id: 5,
      gas: 7000000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true,
    },
    maticMumbai: {
      provider: () => new HDWalletProvider(MNEMONIC, 'https://rpc-mumbai.matic.today'),
      network_id: 80001,
      gas: 7000000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true,
    },
    mainnet: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://mainnet.infura.io/v3/${API_KEY}`),
      network_id: 1,
      gas: 7000000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.6.6', // Fetch exact version from solc-bin (default: truffle's version)
      parser: 'solcjs',
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 1337,
        },
        evmVersion: 'istanbul',
      },
    },
  },

  verify: {
    preamble: 'LINK\nVersion: 0.1.0',
  },

  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
  },
}
