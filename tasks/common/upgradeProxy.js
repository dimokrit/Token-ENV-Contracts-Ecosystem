const environments = require("../../constants/environments.json")
const shell = require("shelljs")

module.exports = async function (taskArgs) {
  const availableNetworks = environments["testnet"]//ONLY TESTNET UPGRADES WITH TEST CONTRACT V2
  const networks = taskArgs.networks.split(',')

  networks.map(async (network) => {
    if (!availableNetworks.includes(network)) {
      console.log("Invalid network argument: " + network)
      return
    }
    console.log(`upgrade proxy ${taskArgs.proxy} in chain ${network} with new implementation ${taskArgs.implementation}`)
    const deployCommand = `HARDHAT_NETWORK=${network} node scripts/upgrade ${taskArgs.proxy} ${taskArgs.implementation}`
    console.log("upgradeCommand: " + deployCommand)
    shell.exec(deployCommand)
  })
}
