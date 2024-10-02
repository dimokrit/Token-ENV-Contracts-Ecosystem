// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface ILizardPass {
    function balanceOf(address owner) external returns(uint256);
}

abstract contract CheckInBehaviour is Initializable{

    event DailyCheckIn(
        address indexed user,
        uint256 indexed streakCount,
        uint256 indexed timestamp,
        uint256 reward
    );

    mapping(address => uint256) private _lastCheckInTimestamp;
    mapping(address => uint32) private _streakCount;

    uint32 public _streak1Reward;
    uint32 public _streak7Reward;
    uint32 public _streak30Reward;

    bool public _checkInEnabled;

    uint256 private _checkInInterval;

    address public LizardPassAddr;
    function __CheckInBehaviour_init() internal onlyInitializing {
    _streak1Reward = 10;
    _streak7Reward = 50;
    _streak30Reward = 100;
    _checkInEnabled = true;
    _checkInInterval = 1 days;
    }

    function checkIn() external {
        require(_checkInEnabled, "Check-in feature is currently disabled.");
        require(LizardPassAddr == address(0) || ILizardPass(LizardPassAddr).balanceOf(msg.sender) > 0, "You have to buy Lizard Airdrop Pass");
        require(block.timestamp > _lastCheckInTimestamp[msg.sender] + _checkInInterval, "Check-in not allowed yet. Please wait for a day.");

        if (block.timestamp <= _lastCheckInTimestamp[msg.sender] + 2 * _checkInInterval) {
            _streakCount[msg.sender]++;
        } else {
            _streakCount[msg.sender] = 1;
        }

        uint256 reward = _streak1Reward;
        if (_streakCount[msg.sender] % 7 == 0) {
            reward = _streak7Reward;
        } else if (_streakCount[msg.sender] % 30 == 0) {
            reward = _streak30Reward;
        }

        _lastCheckInTimestamp[msg.sender] = block.timestamp;

        _mintForDailyCheckIn(msg.sender, reward);

        emit DailyCheckIn(msg.sender, _streakCount[msg.sender], block.timestamp, reward);
    }

    function streak1Reward() public view returns (uint32) {
        return _streak1Reward;
    }

    function streak7Reward() public view returns (uint32) {
        return _streak7Reward;
    }

    function streak30Reward() public view returns (uint32) {
        return _streak30Reward;
    }

    function _setCheckInRewards(uint32 streak1Reward_, uint32 streak7Reward_, uint32 streak30Reward_) internal {
        _streak1Reward = streak1Reward_;
        _streak7Reward = streak7Reward_;
        _streak30Reward = streak30Reward_;
    }

    function checkInInterval() public view returns (uint256) {
        return _checkInInterval;
    }

    function _setCheckInInterval(uint256 interval) internal {
        _checkInInterval = interval;
    }

    function checkInEnabled() public view returns (bool) {
        return _checkInEnabled;
    }

    function _setCheckInEnabled(bool enabled) internal virtual {
        _checkInEnabled = enabled;
    }

    function streakCount(address user) public view returns (uint32) {
        return _streakCount[user];
    }

    function _mintForDailyCheckIn(address _to, uint256 _amount) internal virtual;

}