const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractAddress = await getDeploymentAddresses(hre.network.name)[taskArgs.contract]
    const contract = await ethers.getContractAt(taskArgs.contract, contractAddress)
    const value = taskArgs.value
    console.log(value)
    try {
        const tx = await contract.mint({ value:value })
        console.log(`✅ [${hre.network.name}] mint()`)
        console.log(` tx: ${tx.transactionHash}`)
        let onftTokenId = await ethers.provider.getTransactionReceipt(tx.transactionHash)
        console.log(` nftId: ${parseInt(Number(onftTokenId.logs[0].topics[3]))}`)
    } catch (e) {
        console.log(e)
    }
}
