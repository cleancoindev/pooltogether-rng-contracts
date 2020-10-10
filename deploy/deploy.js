// using plugin: buidler-deploy
// reference: https://buidler.dev/plugins/buidler-deploy.html

const {
  contractManager,
  chainName,
} = require('../js-utils/deployHelpers')

const VDFConfig = require('../vdf.config')

const debug = require('debug')('deploy.js')

module.exports = async (buidler) => {
  const { ethers, getNamedAccounts, deployments } = buidler
  const { deploy } = deployments
  const _getContract = contractManager(buidler)
  const network = await ethers.provider.getNetwork()
  const { chainId } = network

  // Named accounts, defined in buidler.config.js:
  const {
    vrfCoordinator,
    linkToken
  } = await getNamedAccounts()

  const {
    fee,
    keyHash
  } = VDFConfig

  const [ deployerWallet ] = await ethers.getSigners()

  const feeValue = fee[chainId] || fee.default
  const keyHashValue = keyHash[chainId] || keyHash.default

  debug("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
  debug("PoolTogether RNG Service - Contract Deploy Script")
  debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")

  debug("  Deploying to Network: ", chainName(chainId))

  let linkAddress = linkToken
  console.log({ linkAddress} )
  if (!linkAddress) {
    debug("\n  Deploying LINK token...")
    const linkResult = await deploy('Link', {
      contract: 'ERC20Mintable',
      from: deployerWallet._address,
      args: ['Chainlink Link', 'LINK']
    })
    linkAddress = linkResult.address
  }

  debug("\n  Using Contracts:")
  debug("  - VRF:  ", vrfCoordinator)
  debug("  - LINK: ", linkAddress)
  debug(" ")

  // Blockhash RNG
  const RNGBlockhash = await _getContract('RNGBlockhash', [])

  // Chainlink VRF
  const RNGChainlink = await _getContract('RNGChainlink', [vrfCoordinator, linkAddress])

  debug("\n  Initializing RNGChainlink:")
  debug("  - fee:  ", feeValue)
  debug("  - keyHash:  ", keyHashValue)
  debug(" ")
  await RNGChainlink.setFee(feeValue)
  await RNGChainlink.setKeyhash(keyHashValue)

  // Display Contract Addresses
  debug("\n  Contract Deployments Complete!\n")
  debug("  - RNGBlockhash:   ", RNGBlockhash.address)
  debug("  - RNGChainlink:   ", RNGChainlink.address)

  debug("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n")
}
