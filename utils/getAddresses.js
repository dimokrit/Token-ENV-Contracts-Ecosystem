const environments = require("../constants/environments.json")
const fs = require("fs")
const addresses = require("../deployments/addresses.json")

const environmentArg = process.argv[2]
const contractCsvArg = process.argv[3]

async function getAddresses(environment, contractCsv) {
    let contracts = contractCsv.split(",")
    const promises = []
    for (const contract of contracts) {
        promises.push("\n" + contract)
        const networks = environments[environment];
        for (const network of networks) {
            promises.push(getAddressForNetwork(contract, network))
        }
    }
    const resolvedPromises = await Promise.all(promises)
    resolvedPromises.forEach((networkAddressStr) => {
        console.log(networkAddressStr)
    })
}

function getAddressForNetwork(contract, network) {
    return new Promise((res) => {
        const _addresses = addresses[network]
            if (_addresses === undefined) {
                console.log(`Invalid network`)
                return
            }
        let address = _addresses[contract]
            if (address === undefined) {
                address = "none"
            }
            res(`${network}: ${address}`)
    })
}

// to run: node getAddresses ${ENVIRONMENT} ${CONTRACT_CSV}
// example: node getAddresses testnet Relayer,Endpoint,UltraLightNode
getAddresses(environmentArg, contractCsvArg).then((res) => console.log("\nComplete!"))
