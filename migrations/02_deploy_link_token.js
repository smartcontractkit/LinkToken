const version = process.env.VERSION || 'v0.4'

const { LinkToken } = require(`../build/truffle/${version}/LinkToken`)
LinkToken.setProvider(web3.currentProvider)

module.exports = function(deployer, _, accounts) {
  deployer.deploy(LinkToken, { from: accounts[0] })
}
