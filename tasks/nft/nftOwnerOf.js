const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractAddress = await getDeploymentAddresses(hre.network.name)[taskArgs.contract]
    const contract = await ethers.getContractAt(taskArgs.contract, contractAddress)
    const tokenId = taskArgs.tokenId

    try {
        const address = await contract.ownerOf(tokenId)
        console.log(`✅ [${hre.network.name}] ownerOf(${tokenId})`)
        console.log(` Owner address: ${address}`)
    } catch (e) {
        if (e?.reason) {
            console.log(e.reason)
        } else {
            console.log(e)
        }
    }
}
