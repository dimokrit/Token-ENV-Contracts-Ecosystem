const { expect } = require("chai")
const { ethers, upgrades } = require("hardhat")

const contractName = "Lizard"

const types = {
    PermitData: [
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
}

describe(contractName + ": ", function () {
    const chainIdSrc = 31337 // Local hardhat chainId

    let owner,
        testAccount1,
        testAccount2,
        testApprover,
        lzEndpointMock,
        lzEndpointSrcMock,
        LizardContract,
        Lizard
    
    beforeEach(async function () {
        owner = (await ethers.getSigners())[0]
        testAccount1 = (await ethers.getSigners())[1]
        testAccount2 = (await ethers.getSigners())[2]
        testApprover = await ethers.Wallet.createRandom()

        lzEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        lzEndpointSrcMock = await lzEndpointMock.deploy(chainIdSrc)
        await lzEndpointSrcMock.deployed()

        LizardContract = await ethers.getContractFactory(contractName)
        Lizard = await upgrades.deployProxy(LizardContract, [lzEndpointSrcMock.address, owner.address], { initializer: "initialize" })// Assuming approver is the owner
        await Lizard.deployed()
    })

    describe("Transfer blocking functionality:", function () {
        const amount = 111
        const adapterParams = '0x'
        const zroAddress = '0x0000000000000000000000000000000000000000'
        const useZro = false

        beforeEach(async function () {
            await Lizard.connect(testAccount1)
            await Lizard.setApprover(testApprover.address)
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date + 3600 // Expires in 1 hour
            // In a real environment, domain separator is: await Lizard.domainSeparator()
            // In hardhat, domain separator is this:
            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const permitData = {
                recipient: testAccount1.address,
                amount: amount,
                nonce: await Lizard.nonce(testAccount1.address),
                deadline: deadline,
            }

            const signature = await testApprover._signTypedData(domain, types, permitData)

            // Mint tokens with permit
            await Lizard.connect(testAccount1).mintWithPermit(permitData, signature)
        })

        it("check transfer is blocked", async function () {
            // check token balance
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(amount)
            // check transfer ERC20 is blocked
            await expect(Lizard.connect(testAccount1).transfer(owner.address, amount)).to.be.revertedWith("Transfer is blocked")

            // check lz transfer is blocked
            await lzEndpointSrcMock.setDestLzEndpoint(Lizard.address, lzEndpointSrcMock.address)
            await Lizard.setTrustedRemoteAddress(chainIdSrc, Lizard.address)
            const [nativeFee] = await Lizard.estimateSendFee(chainIdSrc, owner.address, amount, useZro, adapterParams);
            await expect(Lizard.connect(testAccount1).sendFrom(testAccount1.address, chainIdSrc, owner.address, amount, testAccount1.address, zroAddress, adapterParams)).to.be.revertedWith("Transfer is blocked");
        })

        it("check transfer is unblocked", async function () {
            // check token balance
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(amount)

            await Lizard.setTransferStatus(true)
            // check transfer ERC20 is blocked
            await Lizard.connect(testAccount1).transfer(owner.address, amount)
            expect(await Lizard.balanceOf(owner.address)).to.equal(amount)

            // check lz transfer is unblocked
            await lzEndpointSrcMock.setDestLzEndpoint(Lizard.address, lzEndpointSrcMock.address)
            await Lizard.setTrustedRemoteAddress(chainIdSrc, Lizard.address)
            const [nativeFee] = await Lizard.estimateSendFee(chainIdSrc, testAccount1.address, amount, useZro, adapterParams);
            await Lizard.sendFrom(owner.address, chainIdSrc, testAccount1.address, amount, owner.address, zroAddress, adapterParams, { value: nativeFee._hex })
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(amount)
        })
    })

    describe("SetApprover functionality:", function () {
        it("setApprover() - set new approver", async function () {
            await Lizard.setApprover(testAccount1.address)
            expect(await Lizard.approver()).to.equal(testAccount1.address)
        })

        it("setApprover() - reverts if not owner", async function () {
            await expect(Lizard.connect(testAccount1).setApprover(testApprover.address)).to.be.revertedWith("Ownable: caller is not the owner")
        })
    })

    describe("MintableWithPermit functionality:", function () {
        beforeEach(async function () {
            await Lizard.connect(testAccount1)
            await Lizard.setApprover(testApprover.address)
        })

        it("nonce() - returns 0 when called for the first time", async function () {
            expect(await Lizard.nonce(testAccount1.address)).to.equal(0)
        })

        it("mintWithPermit() - mints tokens with a valid permit", async function () {
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date + 3600 // Expires in 1 hour

            // In a real environment, domain separator is: await Lizard.domainSeparator()
            // In hardhat, domain separator is this:
            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const permitData = {
                recipient: testAccount1.address,
                amount: 113,
                nonce: await Lizard.nonce(testAccount1.address),
                deadline: deadline,
            }

            const signature = await testApprover._signTypedData(domain, types, permitData)

            // Mint tokens with permit
            await Lizard.connect(testAccount1).mintWithPermit(permitData, signature)

            // Verify token balance
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(113)
        })

        it("mintWithPermit() - reverts with an expired permit", async function () {
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date - 3600 // Expires in 1 hour

            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const permitData = {
                recipient: testAccount1.address,
                amount: 123,
                nonce: await Lizard.nonce(testAccount1.address),
                deadline: deadline,
            }

            const signature = await testApprover._signTypedData(domain, types, permitData)

            await expect(Lizard.connect(testAccount1).mintWithPermit(permitData, signature)).to.be.revertedWith("Permit expired")
        })

        it("mintWithPermit() - reverts with an invalid signature", async function () {
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date + 3600 // Expires in 1 hour

            // In a real environment, domain separator is: await Lizard.domainSeparator()
            // In hardhat, domain separator is this:
            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const permitData = {
                recipient: testAccount1.address,
                amount: 1234,
                nonce: await Lizard.nonce(testAccount1.address),
                deadline: deadline,
            }

            // Sign permit data with owner's address instead of testApprover's address
            const signature = await owner._signTypedData(domain, types, permitData)

            // Mint tokens with permit (should revert)
            await expect(Lizard.connect(testAccount1).mintWithPermit(permitData, signature)).to.be.revertedWith("Invalid signature")
        })

        it("mintWithPermit() - reverts when using the same nonce twice - same amounts", async function () {
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date + 3600 // Expires in 1 hour

            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const nonce = await Lizard.nonce(testAccount1.address)

            const permitData = {
                recipient: testAccount1.address,
                amount: 10,
                nonce: nonce,
                deadline: deadline,
            }

            const signature = await testApprover._signTypedData(domain, types, permitData)

            // Mint tokens with permit (first time successful)
            await expect(Lizard.connect(testAccount1).mintWithPermit(permitData, signature)).to.be.ok

            await expect(Lizard.connect(testAccount1).mintWithPermit(permitData, signature)).to.be.revertedWith("Nonce already used")
        })

        it("mintWithPermit() - reverts when using the same nonce twice - different amounts", async function () {
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date + 3600 // Expires in 1 hour

            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const nonce = await Lizard.nonce(testAccount1.address)

            const permitData1 = {
                recipient: testAccount1.address,
                amount: 10,
                nonce: nonce,
                deadline: deadline,
            }
            console.log("permit data: ", JSON.stringify(permitData1, null, 2))
            const signature1 = await testApprover._signTypedData(domain, types, permitData1)
            await Lizard.connect(testAccount1).mintWithPermit(permitData1, signature1)

            const permitData2 = {
                recipient: testAccount1.address,
                amount: 15,
                nonce: nonce,
                deadline: deadline,
            }
            const signature2 = await testApprover._signTypedData(domain, types, permitData2)
            await expect(Lizard.connect(testAccount1).mintWithPermit(permitData2, signature2)).to.be.revertedWith("Nonce already used")
        })

        it("mintWithPermit() - reverts amount is wrong", async function () {
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date + 3600 // Expires in 1 hour

            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const permitDataToSign = {
                recipient: testAccount1.address,
                amount: 5,
                nonce: await Lizard.nonce(testAccount1.address),
                deadline: deadline,
            }

            const signature = await testApprover._signTypedData(domain, types, permitDataToSign)

            const permitDataToCall = {
                recipient: testAccount1.address,
                amount: 10,
                nonce: await Lizard.nonce(testAccount1.address),
                deadline: deadline,
            }

            await expect(Lizard.connect(testAccount1).mintWithPermit(permitDataToCall, signature)).to.be.revertedWith("Invalid signature")
        })

        it("mintWithPermit() - reverts if the caller is not the permitted recipient", async function () {
            const date = (await ethers.provider.getBlock("latest")).timestamp
            const deadline = date + 3600 // Expires in 1 hour

            const domain = {
                name: "Lizard",
                version: "1",
                chainId: chainIdSrc,
                verifyingContract: Lizard.address,
            }

            const permitData = {
                recipient: testAccount1.address,
                amount: 105,
                nonce: await Lizard.nonce(testAccount1.address),
                deadline: deadline,
            }

            const signature = await owner._signTypedData(domain, types, permitData)

            await expect(Lizard.connect(owner).mintWithPermit(permitData, signature)).to.be.revertedWith("Invalid recipient")
        })
    })

    describe("CheckIn functionality:", function () {
        it("check default checkin configuration", async function () {
            expect(await Lizard.checkInEnabled()).to.be.equal(true)
            expect(await Lizard.checkInInterval()).to.be.equal(86400) // 1 day
            expect(await Lizard.streak1Reward()).to.be.equal(10)
            expect(await Lizard.streak7Reward()).to.be.equal(50)
            expect(await Lizard.streak30Reward()).to.be.equal(100)
        })

        it("checkIn() - reverts if check-in is disabled", async function () {
            await Lizard.setCheckInEnabled(false) // Disable check-in
            await expect(Lizard.connect(testAccount1).checkIn()).to.be.revertedWith("Check-in feature is currently disabled.")
        })

        it("checkIn() - reverts if not enough time has passed since last check-in", async function () {
            await Lizard.connect(testAccount1).checkIn() // First check-in

            await expect(Lizard.connect(testAccount1).checkIn()).to.be.revertedWith("Check-in not allowed yet. Please wait for a day.")
        })

        it("checkIn() - updates streak count and balance correctly", async function () {
            const checkInInterval = await Lizard.checkInInterval()
            const streak1Reward = await Lizard.streak1Reward()

            await Lizard.connect(testAccount1).checkIn()
            expect(await Lizard.streakCount(testAccount1.address)).to.equal(1)
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(streak1Reward)

            await ethers.provider.send("evm_increaseTime", [checkInInterval.toNumber()])
            await ethers.provider.send("evm_mine")

            await Lizard.connect(testAccount1).checkIn()
            expect(await Lizard.streakCount(testAccount1.address)).to.equal(2)
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(2 * streak1Reward)
        })

        it("checkIn() - updates sevenStreakReward correctly", async function () {
            const checkInInterval = await Lizard.checkInInterval()
            const streak1Reward = Number(await Lizard.streak1Reward())
            const streak7Reward = Number(await Lizard.streak7Reward())

            let lastCheckInAmount = 0
            let beforeBalance = 0
            for (let i = 0; i < 7; i++) {
                // Make check-ins
                await Lizard.connect(testAccount1).checkIn()
                let afterBalance = (await Lizard.balanceOf(testAccount1.address)).toNumber()
                lastCheckInAmount = afterBalance - beforeBalance
                beforeBalance = afterBalance
                // Update time
                await ethers.provider.send("evm_increaseTime", [checkInInterval.toNumber()])
                await ethers.provider.send("evm_mine")
            }

            expect(await Lizard.streakCount(testAccount1.address)).to.equal(7)
            expect(lastCheckInAmount).to.equal(streak7Reward)
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(streak1Reward * 6 + streak7Reward)
        })

        it("checkIn() - updates thirtyStreakReward correctly", async function () {
            const checkInInterval = await Lizard.checkInInterval()
            const streak1Reward = Number(await Lizard.streak1Reward())
            const streak7Reward = Number(await Lizard.streak7Reward())
            const streak30Reward = Number(await Lizard.streak30Reward())

            let lastCheckInAmount = 0
            let beforeBalance = 0
            for (let i = 0; i < 30; i++) {
                // Make check-ins
                await Lizard.connect(testAccount1).checkIn()
                let afterBalance = (await Lizard.balanceOf(testAccount1.address)).toNumber()
                lastCheckInAmount = afterBalance - beforeBalance
                beforeBalance = afterBalance
                // Update time
                await ethers.provider.send("evm_increaseTime", [checkInInterval.toNumber()])
                await ethers.provider.send("evm_mine")
            }

            expect(await Lizard.streakCount(testAccount1.address)).to.equal(30)
            expect(lastCheckInAmount).to.equal(streak30Reward)
            expect(await Lizard.balanceOf(testAccount1.address)).to
                .equal(streak1Reward * 25 + streak7Reward * 4 + streak30Reward)
        })

        it("checkIn() - only users having Lizard Airdrop Pass", async function () {
            const streak1Reward = await Lizard.streak1Reward()

            const _LizardPASS = await ethers.getContractFactory("Lizard_Airdrop_Pass")
            const LizardPASS = await upgrades.deployProxy(_LizardPASS, ["uri", 1000], {initializer: "initialize"});

            await Lizard.setLizardPassAddr(LizardPASS.address)

            await expect(Lizard.connect(testAccount1).checkIn()).to.be.revertedWith("You have to buy Lizard Airdrop Pass")

            await LizardPASS.connect(testAccount1).mint({ value: 1000 })
            expect(await LizardPASS.ownerOf(0)).to.be.equal(testAccount1.address)

            await Lizard.connect(testAccount1).checkIn()
            expect(await Lizard.streakCount(testAccount1.address)).to.equal(1)
            expect(await Lizard.balanceOf(testAccount1.address)).to.equal(streak1Reward)
        })
    })

    describe("Upgadebility", function () {
        beforeEach(async function () {
            await Lizard.connect(testAccount1)
        })

        it("check function setApprover v1", async function () {
            // test setApprover mint
            // check function mint is successed with approver = testApprover
            await Lizard.setApprover(testApprover.address)

            expect(await Lizard.approver()).to.be.eq(testApprover.address)
        })

        it("upgrade with overriden function setApprover", async function () {
            // upgrade contract to LifttPassONFT_1_UpgradeableV2 with new require (approver = owner) added to setApprover function
            const _LizardOFT_V2 = await ethers.getContractFactory("Lizard_V2_Test")
            const LizardOFT_V2 = await upgrades.upgradeProxy(Lizard.address, _LizardOFT_V2);

            // check overriden function setApprover is unsuccessed with approver = testApprover
            await expect(LizardOFT_V2.setApprover(testApprover.address)).to.be.revertedWith("Approver have to be owner")

            // check overriden function mint is successed with approver = owner
            await LizardOFT_V2.setApprover(owner.address)
            expect(await Lizard.approver()).to.be.eq(owner.address)
        })

        it("upgrade with new function getVersion", async function () {
            // upgrade contract to LifttPassONFT_1_UpgradeableV2 with new function getVersion
            // it returns string version of the contract (2.0)
            const _LizardOFT_V2 = await ethers.getContractFactory("Lizard_V2_Test")
            const LizardOFT_V2 = await upgrades.upgradeProxy(Lizard.address, _LizardOFT_V2);

            expect(await LizardOFT_V2.getVersion()).to.be.eq("2.0")
        })
    })
})
