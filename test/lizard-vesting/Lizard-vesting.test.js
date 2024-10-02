const { expect } = require("chai");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs")


describe.only("VestingControl Test", function () {
  const zeroRoot = "0x0000000000000000000000000000000000000000000000000000000000000000"
  describe("Token", function () {
    let wallets = [10]
    let _Token
    let _Launchpad
    beforeEach(async function () {
      wallets = await ethers.getSigners();
      const Token = await ethers.getContractFactory("Token", wallets[0]);
      _Token = await Token.deploy()
      console.log()
      const Launchpad = await ethers.getContractFactory("LizardLaunchpad", wallets[0]);
      _Launchpad = await Launchpad.deploy(_Token.address)
    })

    it("it should be deployed", async function () {
      expect(_Token.address).to.be.properAddress;
      expect(_Launchpad.address).to.be.properAddress;
    })

    it("it should be minted", async function () {
      const amount = 1000
      await _Token.connect(wallets[0]).mint(wallets[0].address, amount)
      const mintedTokens = await _Token.totalSupply()
      expect(mintedTokens).to.equal(amount)
    })

    it("it should be burned", async function () {
      const amount = 1000
      await _Token.connect(wallets[0]).mint(wallets[0].address, amount)
      const mintedTokens = await _Token.totalSupply()
      expect(mintedTokens).to.equal(amount)
      console.log()
      await _Token.connect(wallets[0]).burn(wallets[0].address, amount)
      const totalTokens = await _Token.totalSupply()
      expect(totalTokens).to.equal(0)
    })
  })

  describe("Launchpad Admin", function () {
    let wallets = [10]
    let _Token
    let _Launchpad
    beforeEach(async function () {
      wallets = await ethers.getSigners();
      const Token = await ethers.getContractFactory("Token", wallets[0]);
      _Token = await Token.deploy()

      const Launchpad = await ethers.getContractFactory("LizardLaunchpad", wallets[0]);
      _Launchpad = await Launchpad.deploy(_Token.address)

      const amount = 1000
      await _Token.connect(wallets[0]).mint(_Launchpad.address, amount)
    })

    it("it should be deployed", async function () {
      expect(_Token.address).to.be.properAddress;
      expect(_Launchpad.address).to.be.properAddress;
    })

    it("set new stage", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)
      const index = 1
      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 10,
        totalPaymentPeriod: 100,
        paymentPeriod: 50,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })
    })

    it("change blacklist", async function () {
      await _Launchpad.connect(wallets[0]).setBlacklist(wallets[2].address)
      const blacklisted = await _Launchpad.blacklisted(wallets[2].address)
      expect(blacklisted).to.equal(true)

      await _Launchpad.connect(wallets[0]).setBlacklist(wallets[2].address)
      const _blacklisted = await _Launchpad.blacklisted(wallets[2].address)
      expect(_blacklisted).to.equal(false)
    })

    it("admin can register user", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1
      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 10,
        totalPaymentPeriod: 100,
        paymentPeriod: 50,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)
      await _Launchpad.connect(wallets[0]).adminRegistration(index, [wallets[1].address, wallets[2].address])

      const registered = await _Launchpad.getUserIsRegistered(index, wallets[1].address)
      expect(registered).to.equal(true)

      const _registered = await _Launchpad.getUserIsRegistered(index, wallets[2].address)
      expect(_registered).to.equal(true)

    })
  })

  describe("User basic", function () {
    let wallets = [10]
    let _Token
    let _Launchpad
    beforeEach(async function () {
      wallets = await ethers.getSigners();
      const Token = await ethers.getContractFactory("Token", wallets[0]);
      _Token = await Token.deploy()

      const Launchpad = await ethers.getContractFactory("LizardLaunchpad", wallets[0]);
      _Launchpad = await Launchpad.deploy(_Token.address)

      const amount = 1000
      await _Token.connect(wallets[0]).mint(_Launchpad.address, amount)
    })

    it("user can register", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 10,
        totalPaymentPeriod: 100,
        paymentPeriod: 50,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)
      await _Launchpad.connect(wallets[1]).stageRegistration(index)

      const registered = await _Launchpad.getUserIsRegistered(index, wallets[1].address)
      expect(registered).to.equal(true)
    })

    it("user can get first claim", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 10,
        totalPaymentPeriod: 100,
        paymentPeriod: 50,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)
      await _Launchpad.connect(wallets[1]).stageRegistration(index)
      await _Launchpad.connect(wallets[2]).stageRegistration(index)

      const registered = await _Launchpad.getUserIsRegistered(index, wallets[1].address)
      expect(registered).to.equal(true)

      await _Launchpad.connect(wallets[0]).toggleStageState(index)
      await _Launchpad.connect(wallets[1]).claim(index)

      const userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(50)

      const lBalance = await _Token.balanceOf(_Launchpad.address)
      expect(lBalance).to.equal(950)
    })

    it("require(Lock up period is active)", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 300,
        paymentPeriod: 150,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)
      await _Launchpad.connect(wallets[1]).stageRegistration(index)
      await _Launchpad.connect(wallets[2]).stageRegistration(index)

      const registered = await _Launchpad.getUserIsRegistered(index, wallets[1].address)
      expect(registered).to.equal(true)

      await _Launchpad.connect(wallets[0]).toggleStageState(index)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Lock up period is active')
    })
  })

  describe("Copmlex Test Public Sale", function () {
    let wallets = [10]
    let _Token
    let _Launchpad
    beforeEach(async function () {
      wallets = await ethers.getSigners();
      const Token = await ethers.getContractFactory("Token", wallets[0]);
      _Token = await Token.deploy()

      const Launchpad = await ethers.getContractFactory("LizardLaunchpad", wallets[0]);
      _Launchpad = await Launchpad.deploy(_Token.address)

      const amount = 1000
      await _Token.connect(wallets[0]).mint(_Launchpad.address, amount)
    })

    it("public sale #1", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 100,
        paymentPeriod: 100,
        lockUpPeriod: 100,
        maxAmountForUser: 50,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPublicSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      await expect(_Launchpad.connect(wallets[1]).publicSale(index, 100, { value: 50000 })).to.be.revertedWith('Exceed max allowed amount')
      
      await _Launchpad.connect(wallets[1]).publicSale(index, 50, { value: 25000 })

      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(0)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address is not registered')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])
      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(50)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("public sale #2", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 50,
        totalPaymentPeriod: 100,
        paymentPeriod: 100,
        lockUpPeriod: 0,
        maxAmountForUser: 50,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPublicSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)
      
      await expect(_Launchpad.connect(wallets[1]).publicSale(index, 100, { value: 50000 })).to.be.revertedWith('Exceed max allowed amount')

      await _Launchpad.connect(wallets[1]).publicSale(index, 50, { value: 25000 })

      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(25)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address is not registered')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(50)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("public sale #3", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 40,
        totalPaymentPeriod: 100,
        paymentPeriod: 25,
        lockUpPeriod: 0,
        maxAmountForUser: 100,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPublicSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)
      
      await expect(_Launchpad.connect(wallets[1]).publicSale(index, 1000, { value: 500000 })).to.be.revertedWith('Exceed max allowed amount')

      await _Launchpad.connect(wallets[1]).publicSale(index, 100, { value: 50000 })

      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(40)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [26])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(55)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [26])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(70)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [51])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(100)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("public sale #4", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 50,
        totalPaymentPeriod: 90,
        paymentPeriod: 30,
        lockUpPeriod: 0,
        maxAmountForUser: 100,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPublicSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)
      
      await expect(_Launchpad.connect(wallets[1]).publicSale(index, 1000, { value: 500000 })).to.be.revertedWith('Exceed max allowed amount')

      await _Launchpad.connect(wallets[1]).publicSale(index, 100, { value: 50000 })

      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(50)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(66)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [61])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(100)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })
  })

  describe("Copmlex Test Private Sale", function () {
    let wallets = [10]
    let _Token
    let _Launchpad
    list = []
    let merkleTree;
  
    function encodeLeaf(address) {
      return ethers.utils.defaultAbiCoder.encode(
        ["address"], [address]
      )
    }

    beforeEach(async function () {
      wallets = await ethers.getSigners()

      list = [
        encodeLeaf(wallets[0].address),
        encodeLeaf(wallets[1].address)
      ]

      merkleTree = new MerkleTree(list, keccak256, {
        hashLeaves: true,
        sortPairs: true,
        sortLeaves: true,
      });

      const Token = await ethers.getContractFactory("Token", wallets[0])
      _Token = await Token.deploy()

      const Launchpad = await ethers.getContractFactory("LizardLaunchpad", wallets[0])
      _Launchpad = await Launchpad.deploy(_Token.address)

      const amount = 1000
      await _Token.connect(wallets[0]).mint(_Launchpad.address, amount)
    })

    it("private sale #1", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1
      const root = merkleTree.getHexRoot()

      await newStage({
        whitelist: true,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 100,
        paymentPeriod: 100,
        lockUpPeriod: 100,
        maxAmountForUser: 50,
        merkleRoot: root,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPrivateSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      const leaf1 = keccak256(list[1])
      const proof1 = merkleTree.getHexProof(leaf1)

      await expect(_Launchpad.connect(wallets[1]).privateSale(index, 100, proof1, { value: 50000 })).to.be.revertedWith('Exceed max allowed amount')
      await _Launchpad.connect(wallets[1]).privateSale(index, 50, proof1, { value: 25000 })

      const leaf2 = keccak256(encodeLeaf(wallets[2].address))
      const proof2 = merkleTree.getHexProof(leaf2)
      await expect(_Launchpad.connect(wallets[2]).privateSale(index, 50, proof2, { value: 25000 })).to.be.revertedWith('Address is not in the whitelist')


      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(0)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address is not registered')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])
      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(50)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("private sale #2", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1
      const root = merkleTree.getHexRoot()

      await newStage({
        whitelist: true,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 50,
        totalPaymentPeriod: 100,
        paymentPeriod: 100,
        lockUpPeriod: 0,
        maxAmountForUser: 50,
        merkleRoot: root,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPrivateSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      const leaf1 = keccak256(list[1])
      const proof1 = merkleTree.getHexProof(leaf1)
      await expect(_Launchpad.connect(wallets[1]).privateSale(index, 100, proof1, { value: 50000 })).to.be.revertedWith('Exceed max allowed amount')
      await _Launchpad.connect(wallets[1]).privateSale(index, 50, proof1, { value: 25000 })

      const leaf2 = keccak256(encodeLeaf(wallets[2].address))
      const proof2 = merkleTree.getHexProof(leaf2)
      await expect(_Launchpad.connect(wallets[2]).privateSale(index, 50, proof2, { value: 25000 })).to.be.revertedWith('Address is not in the whitelist')

      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(25)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address is not registered')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(50)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("private sale #3", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1
      const root = merkleTree.getHexRoot()

      await newStage({
        whitelist: true,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 40,
        totalPaymentPeriod: 100,
        paymentPeriod: 25,
        lockUpPeriod: 0,
        maxAmountForUser: 100,
        merkleRoot: root,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPrivateSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      const leaf1 = keccak256(list[1])
      const proof1 = merkleTree.getHexProof(leaf1)
      await expect(_Launchpad.connect(wallets[1]).privateSale(index, 1000, proof1, { value: 500000 })).to.be.revertedWith('Exceed max allowed amount')
      await _Launchpad.connect(wallets[1]).privateSale(index, 100, proof1, { value: 50000 })

      const leaf2 = keccak256(encodeLeaf(wallets[2].address))
      const proof2 = merkleTree.getHexProof(leaf2)
      await expect(_Launchpad.connect(wallets[2]).privateSale(index, 100, proof2, { value: 50000 })).to.be.revertedWith('Address is not in the whitelist')

      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(40)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [26])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(55)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [26])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(70)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [51])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(100)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("private sale #4", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1
      const root = merkleTree.getHexRoot()

      await newStage({
        whitelist: true,
        sale: true,
        maxUsers: 100,
        totalTokenAmount: balance,
        percentTGE: 50,
        totalPaymentPeriod: 90,
        paymentPeriod: 30,
        lockUpPeriod: 0,
        maxAmountForUser: 100,
        merkleRoot: root,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).setPrivateSalePrice(500)
      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      const leaf1 = keccak256(list[1])
      const proof1 = merkleTree.getHexProof(leaf1)
      await expect(_Launchpad.connect(wallets[1]).privateSale(index, 1000, proof1, { value: 500000 })).to.be.revertedWith('Exceed max allowed amount')
      await _Launchpad.connect(wallets[1]).privateSale(index, 100, proof1, { value: 50000 })

      const leaf2 = keccak256(encodeLeaf(wallets[2].address))
      const proof2 = merkleTree.getHexProof(leaf2)
      await expect(_Launchpad.connect(wallets[2]).privateSale(index, 100, proof2, { value: 50000 })).to.be.revertedWith('Address is not in the whitelist')
      let userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(50)
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(66)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [61])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      userBalance = await _Token.balanceOf(wallets[1].address)
      expect(userBalance).to.equal(100)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })
  })

  describe("Copmlex Test Vesting", function () {
    let wallets = [10]
    let _Token
    let _Launchpad

    beforeEach(async function () {
      wallets = await ethers.getSigners()

      const Token = await ethers.getContractFactory("Token", wallets[0])
      _Token = await Token.deploy()

      const Launchpad = await ethers.getContractFactory("LizardLaunchpad", wallets[0])
      _Launchpad = await Launchpad.deploy(_Token.address)

      const amount = 1000
      await _Token.connect(wallets[0]).mint(_Launchpad.address, amount)
    })

    it("vesting #1", async function () {
      function encodeLeaf(address) {
        return ethers.utils.defaultAbiCoder.encode(
          ["address"], [address]
        )
      }

      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const list = [
        encodeLeaf(wallets[0].address),
        encodeLeaf(wallets[1].address),
        encodeLeaf(wallets[2].address)
      ]

      const merkleTree = new MerkleTree(list, keccak256, {
        hashLeaves: true,
        sortPairs: true,
        sortLeaves: true,
      });

      const index = 1
      const root = merkleTree.getHexRoot()

      await newStage({
        whitelist: true,
        sale: false,
        maxUsers: 2,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 100,
        paymentPeriod: 100,
        lockUpPeriod: 0,
        maxAmountForUser: 50,
        merkleRoot: root,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)

      const leaf1 = keccak256(encodeLeaf(wallets[1].address))
      const proof1 = merkleTree.getHexProof(leaf1)
      await _Launchpad.connect(wallets[1]).stageRegistrationWL(index, proof1)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[1].address)).to.equal(true)

      await expect(_Launchpad.connect(wallets[1]).stageRegistrationWL(index, proof1)).to.be.revertedWith('Address registered')

      const leaf2 = keccak256(encodeLeaf(wallets[2].address))
      const proof2 = merkleTree.getHexProof(leaf2)
      await _Launchpad.connect(wallets[2]).stageRegistrationWL(index, proof2)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[2].address)).to.equal(true)

      const leaf3 = keccak256(encodeLeaf(wallets[3].address))
      const proof3 = merkleTree.getHexProof(leaf3)
      await expect(_Launchpad.connect(wallets[3]).stageRegistrationWL(index, proof3)).to.be.revertedWith('Address is not in the whitelist')

      const leaf0 = keccak256(encodeLeaf(wallets[0].address))
      const proof0 = merkleTree.getHexProof(leaf0)
      await expect(_Launchpad.connect(wallets[0]).stageRegistrationWL(index, proof0)).to.be.revertedWith('Exceed max user amount')

      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      await expect(_Launchpad.connect(wallets[3]).claim(index)).to.be.revertedWith('Address is not registered')
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      const userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(500)

      const userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(500)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("vesting #2", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 2,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 100,
        paymentPeriod: 50,
        lockUpPeriod: 100,
        maxAmountForUser: 50,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)

      await _Launchpad.connect(wallets[1]).stageRegistration(index)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[1].address)).to.equal(true)

      await expect(_Launchpad.connect(wallets[1]).stageRegistration(index)).to.be.revertedWith('Address registered')

      await _Launchpad.connect(wallets[2]).stageRegistration(index)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[2].address)).to.equal(true)

      await expect(_Launchpad.connect(wallets[0]).stageRegistration(index)).to.be.revertedWith('Exceed max user amount')

      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      await expect(_Launchpad.connect(wallets[3]).claim(index)).to.be.revertedWith('Address is not registered')
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [51])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      let userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(250)

      let userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(250)
      
      await ethers.provider.send("evm_increaseTime", [51])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(500)

      userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(500)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("vesting #3", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 2,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 90,
        paymentPeriod: 30,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)

      await _Launchpad.connect(wallets[1]).stageRegistration(index)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[1].address)).to.equal(true)

      await _Launchpad.connect(wallets[2]).stageRegistration(index)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[2].address)).to.equal(true)

      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      await expect(_Launchpad.connect(wallets[3]).claim(index)).to.be.revertedWith('Address is not registered')
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      let userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(165)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(330)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(500)

      const userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(500)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("vesting #4", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 2,
        totalTokenAmount: balance,
        percentTGE: 20,
        totalPaymentPeriod: 90,
        paymentPeriod: 30,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      await _Launchpad.connect(wallets[0]).toggleRegistrationState(index)

      await _Launchpad.connect(wallets[1]).stageRegistration(index)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[1].address)).to.equal(true)

      await _Launchpad.connect(wallets[2]).stageRegistration(index)
      expect(await _Launchpad.getUserIsRegistered(index, wallets[2].address)).to.equal(true)

      await _Launchpad.connect(wallets[0]).toggleStageState(index)

      await expect(_Launchpad.connect(wallets[3]).claim(index)).to.be.revertedWith('Address is not registered')

      await _Launchpad.connect(wallets[1]).claim(index)

      let userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(100)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(230)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(360)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(500)

      const userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(500)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })
  })

  describe("Copmlex Test Airdrop", function () {
    let wallets = [10]
    let _Token
    let _Launchpad

    beforeEach(async function () {
      wallets = await ethers.getSigners()

      const Token = await ethers.getContractFactory("Token", wallets[0])
      _Token = await Token.deploy()

      const Launchpad = await ethers.getContractFactory("LizardLaunchpad", wallets[0])
      _Launchpad = await Launchpad.deploy(_Token.address)

      const amount = 1000
      await _Token.connect(wallets[0]).mint(_Launchpad.address, amount)
    })

    it("airdrop #1", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 2,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 100,
        paymentPeriod: 50,
        lockUpPeriod: 100,
        maxAmountForUser: 50,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      let airdropPool = [wallets[1].address, wallets[2].address, wallets[3].address]
      await expect(_Launchpad.connect(wallets[0]).airdrop(500, airdropPool, index)).to.be.revertedWith('Exceeded max user amount')

      airdropPool = [wallets[1].address, wallets[2].address]
      await expect(_Launchpad.connect(wallets[0]).airdrop(501, airdropPool, index)).to.be.revertedWith('Exceeded max token amount')

      await _Launchpad.connect(wallets[0]).airdrop(500, airdropPool, index)

      let userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(0)

      let userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(0)

      await expect(_Launchpad.connect(wallets[3]).claim(index)).to.be.revertedWith('Address is not registered')
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [51])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(250)

      userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(250)
      
      await ethers.provider.send("evm_increaseTime", [51])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(500)

      userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(500)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("airdrop #2", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 2,
        totalTokenAmount: balance,
        percentTGE: 0,
        totalPaymentPeriod: 90,
        paymentPeriod: 30,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      airdropPool = [wallets[1].address, wallets[2].address]
      await _Launchpad.connect(wallets[0]).airdrop(500, airdropPool, index)

      let userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(0)

      let userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(0)

      await expect(_Launchpad.connect(wallets[3]).claim(index)).to.be.revertedWith('Address is not registered')
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(165)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(330)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(500)

      userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(500)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })

    it("airdrop #3", async function () {
      const balance = await _Token.balanceOf(_Launchpad.address)
      expect(balance).to.equal(1000)

      const index = 1

      await newStage({
        whitelist: false,
        sale: false,
        maxUsers: 2,
        totalTokenAmount: balance,
        percentTGE: 20,
        totalPaymentPeriod: 90,
        paymentPeriod: 30,
        lockUpPeriod: 100,
        maxAmountForUser: 0,
        merkleRoot: zeroRoot,
        index: index,
        wallet: wallets[0],
        Launchpad: _Launchpad
      })

      airdropPool = [wallets[1].address, wallets[2].address]
      await _Launchpad.connect(wallets[0]).airdrop(500, airdropPool, index)

      let userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(100)

      let userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(100)

      await expect(_Launchpad.connect(wallets[3]).claim(index)).to.be.revertedWith('Address is not registered')
      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Lock up period is active')

      await ethers.provider.send("evm_increaseTime", [101])
      await ethers.provider.send("evm_mine", [])

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('Address do not have claimable tokens')

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(230)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(360)

      await ethers.provider.send("evm_increaseTime", [31])
      await ethers.provider.send("evm_mine", [])

      await _Launchpad.connect(wallets[1]).claim(index)
      await _Launchpad.connect(wallets[2]).claim(index)

      userBalance1 = await _Token.balanceOf(wallets[1].address)
      expect(userBalance1).to.equal(500)

      userBalance2 = await _Token.balanceOf(wallets[2].address)
      expect(userBalance2).to.equal(500)

      await expect(_Launchpad.connect(wallets[1]).claim(index)).to.be.revertedWith('You claimed all your tokens')
      await expect(_Launchpad.connect(wallets[2]).claim(index)).to.be.revertedWith('You claimed all your tokens')
    })
  })


  async function newStage(data) {
    const { whitelist, sale, maxUsers, totalTokenAmount, percentTGE, totalPaymentPeriod, paymentPeriod, lockUpPeriod, maxAmountForUser, merkleRoot, index, wallet, Launchpad } = data
    await Launchpad.connect(wallet).newStage(whitelist, sale, maxUsers, totalTokenAmount, percentTGE, totalPaymentPeriod, paymentPeriod, lockUpPeriod, maxAmountForUser, merkleRoot)
    await Launchpad.getStage(index).then((res, err) => {
      expect(res.whitelist).to.equal(whitelist)
      expect(res.maxUsers).to.equal(maxUsers)
      expect(res.totalTokenAmount).to.equal(totalTokenAmount)
      expect(res.percentTGE).to.equal(percentTGE)
      expect(res.totalPaymentPeriod).to.equal(totalPaymentPeriod)
      expect(res.paymentPeriod).to.equal(paymentPeriod)
      expect(res.lockUpPeriod).to.equal(lockUpPeriod)
      expect(res.merkleRoot).to.equal(merkleRoot)
    })
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
})