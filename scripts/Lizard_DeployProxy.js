const { ethers, upgrades } = require("hardhat")
const hre = require("hardhat");
const fs = require("fs")
const LZ_ENDPOINTS = require("../constants/layerzeroEndpoints.json")
const { getNamedAccounts } = require("hardhat")
var addresses = require("../deployments/addresses.json")

async function main() {
  const network = hre.network.name
  const endpointAddr = LZ_ENDPOINTS[network]
  const { deployer } = await getNamedAccounts()

  const Contract = await ethers.getContractFactory("Lizard")
  const contract = await upgrades.deployProxy(Contract, [endpointAddr, deployer], { initializer: "initialize" })
  console.log("Lizard deployed to:", contract.address)
  addresses[network]["Lizard"] = contract.address
  fs.writeFile("./deployments/addresses.json", JSON.stringify(addresses), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

main();