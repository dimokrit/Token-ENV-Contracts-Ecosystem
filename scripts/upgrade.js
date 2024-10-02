const fs = require("fs")
const { ethers, upgrades } = require("hardhat")
const hre = require("hardhat")
const { getDeploymentAddresses } = require("../utils/readStatic")
var addresses = require("../deployments/addresses.json")

async function upgrade() {
  const proxyName = process.argv[2]
  const implementationName = process.argv[3]
  const proxyContractAddress = await getDeploymentAddresses(hre.network.name)[proxyName]
  const Contract = await ethers.getContractFactory(implementationName)
  const contract = await upgrades.upgradeProxy(proxyContractAddress, Contract)
  console.log(`${proxyName} was upgrated succsessful:  ${contract.address}`)
  addresses[hre.network.name][proxyName] = contract.address
  fs.writeFile("./deployments/addresses.json", JSON.stringify(addresses), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

upgrade()
