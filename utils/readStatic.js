const addresses = require("../deployments/addresses.json")

function getDeploymentAddresses(networkName) {
    const rtnAddresses = addresses[networkName]
    if (rtnAddresses === undefined) {
        throw new Error("Invalid network name or no anyone contract was deployed in " + networkName)
    }
    return rtnAddresses
}

module.exports = {
    getDeploymentAddresses
}