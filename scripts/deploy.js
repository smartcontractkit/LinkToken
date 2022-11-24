async function deployLinkToken () {

  // deploy LinkToken
  const LinkToken = await ethers.getContractFactory('LinkToken')
  const linkToken = await LinkToken.deploy()
  await linkToken.deployed()
  console.log('Link Token deployed to:', linkToken.address)

  return linkToken.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployLinkToken()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployLinkToken = deployLinkToken