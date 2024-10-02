// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "../upgradeableLibrary/EIP712.sol";

abstract contract MintableWithPermit is EIP712 {
    address public approver;

    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x34b790496e447e49d148f4169a568f700eba871e76b4826b0735eac4256002ab;

    struct PermitData {
        address recipient;
        uint amount;
        uint nonce;
        uint deadline;
    }

    event MintWithPermit(
        address indexed recipient,
        uint indexed nonce,
        uint indexed value
    );

    mapping(address => uint) private _nonces;

    function _setApprover(address _approver) internal virtual {
        require(_approver != address(0), "Invalid approver");
        approver = _approver;
    }

    function mintWithPermit(PermitData calldata permitData, bytes calldata signature) external {
        require(block.timestamp <= permitData.deadline, "Permit expired");
        require(permitData.nonce == _nonces[msg.sender], "Nonce already used");
        require(permitData.recipient == msg.sender, "Invalid recipient");

        // Verify signature
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(PERMIT_TYPEHASH, permitData.recipient, permitData.amount, permitData.nonce, permitData.deadline))
        );
        address signer = ECDSA.recover(digest, signature);
        require(signer == approver, "Invalid signature");

        _nonces[msg.sender]++;

        _mintAfterPermitVerified(msg.sender, permitData.amount);

        emit MintWithPermit(msg.sender, permitData.nonce, permitData.amount);
    }

    function _mintAfterPermitVerified(address _to, uint256 _amount) internal virtual;

    function nonce(address recipient) public view returns (uint) {
        return _nonces[recipient];
    }

    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return _domainSeparatorV4();
    }
}