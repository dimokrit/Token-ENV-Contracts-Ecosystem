const {BigNumber} = require("ethers");
const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractName = "Lizard"
    const contractAddress = await getDeploymentAddresses(hre.network.name)[contractName]
    const Lizard = await ethers.getContractAt(contractName, contractAddress)

    try {
        const signature = taskArgs.signature
        const recepientPrivateKey = taskArgs.recipientPrivateKey
        const recepient = new ethers.Wallet(recepientPrivateKey, hre.ethers.provider)

        const permitData = {
            recipient: recepient.address,
            amount: Number(taskArgs.amount),
            nonce: BigNumber.from(taskArgs.nonce),
            deadline: Number(taskArgs.deadline),
        }

        console.log("Permit data:")
        console.log(JSON.stringify(permitData, null, 2))

        console.log(`Executing mintWithPermit task on behalf of recepient (address ${recepient.address})`)

        const tx = await Lizard.connect(recepient).mintWithPermit(permitData, signature)
        console.log("Transaction hash:", tx.hash)
        await tx.wait()
        console.log("Tokens minted successfully!")
    } catch (e) {
        console.log(e)
    }
}
