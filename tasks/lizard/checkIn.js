const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractName = "Lizard"
    const contractAddress = await getDeploymentAddresses(hre.network.name)[contractName]
    const contract = await ethers.getContractAt(contractName, contractAddress)

    let tx = await contract.checkIn()

    console.log(`✅ Check in successful [${hre.network.name}], txHash=${tx.hash}`)
}
