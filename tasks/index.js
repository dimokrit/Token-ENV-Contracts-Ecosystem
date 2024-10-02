// common

task("checkWireUp", "check wire up", require("./common/checkWireUp"))
    .addParam("e", "environment testnet/mainet")
    .addParam("contract", "the contract to delete and redeploy")

task("checkWireUpAll", "check wire up all", require("./common/checkWireUpAll"))
    .addParam("e", "environment testnet/mainet")
    .addParam("contract", "name of contract")
    .addOptionalParam("proxyContract", "name of proxy contract")
    .addOptionalParam("proxyChain", "name of proxy chain")

task("deployWireCheck", "", require("./common/deployWireCheck"))
    .addParam("e", "environment testnet/mainet")
    .addParam("contract", "")
    .addParam("networks", "")
    .addOptionalParam("proxyChain", "")
    .addOptionalParam("proxyContract", "")

task("getMessageFailedEvent", "Detect and clear failed message", require("./common/getMessageFailedEvent"))
    .addParam("txStart", "provide a transaction hash in the block you want to start in")
    .addParam("dstUa", "address of dst UA")
    .addOptionalParam("txEnd", "provide a tx hash in the block you want to end at")
    .addOptionalParam("step", "provide a tx hash in the block you want to end at", 1000, types.int)
    .addOptionalParam("nonce", "nonce to clear")

task("getSigners", "show the signers of the current mnemonic", require("./common/getSigners")).addOptionalParam(
    "n",
    "how many to show",
    3,
    types.int
)

task("getStoredPayloadEvent", "Detect and clear stored payload", require("./common/getStoredPayloadEvent"))
    .addParam("txStart", "provide a transaction hash in the block you want to start in")
    .addParam("srcAddress", "")
    .addParam("desAddress", "")
    .addOptionalParam("txEnd", "provide a tx hash in the block you want to end at")
    .addOptionalParam("step", "provide a tx hash in the block you want to end at", 1000, types.int)
    .addOptionalParam("nonce", "nonce to clear")

task("isFailedMessage", "check if failed message", require("./common/isFailedMessage"))
    .addParam("srcChainId", "")
    .addParam("srcAddress", "")
    .addParam("desAddress", "")
    .addParam("nonce", "")

task("isStoredPayload", "check if stored payload", require("./common/isStoredPayload"))
    .addParam("srcChainId", "")
    .addParam("srcAddress", "")
    .addParam("desAddress", "")
    .addOptionalParam("payload", "")
    .addOptionalParam("clear", "", false, types.boolean)

task("setMinDstGas", "set min gas required on the destination gas", require("./common/setMinDstGas"))
    .addParam("packetType", "message Packet type")
    .addParam("targetNetwork", "the chainId to transfer to")
    .addParam("contract", "contract name")
    .addParam("minGas", "min gas")

task(
    "setTrustedRemote",
    "setTrustedRemote(chainId, sourceAddr) to enable inbound/outbound messages with your other contracts",
    require("./common/setTrustedRemote")
)
    .addParam("targetNetwork", "the target network to set as a trusted remote")
    .addOptionalParam("localContract", "Name of local contract if the names are different")
    .addOptionalParam("remoteContract", "Name of remote contract if the names are different")
    .addOptionalParam("contract", "If both contracts are the same name")

// OFT

task("oftMint", "mint tokens", require("./oft/oftMint")).addParam("contract", "Name of contract").addParam("qty", "qty of tokens to mint")

task("oftSend", "send tokens to another chain", require("./oft/oftSend"))
    .addParam("qty", "qty of tokens to send")
    .addParam("toAddress", "address to send tokens to")
    .addParam("targetNetwork", "the target network to let this instance receive messages from")
    .addOptionalParam("localContract", "Name of local contract if the names are different")
    .addOptionalParam("remoteContract", "Name of remote contract if the names are different")
    .addOptionalParam("contract", "If both contracts are the same name")

task("oftGetBalance", "Get balance", require("./oft/oftGetBalance")).addOptionalParam("contract", "If both contracts are the same name")

// ONFT

task("nftMint", "mint() mint NFT", require("./nft/nftMint"))
    .addParam("contract", "Name of contract")
    .addParam("value", "Value sending to contract")

task("checkIn", "call checkIn() in LIZARD", require("./lizard/checkIn"))

task("nftOwnerOf", "ownerOf(tokenId) to get the owner of a token", require("./nft/nftOwnerOf"))
    .addParam("contract", "Name of contract")
    .addParam("tokenId", "the tokenId of ONFT")

task("nftSend", "send an ONFT nftId from one chain to another", require("./nft/nftSend"))
    .addParam("toAddress", "address to mint the ONFT to")
    .addParam("tokenId", "the tokenId of ONFT")
    .addParam("contract", "ONFT contract name")

// LIZARD
task("setCheckInInterval", "Updates checkIn interval", require("./lizard/setCheckInInterval"))
    .addParam("seconds", "Number of seconds")

task("getCheckInInterval", "Prints checkIn interval", require("./lizard/getCheckInInterval"))

task("setCheckInRewards", "Updates checkIn rewards", require("./lizard/setCheckInRewards"))
    .addParam("reward1", "Reward for 1 day checkIn")
    .addParam("reward7", "Reward for 7 days checkIn")
    .addParam("reward30", "Reward for 30 days checkIn")

task("getApprover", "Prints approver", require("./lizard/getApprover"))

task("generateMintPermit", "Generates a permit for minting LizardOFT tokens", require("./lizard/generateMintPermit"))
    .addParam("recipient", "Address of the recipient")
    .addParam("amount", "Number of tokens to mint")

task("mintWithPermit", "Mints LizardOFT tokens using a permit", require("./lizard/mintWithPermit"))
    .addParam("recipientPrivateKey", "Private key of the recipient to sign a transaction")
    .addParam("amount", "Number of tokens to mint")
    .addParam("signature", "Signature of the permit")
    .addParam("nonce", "Nonce of the permit")
    .addParam("deadline", "Deadline of the permit")

task("sendMintTrx", "Send transaction to contract to call function mint", require("./lizard/sendMintTrx"))
    .addParam("amount", "Amount of tokens to mint")

task("upgadeProxy", "Upgrade proxy contract with new implementation", require("./common/upgradeProxy"))
    .addParam("implementation", "Contract name of implementation")
    .addParam("proxy", "Contract name of proxy")
    .addParam("networks", "Networks to deploy")

