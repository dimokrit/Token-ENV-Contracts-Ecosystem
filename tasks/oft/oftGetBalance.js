const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    let signers = await ethers.getSigners()
    let owner = signers[0]

    let localContract = taskArgs.contract

    if (!localContract) {
        console.log("Must pass in contract name")
        return
    }

    // get local contract
    const network = hre.network.name
    const localContractAddress = getDeploymentAddresses(network)[localContract]
    const localContractInstance = await hre.ethers.getContractAt(localContract, localContractAddress)


    const balance = await localContractInstance.balanceOf(owner.address)
    console.log("balance: ", balance)
}
