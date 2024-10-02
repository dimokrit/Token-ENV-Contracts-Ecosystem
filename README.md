# LiftShoot contracts

This repository contains implementation of smart contracts for LiftShoot project:
1. LIZARD token - omni-chain ERC20 token based on LayerZero's OFT(V1) protocol.
2. LIFTPass token - single-chain NFT token based on ONFT721 interface.

## Important notes

> This repository was copied from [LayerZero-Labs/solidity-examples](https://github.com/LayerZero-Labs/solidity-examples) and modified to fit the needs of LiftShoot project:
> 1. Sources of parent LayerZero contracts (e.g. OFTV1, ONFT721) were removed and @layerzero/solidity-examples npm package was used instead according to the instructions in the original repository.
> 2. Unused Hardhat tasks were deleted.
> 3. ./tasks folder was rearranged to provide better developer experience.

> Most recently tested with node version `16.13.1`

## Audit

Formal audit of parent LayerZero contracts can be found in the [original repository](https://github.com/LayerZero-Labs/solidity-examples/tree/main/audit).

## Running scripts

1. Install dependencies

```shell
yarn install
```

2. Run tests

```shell
yarn test
```

2. Create `.env` file with by given template in `.env.example` file.

3. List available hardhat tasks

```shell
npx hardhat
```

4. Deploy contracts

   
    Following command will:
      1. deploy LZ contract to the listed networks
      2. wire deployed contracts to each other, i.e set the remote addresses, so each contract can receive messages
      3. check deployments status and correctness of wiring

    Account defined in `.env` will be used to deploy contracts,
      so make sure it has enough native funds to pay for the deployment.

Faucets for testnets:
- [Mumbai](https://faucet.matic.network/)
- [BSC Testnet](https://testnet.binance.org/faucet-smart)
- [Fantom Testnet](https://faucet.testnet.fantom.network/)

```shell
npx hardhat deployWireCheck \
  --e testnet \
  --networks bsc-testnet,fantom-testnet \
  --contract Lizard
```

Deploy NFT contract
```shell
HARDHAT_NETWORK=bsc-testnet node scripts/Lizard_DeployProxy Lizard Lizard_V2_Test
```

4. Generate mint permit
```shell
npx hardhat --network bsc-testnet generateMintPermit \
    --recipient 0xD63b47F2015F39fCBC6ab7F7Dece9319e8994a01 \
    --amount 100
```

5. Mint tokens with permit
```shell
npx hardhat --network bsc-testnet mintWithPermit \
    --recipient-private-key 0x27395233e886ae6bbdf1dbfcbb9cde1036a7bc4da98702fe74f9f16fddc74132 \
    --amount 100 \
    --nonce 0 \
    --deadline 1711515996 \
    --signature 0x8c61ed7772d90b483c5df0a09d8954ad1c951ec203bff50ec10e42bbaa3fbe3b74b0d72bf6a42dd7d31fb64e95dc26684e7b40c71d127caa988bd01a5eeb55971c
```

5. Send cross chain tokens
```shell
# Following command will send 15 tokens from the source chain to the destination chain
npx hardhat oftSend \
  --network fantom-testnet \
  --target-network fantom-testnet \
  --qty 15 \
  --to-address 0x46b4e623c3B4aC1C71203d18b25Ec7056b19C5a1 \
  --contract LifttOFT_1
```
**Pro-tip**: Check the ERC20 transactions tab of the destination chain block explorer and await your tokens!

6. Set the "minDstGas" required on the destination chain.

```shell
npx hardhat --network goerli setMinDstGas --packet-type 0 --target-network fuji --contract OFTV2Mock --min-gas 100000
npx hardhat --network fuji setMinDstGas --packet-type 0 --target-network goerli --contract OFTV2Mock --min-gas 100000
```

7. Mint ONFT

```shell
npx hardhat --network bsc-testnet onftMint --contract LifttPassONFT_1 --to-address 0x38ddA9D886d0AFD7253d5d2A968d181D10B945d4 --token-id 1
npx hardhat --network bsc-testnet onftMint --contract LifttPassONFT_2


```

8. Get owner of ONFT

```shell
npx hardhat --network bsc-testnet onftOwnerOf --token-id 1 --contract LifttPassONFT_1
```

9. Set min gas limit for destinatio chains
```shell
npx hardhat --network fantom-testnet setMinDstGas --target-network fantom-testnet --contract LifttPassONFT_2 --packet-type 1 --min-gas 100000
npx hardhat --network fantom-testnet setMinDstGas --target-network fantom-testnet --contract LifttPassONFT_2 --packet-type 1 --min-gas 100000
npx hardhat --network mumbai setMinDstGas --target-network fantom-testnet --contract LifttPassONFT_2 --packet-type 1 --min-gas 100000
```

9. Send ONFT
```shell
npx hardhat --network bsc-testnet onftSend --target-network fantom-testnet --to-address 0x0000000000000000000000000000000000000000 --contract LifttPassONFT_2 --token-id 0
```

10. Upgrade contract
```shell
npx hardhat upgadeProxy --proxy Lizard --implementation Lizard_V2_Test --networks bsc-testnet
```