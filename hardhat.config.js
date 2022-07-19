require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {version: "0.8.9"},
      {version: "0.8.2"},
    ],
  },
  mocha: {
    timeout: 400000000
  },  
  networks: {
    hardhat: {
      forking: {
        // this is my API endpoint from infura, please replace with yours ;)
        url: "https://mainnet.infura.io/v3/36fd3e30e77e47ba9034d2605a11ec8a", 
        blockNumber: 15028719,
      }
    }
  },
};
