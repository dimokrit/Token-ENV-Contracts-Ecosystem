const CHAIN_ID = require("../../constants/chainIds.json")
const environments = require("../../constants/environments.json")
const { getDeploymentAddresses } = require("../../utils/readStatic")

function TrustedRemoteTestnet() {
    this.goerli
    this.bscTestnet
    this.fuji
    this.mumbai
    this.arbitrumGoerli
    this.optimismGoerli
    this.fantomTestnet
}

function TrustedRemote() {
    this.ethereum
    this.bsc
    this.avalanche
    this.polygon
    this.arbitrum
    this.optimism
    this.fantom
}

module.exports = async function (taskArgs) {
    const environment = hre.network.name
    const environmentArray = environments[taskArgs.e]

    let trustedRemoteTable = {}

    trustedRemoteTable[environment] = taskArgs.e === "mainnet" ? new TrustedRemote() : new TrustedRemoteTestnet()

    await Promise.all(
        environmentArray.map(async (env) => {
            try {
                const contractAddress = await getDeploymentAddresses(environment)[taskArgs.contract]
                let envToCamelCase = env.replace(/-./g, (m) => m[1].toUpperCase())
                const contract = await hre.ethers.getContractAt(taskArgs.contract, contractAddress)
                const dstChainId = CHAIN_ID[env]
                trustedRemoteTable[environment][envToCamelCase] = await contract.trustedRemoteLookup(dstChainId)
            } catch (error) {
                //catch error because checkWireUpAll is reading console log as input
            }
        })
    )
    if (JSON.stringify(trustedRemoteTable[environment]).length > 2) {
        console.log(JSON.stringify(trustedRemoteTable[environment]))
    }
}
