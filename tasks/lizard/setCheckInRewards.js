const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractName = "Lizard"
    const contractAddress = await getDeploymentAddresses(hre.network.name)[contractName]
    const contract = await ethers.getContractAt(contractName, contractAddress)

    let tx = await contract.setCheckInRewards(taskArgs.reward1, taskArgs.reward7, taskArgs.reward30)

    console.log(`✅ rewards updated [${hre.network.name}], txHash=${tx.hash}`)
}