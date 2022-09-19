pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address[] public players;
    address public winner;

    function Lottery() public {
        winner = address(0);
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);

        players.push(msg.sender);
    }

    function getAllPlayers() public view returns (address[]) {
        return players;
    }

    function random() private view returns (uint) {
        return uint(keccak256(block.difficulty, now, players));
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function pickWinner() public restricted {
        uint index = random() % players.length;
        winner = players[index];
        winner.transfer(this.balance);
        players = new address[](0);
    }
}