module.exports = async function (taskArgs, hre) {
    let owner = (await ethers.getSigners())[0]
    let toAddress = owner.address
    let qty = ethers.utils.parseUnits(taskArgs.qty, 0)

    let contractAddress = taskArgs.contract
    if (!contractAddress) {
        console.log("Must pass in contract")
        return
    }
    // get local contract
    const contract = await ethers.getContract(contract)

    let tx = await (
        await contract.mintTokens(toAddress, qty)
    ).wait()
    console.log(`✅ OFT minted [${hre.network.name}] to: [${toAddress}] qty: [${qty}]`)
}
