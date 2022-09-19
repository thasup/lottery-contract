const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const { interface, bytecode } = require('../compile');

const web3 = new Web3(ganache.provider());

let fetchAccounts;
let lottery;

beforeEach(async () => {
  // Get a list of all accounts
  fetchAccounts = await web3.eth.getAccounts();

  //Use one of those accounts to deploy the contract
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode,
    })
    .send({
      from: fetchAccounts[0],
      gas: '1000000',
    });
});

describe('Lottery Contract', () => {
  it('deploys a contract', () => {
    // console.log(lottery);
    assert.ok(lottery.options.address);
  });

  it('allows one account to enter', async () => {
    await lottery.methods.enter().send({
      from: fetchAccounts[0],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    const players = await lottery.methods.getAllPlayers().call({
      from: fetchAccounts[0],
    })

    assert.equal(fetchAccounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it('allow multiple accounts to enter', async () => {
    await lottery.methods.enter().send({
      from: fetchAccounts[0],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    await lottery.methods.enter().send({
      from: fetchAccounts[1],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    await lottery.methods.enter().send({
      from: fetchAccounts[2],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    const players = await lottery.methods.getAllPlayers().call({
      from: fetchAccounts[0],
    })

    assert.equal(fetchAccounts[0], players[0]);
    assert.equal(fetchAccounts[1], players[1]);
    assert.equal(fetchAccounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it('requires a minimum amount of ether to enter', async () => {
    try {
      await lottery.methods.enter().send({
        from: fetchAccounts[0],
        value: 0,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('only manager can call pickWinner', async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: fetchAccounts[0],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('send money to winner and reset players array', async () => {
    await lottery.methods.enter().send({
      from: fetchAccounts[0],
      value: web3.utils.toWei('2', 'ether'),
    });

    const initialBalance = await web3.eth.getBalance(fetchAccounts[0]);

    await lottery.methods.pickWinner().send({
      from: fetchAccounts[0],
    });

    const finalBalance = await web3.eth.getBalance(fetchAccounts[0]);

    const difference = finalBalance - initialBalance;
    assert(difference > web3.utils.toWei('1.8', 'ether'));
  });
});