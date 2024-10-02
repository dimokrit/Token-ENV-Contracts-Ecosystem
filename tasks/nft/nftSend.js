const CHAIN_ID = require("../../constants/chainIds.json")
const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const signers = await ethers.getSigners()
    const owner = signers[0]
    const toAddress = taskArgs.toAddress
    if (!toAddress) {
        console.log("Must pass in toAddress")
        return
    }
    const tokenId = taskArgs.tokenId

    const contractAddress = await getDeploymentAddresses(hre.network.name)[taskArgs.contract]
    const contract = await ethers.getContractAt(taskArgs.contract, contractAddress)

    const tx = await contract.transferFrom(
        owner.address, // 'from' address to send tokens
        toAddress, // 'to' address to send tokens
        tokenId, // tokenId to send
    )
    console.log(`✅ [${hre.network.name}] sendFrom tx: ${tx.hash}`)
    await tx.wait()
}
