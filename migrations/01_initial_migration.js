const version = process.env.VERSION || 'v0.4'

const { Migrations } = require(`../build/truffle/${version}/Migrations`)
Migrations.setProvider(web3.currentProvider)

module.exports = function(deployer, _, accounts) {
  deployer.deploy(Migrations, { from: accounts[0] })
}
