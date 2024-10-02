const shell = require("shelljs")
const environments = require("../../constants/environments.json")

module.exports = async function (taskArgs) {
    const availableNetworks = environments[taskArgs.e]
    if (!taskArgs.e || availableNetworks.length === 0) {
        console.log(`Invalid environment argument: ${taskArgs.e}`)
    }

    const networks = taskArgs.networks.split(',')

    //deploy proxy oft
    if (taskArgs.proxyContract !== undefined) {
        console.log(`deploying ${taskArgs.contract} to chain ${taskArgs.proxyNetwork}`)
        const deployProxyCommand = `HARDHAT_NETWORK=${taskArgs.proxyNetwork} node scripts/${taskArgs.contract}_DeployProxy`
        console.log("deployProxyCommand: " + deployCommand)
        shell.exec(deployProxyCommand)
    }

    //deploy oft's
    networks.map(async (network) => {
        if (!availableNetworks.includes(network)) {
            console.log("Invalid network argument: " + network)
            return
        }
        if (network !== taskArgs.proxyChain) {
            console.log(`deploying ${taskArgs.contract} to chain ${network}`)
            const deployCommand = `HARDHAT_NETWORK=${network} node scripts/${taskArgs.contract}_DeployProxy`
            console.log("deployCommand: " + deployCommand)
            shell.exec(deployCommand)
        }
    })
    //wire
    console.log({ networks: networks }, "  ", networks.length)
    if (networks.length > 1)
        networks.map(async (source) => {
            let srcContract, dstContract
            networks.map(async (destination) => {
                if (taskArgs.proxyChain) {
                    if (source === taskArgs.proxyChain && destination === taskArgs.proxyChain) {
                        srcContract = taskArgs.proxyContract
                        dstContract = taskArgs.proxyContract
                    } else if (source === taskArgs.proxyChain) {
                        srcContract = taskArgs.proxyContract
                        dstContract = taskArgs.contract
                    } else if (destination === taskArgs.proxyChain) {
                        srcContract = taskArgs.contract
                        dstContract = taskArgs.proxyContract
                    } else {
                        srcContract = taskArgs.contract
                        dstContract = taskArgs.contract
                    }
                } else {
                    srcContract = taskArgs.contract
                    dstContract = taskArgs.contract
                }

                let wireUpCommand = `npx hardhat --network ${source} setTrustedRemote --target-network ${destination} --local-contract ${srcContract} --remote-contract ${dstContract}`
                console.log("wireUpCommand: " + wireUpCommand)
                shell.exec(wireUpCommand)
            })
        })

    //check
    if (networks.length > 1) {
        let checkWireUpCommand
        if (taskArgs.proxyChain === undefined) {
            checkWireUpCommand = `npx hardhat checkWireUpAll --e ${taskArgs.e} --contract ${taskArgs.contract}`
        } else {
            checkWireUpCommand = `npx hardhat checkWireUpAll --e ${taskArgs.e} --contract ${taskArgs.contract} --proxy-chain ${taskArgs.proxyChain} --proxy-contract ${taskArgs.proxyContract}`
        }
        console.log("checkWireUpCommand: " + checkWireUpCommand)
        shell.exec(checkWireUpCommand)

        //print addresses
        let getAddressesCommand
        if (taskArgs.proxyChain !== undefined) {
            getAddressesCommand = `node utils/getAddresses ${taskArgs.e} ${taskArgs.proxyContract},${taskArgs.contract}`
        } else {
            getAddressesCommand = `node utils/getAddresses ${taskArgs.e} ${taskArgs.contract}`
        }
        console.log("getAddressesCommand: " + getAddressesCommand)
        shell.exec(getAddressesCommand)
    }
}
