const { expect } = require("chai")
const { ethers, upgrades } = require("hardhat")

const contractName = "Lizard_Airdrop_Pass"

describe(contractName + ": ", function () {
    let owner, add1, add2, LIZARDPASS, _LIZARDPASS
    const price = 1000
    const uri = "uri"

    beforeEach(async function () {
        owner = (await ethers.getSigners())[0]
        add1 = (await ethers.getSigners())[1]
        add2 = (await ethers.getSigners())[2]
        _LIZARDPASS = await ethers.getContractFactory(contractName)
        LIZARDPASS = await upgrades.deployProxy(_LIZARDPASS, [uri, price], {initializer: "initialize"});
    })

    it("sendFrom() - your own tokens", async function () {
        const tokenId = 0
        await LIZARDPASS.mint({value: 1000})

        // verify the owner of the token is on the source chain
        expect(await LIZARDPASS.ownerOf(tokenId)).to.be.equal(owner.address)

        // can transfer token as regular erC721
        await LIZARDPASS.transferFrom(owner.address, add1.address, tokenId)
        expect(await LIZARDPASS.ownerOf(tokenId)).to.be.equal(add1.address)
    })

    it("check transfer is unblocked and blocked", async function () {
        //check function mint
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)

        //check function transfer is unblocked
        await LIZARDPASS.transferFrom(owner.address, add1.address, 0)
        expect(await LIZARDPASS.balanceOf(add1.address)).to.be.eq(1)

        //check function safeTransferFrom is blocked
        await LIZARDPASS.setTransferStatus(false)

        //check function transferFrom is blocked
        await expect(LIZARDPASS.connect(add1).transferFrom(add1.address, owner.address, 0)).to.be.revertedWith("Transfer is blocked")
    })

    it("buy nft for 1$", async function () {
        //price = 1000
        //check function mint is reverted with incorrect value
        await expect(LIZARDPASS.mint({value: 100})).to.be.revertedWith("Fund amount is incorrect")

        //check function mint is success with correct value
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(1000)

        //check function mint is success with upper correct value
        await LIZARDPASS.connect(add1).mint({value: 2000})
        expect(await LIZARDPASS.balanceOf(add1.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(3000)

        //check function mint is success after set price
        await LIZARDPASS.setPrice(1500)
        await expect(LIZARDPASS.connect(add2).mint({value: 1000})).to.be.revertedWith("Fund amount is incorrect")

        await LIZARDPASS.connect(add2).mint({value: 1500})
        expect(await LIZARDPASS.balanceOf(add2.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(4500)
    })

    it("only 1 nft can be stored", async function () {
        //price = 1000
        //mint the first nft
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)
        
        //mint the second nft
        await expect(LIZARDPASS.mint({value: 1000})).to.be.revertedWith("You already have a pass")
    })

    it("burn is unavailable", async function () {
        //price = 1000
        //mint the first nft
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)
        
        //check transferFrom revert when transfer to zero address
        await expect(LIZARDPASS.transferFrom(owner.address, ethers.constants.AddressZero, 0)).to.be.revertedWith("ERC721: transfer to the zero address")
    })

    it("check function mint v1", async function () {
        // price = 1000
        // test function mint
        // check function mint is reverted with incorrect value
        await expect(LIZARDPASS.mint({value: 100})).to.be.revertedWith("Fund amount is incorrect")

        // check function mint is successed with correct value by owner
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(1000)

        // check function mint is successed with correct value not by owner
        await LIZARDPASS.connect(add1).mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(add1.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(2000)
    })

    it("upgrade with overriden function mint", async function () {
        // price = 1000
        // check function mint is unsuccessed with value = 111
        await expect(LIZARDPASS.connect(add1).mint({value: 111})).to.be.revertedWith("Fund amount is incorrect")

        // check function mint is successed with value = 1000
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(1000)

        // upgrade contract to LifttPassONFT_1_UpgradeableV2 with new require (value = 111) added to mint function
        const _LizardPASS = await ethers.getContractFactory("Lizard_Airdrop_Pass_V2_Test")
        const LizardPASSV2 = await upgrades.upgradeProxy(LIZARDPASS.address, _LizardPASS);

        // check overriden function mint is unsuccessed with value = 1000
        await expect(LizardPASSV2.connect(add1).mint({value: 1000})).to.be.revertedWith("Fund amount is incorrect")

        // check overriden function mint is successed with value = 111
        await LizardPASSV2.connect(add1).mint({value: 111})
        expect(await LizardPASSV2.balanceOf(add1.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LizardPASSV2.address)).to.be.eq(1111)
    })

    it("upgrade with new function getVersion", async function () {
        // upgrade contract to LifttPassONFT_1_UpgradeableV2 with new function getVersion
        // it returns string version of the contract (2.0)
        const _LizardPASS = await ethers.getContractFactory("Lizard_Airdrop_Pass_V2_Test")
        const LizardPASSV2 = await upgrades.upgradeProxy(LIZARDPASS.address, _LizardPASS);

        expect(await LizardPASSV2.getVersion()).to.be.eq("2.0")
    })

    it("withdraw revert if not owner", async function () {
        // price = 1000
        // check function mint is success
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(1000)

        // check function mint is success
        await LIZARDPASS.connect(add1).mint({value: 2000})
        expect(await LIZARDPASS.balanceOf(add1.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(3000)

        // check function withdrawPart reverts
        await expect(LIZARDPASS.connect(add1).withdrawPart(500)).to.be.revertedWith("Ownable: caller is not the owner")
        // check function withdrawAll reverts
        await expect(LIZARDPASS.connect(add1).withdrawAll()).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("withdraw founds", async function () {
        // price = 1000
        // check function mint is success
        await LIZARDPASS.mint({value: 1000})
        expect(await LIZARDPASS.balanceOf(owner.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(1000)

        // check function mint is success
        await LIZARDPASS.connect(add1).mint({value: 2000})
        expect(await LIZARDPASS.balanceOf(add1.address)).to.be.eq(1)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(3000)

        // withdrawPart
        await LIZARDPASS.withdrawPart(111)
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(2889)

        // withdrawAll
        await LIZARDPASS.withdrawAll()
        expect(await ethers.provider.getBalance(LIZARDPASS.address)).to.be.eq(0)
    })
})