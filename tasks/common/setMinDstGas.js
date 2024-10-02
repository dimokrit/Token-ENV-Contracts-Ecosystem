const CHAIN_ID = require("../../constants/chainIds.json")
const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractAddress = await getDeploymentAddresses(hre.network.name)[taskArgs.contract]
    const contract = await hre.ethers.getContractAt(taskArgs.contract, contractAddress)
    const dstChainId = CHAIN_ID[taskArgs.targetNetwork]
    const tx = await contract.setMinDstGas(dstChainId, taskArgs.packetType, taskArgs.minGas)

    console.log(`[${hre.network.name}] setMinDstGas tx hash ${tx.hash}`)
    await tx.wait()
}