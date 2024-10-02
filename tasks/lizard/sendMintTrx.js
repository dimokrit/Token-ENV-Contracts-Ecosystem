const { getDeploymentAddresses } = require("../../utils/readStatic")

module.exports = async function (taskArgs, hre) {
    const contractName = "Lizard"
    const contractAddress = await getDeploymentAddresses(hre.network.name)[contractName]
    const Lizard = await ethers.getContractAt(contractName, contractAddress)

    const amount = taskArgs.amount
    const [owner] = await hre.ethers.getSigners() // Approver
    const value = 0
    const gasPrice = hre.ethers.provider.getGasPrice()
    const gasLimit = 1000000
    let nonce = hre.ethers.provider.getTransactionCount(owner.address, 'latest')
    const abi = ["function mint(uint256)"]
    const iface = new hre.ethers.utils.Interface(abi);
    const data = iface.encodeFunctionData("mint", [amount])
    const tx = {
        from: owner.address,
        to: Lizard.address,
        value: value,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        nonce: nonce,
        data: data
    }
    const transaction = await owner.sendTransaction(tx)
    //token is burned on the sending chain
    console.log(`✅ Check in successful [${hre.network.name}], txHash: ${transaction.hash}`)
}
