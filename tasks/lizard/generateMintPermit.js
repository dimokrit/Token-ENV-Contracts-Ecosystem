const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractName = "Lizard"
    const contractAddress = await getDeploymentAddresses(hre.network.name)[contractName]
    const Lizard = await ethers.getContractAt(contractName, contractAddress)

    try {
        const [owner] = await ethers.getSigners() // Approver

        console.log("Generating mint permit on behalf on", owner.address)
        const deadline = Math.floor(Date.now() / 1000) + 3600
        const nonce = await Lizard.nonce(taskArgs.recipient)
        console.log(`nonce: ${nonce}`)
        console.log(`deadline: ${deadline}`)

        const domain = {
            name: "Lizard",
            version: "1",
            chainId: hre.network.config.chainId,
            verifyingContract: Lizard.address,
        }

        const types = {
            PermitData: [
                { name: "recipient", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        }

        const permitData = {
            recipient: taskArgs.recipient,
            amount: Number(taskArgs.amount),
            nonce: nonce,
            deadline: deadline,
        }

        const signature = await owner._signTypedData(domain, types, permitData)

        console.log("Permit data:")
        console.log(JSON.stringify(permitData, null, 2))
        console.log("Signature:", signature)
    } catch (e) {
        console.log(e)
    }
}
