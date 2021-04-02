const MainnetAddresses = require("./mainnet.addresses");
const daiAbi = require("./abi/dai-abi.json");
const utils = require("./utils");

const DAICompoundLeveragePool = artifacts.require("DAICompoundLeveragePool");
const Erc20 = artifacts.require("Erc20");

contract("DAI Compound Leverage Pool", async (accounts) => {
  it("it should mint 10000 test DAI", async () => {
    const daiMcdJoin = MainnetAddresses.DAI_MCD_JOIN;
    const daiAddress = MainnetAddresses.DAI_ADDRESS;

    const daiContract = new web3.eth.Contract(daiAbi, daiAddress);
    const numbDaiToMint = web3.utils.toWei("10000", "ether");

    await daiContract.methods.mint(accounts[0], numbDaiToMint).send({
      from: daiMcdJoin,
      gasPrice: web3.utils.toHex(0),
    });

    const balance = await daiContract.methods.balanceOf(accounts[0]).call();
    const dai = balance / 1e18;

    assert.isAtLeast(dai, 10000);
  });

  it("it should get pool name", async () => {
    const instance = await DAICompoundLeveragePool.deployed();
    const poolName = await instance.getName();
    assert.equal(poolName, "DAI Compound Leverage Pool");
  });

  it("it should deposit DAI to contract", async () => {
    const instance = await DAICompoundLeveragePool.deployed();
    const Dai = await Erc20.at(MainnetAddresses.DAI_ADDRESS);
    const cDai = await Erc20.at(MainnetAddresses.CDAI_ADDRESS);
    const sender = accounts[0];
    const amountOfDaiToSupply = 1000;
    const mantissa = web3.utils.toWei(amountOfDaiToSupply.toString(), "ether");

    // balances before
    const balanceDaiSender = await Dai.balanceOf(sender);
    const balancecDaiSender = await cDai.balanceOf(sender);
    const balanceDai = await Dai.balanceOf(instance.address);
    const balancecDai = await cDai.balanceOf(instance.address);

    // approve contract and deposit dai
    await Dai.approve(instance.address, mantissa);
    await instance.deposit(mantissa);
    // const result = await instance.deposit(mantissa);
    // console.log(result.events.Log);

    // balances after
    const balanceDaiSenderAfter = await Dai.balanceOf(sender);
    const balancecDaiSenderAfter = await cDai.balanceOf(sender);
    const balanceDaiAfter = await Dai.balanceOf(instance.address);
    const balancecDaiAfter = await cDai.balanceOf(instance.address);
    const totalDai = Number(balanceDaiSenderAfter) + Number(mantissa);

    // test
    assert.equal(Number(balanceDaiSender), totalDai);
    assert.equal(Number(balanceDaiAfter), 0);
    assert.equal(Number(balancecDaiSender), 0);
    assert.equal(Number(balanceDai), 0);
    assert.equal(Number(balancecDai), 0);
    assert.equal(Number(balancecDaiSenderAfter), 0);
    assert.isBelow(Number(balancecDaiAfter) / 1e18, 2);
  });

  it("it should withdraw all DAI from contract", async () => {
    const instance = await DAICompoundLeveragePool.deployed();
    const Dai = await Erc20.at(MainnetAddresses.DAI_ADDRESS);
    const cDai = await Erc20.at(MainnetAddresses.CDAI_ADDRESS);
    const sender = accounts[0];
    const amountOfDaiToSupply = 1000;
    const mantissa = web3.utils.toWei(amountOfDaiToSupply.toString(), "ether");

    // balances before
    const balanceDai = await Dai.balanceOf(instance.address);
    const balancecDai = await cDai.balanceOf(instance.address);
    const balanceDaiSender = await Dai.balanceOf(sender);
    const balancecDaiSender = await cDai.balanceOf(sender);
    console.log(Number(balanceDai) / 1e18);

    // approve contract to repay borrow
    await Dai.approve(instance.address, mantissa);

    await instance.withdrawAll();

    // balances after
    const balanceDaiAfter = await Dai.balanceOf(instance.address);
    const balancecDaiAfter = await cDai.balanceOf(instance.address);
    const balanceDaiSenderAfter = await Dai.balanceOf(sender);
    const balancecDaiSenderAfter = await cDai.balanceOf(sender);
    console.log(Number(balanceDaiAfter) / 1e18);
    console.log(Number(balancecDaiAfter) / 1e18);
    console.log(Number(balanceDaiSenderAfter) / 1e18);
    console.log(Number(balancecDaiSenderAfter) / 1e18);

    // test
    assert.isBelow(Number(balanceDaiSender), Number(balanceDaiSenderAfter));
    assert.isBelow(Number(balancecDai) / 1e18, 2);
    assert.equal(Number(balanceDaiAfter), 0);
    assert.equal(Number(balancecDaiAfter), 0);
    assert.equal(Number(balancecDaiSender), 0);
    assert.equal(Number(balancecDaiSenderAfter), 0);
  });
});
