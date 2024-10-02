const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractName = "Lizard"
    const contractAddress = await getDeploymentAddresses(hre.network.name)[contractName]
    const contract = await ethers.getContractAt(contractName, contractAddress)

    let interval = await contract.checkInInterval()

    console.log(`✅ Check in interval is ${interval} seconds`)
}
