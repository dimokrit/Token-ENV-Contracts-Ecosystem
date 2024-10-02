// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "./contracts/CheckInBehaviour.sol";
import "./contracts/MintableWithPermit.sol";
import "./upgradeableLibrary/OFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Lizard is OFT, CheckInBehaviour, MintableWithPermit, UUPSUpgradeable {

    bool private transferAllowed;

    function initialize(address _layerZeroEndpoint, address _approver) public initializer {
        __OFT_init("Lizard", "LIZ", _layerZeroEndpoint);
        __UUPSUpgradeable_init();
        __EIP712_init("Lizard", "1");
        approver = _approver;
        __CheckInBehaviour_init();
    }

    //удалить функцию для prod
    function mint(uint amount) external payable {
        _mint(msg.sender, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    function setApprover(address _approver) virtual external onlyOwner {
        _setApprover(_approver);
    }

    function _mintAfterPermitVerified(address _to, uint256 _amount) internal virtual override {
        _mint(_to, _amount);
    }

    function _mintForDailyCheckIn(address _to, uint256 _amount) internal virtual override {
        _mint(_to, _amount);
    }

    function setCheckInRewards(uint32 _streak1Reward, uint32 _streak7Reward, uint32 _streak30Reward) external onlyOwner {
        _setCheckInRewards(_streak1Reward, _streak7Reward, _streak30Reward);
    }

    function setCheckInEnabled(bool enabled) external onlyOwner {
        _setCheckInEnabled(enabled);
    }

    function setCheckInInterval(uint256 _checkInInterval) external onlyOwner {
        _setCheckInInterval(_checkInInterval);
    }

    function setTransferStatus(bool enable) public virtual onlyOwner {
        transferAllowed = enable;
    }

    function setLizardPassAddr(address _setLizardPassAddr) public onlyOwner {
        LizardPassAddr = _setLizardPassAddr;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        if (from != address(0) && to != address(0))
            require(transferAllowed, "Transfer is blocked");
    }

    function _lzSend(
        uint16 _dstChainId,
        bytes memory _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams,
        uint _nativeFee
    ) internal virtual override {
        bytes memory trustedRemote = trustedRemoteLookup[_dstChainId];
        require(transferAllowed, "Transfer is blocked");
        require(trustedRemote.length != 0, "LzApp: destination chain is not a trusted source");
        _checkPayloadSize(_dstChainId, _payload.length);
        lzEndpoint.send{value: _nativeFee}(_dstChainId, trustedRemote, _payload, _refundAddress, _zroPaymentAddress, _adapterParams);
    }

    //UUPS module required by openZ — Stops unauthorized upgrades
    function _authorizeUpgrade(address) internal virtual override onlyOwner{
    }
}