const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const _ = require('lodash');
const hre = require("hardhat");
const { ethers } = require("hardhat");

const exploiter = "0xb7cbb4d43f1e08327a90b32a8417688c9d0b800a";

const addr_proxy_xtoken = "0xb38707e31c813f832ef71c70731ed80b45b85b2d"; // EIP-1967
const addr_xtoken = "0x5417da20ac8157dd5c07230cfc2b226fdcfc5663"; // XToken
// contracts/0x5417da20ac8157dd5c07230cfc2b226fdcfc5663_XToken/01_12_XToken.sol
const addr_interest_rate_model = "0xbd0e1bc09ae52072a9f5d3343b98643ae585e339";
// contracts/0xbd0e1bc09ae52072a9f5d3343b98643ae585e339_JumpRateModelV2/01_04_JumpRateModelV2.sol

const addr_proxy_controller = "0xb7e2300e77d81336307e36ce68d6909e43f4d38a";
const addr_controller = "0x34ca24ddcdaf00105a3bf10ba5aae67953178b85"; // Controller
// contracts/0x34ca24ddcdaf00105a3bf10ba5aae67953178b85_P2Controller/01_13_P2Controller.sol

const addr_proxy_xnft = "0xb14b3b9682990ccc16f52eb04146c3ceab01169a";
const addr_xnft = "0x39360ac1239a0b98cb8076d4135d0f72b7fd9909"; // xNFT
// contracts/0x39360ac1239a0b98cb8076d4135d0f72b7fd9909_XNFT/01_20_XNFT.sol

const addr_proxy_xairdrop = "0xbe6f91cd3795eb9e2b9294806569342157388049";
const addr_xairdrop = "0x5b7e34db8779489c1d81d66771b59cde67210f62"; // xAirDrop
// contracts/0x5b7e34db8779489c1d81d66771b59cde67210f62_XAirDrop/01_12_XAirDrop.sol

const players = [
  {name: "exploiter", addr: "0xb7cbb4d43f1e08327a90b32a8417688c9d0b800a", id: "exploiter"},
  {name: "xToken admin", addr: "0x6d7bc3d418e8c482c49f6c1ebad901606d9c10a4", id: "xtokenAdmin"},
  {name: "Interest model admin", addr: "0x6d7bc3d418e8c482c49f6c1ebad901606d9c10a4", id: "modelAdmin"},
  {name: "Controller admin", addr: "0x6d7bc3d418e8c482c49f6c1ebad901606d9c10a4", id: "controllerAdmin"},
  {name: "xNFT admin", addr: "0x6d7bc3d418e8c482c49f6c1ebad901606d9c10a4", id: "xnftAdmin"},
  {name: "xAirDrop admin", addr: "0xc087629431256745e6e3d87b3ec14e8b42d47e48", id: "xairdropAdmin"},
];

function playerById(id){
  return _.find(players, p=>p.id==id)
}

function toEther(bn){
  return ethers.utils.formatEther(bn);
}

describe("Initial states in history block", function () {
  async function loadInitialState() {
    await loadFixture(loadInitialState);

    for (const player of players){
      const addr = player.addr;
      const name = player.name;
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addr],
      });

      // const balance = await ethers.provider.getBalance(addr);
      // console.log(name, addr, "balance:", toEther(balance), "ETH");
    }
    
    const exploiterSigner = await ethers.getSigner(exploiter);
    return {exploiterSigner};
  }

  describe("", function () {
    it("Should load initial states", async function () {
      expect(await ethers.provider.getBalance(exploiter)).to.equal(ethers.BigNumber.from("27697469339371514670"));
    });

    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployOneYearLockFixture);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await ethers.provider.getBalance(lock.address)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
