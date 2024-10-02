const { ethers, upgrades } = require("hardhat");
var addresses = require("../deployments/addresses.json")
const hre = require("hardhat");
const fs = require("fs")

async function main() {
  const uri = "uri"
  const price = 1000
  const network = hre.network.name
  const Contract = await ethers.getContractFactory("Lizard_Airdrop_Pass");
  const contract = await upgrades.deployProxy(Contract, [uri, price], { initializer: "initialize" });
  console.log("Lizard_Airdrop_Pass deployed to:", contract.address);
  addresses[network]["Lizard_Airdrop_Pass"] = contract.address
  fs.writeFile("./deployments/addresses.json", JSON.stringify(addresses), function (err) {
    if (err) {
      console.log(err);
    }
  });
}

main();