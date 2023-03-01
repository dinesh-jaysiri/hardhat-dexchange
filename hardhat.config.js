require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || ""
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

module.exports = {
    solidity: { compilers: [{ version: "0.6.6" }, { version: "0.8.9" },{version:"0.4.9"}] },
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            chainId: 5,
            blockConfirmation: 6,
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY,PRIVATE_KEY_2],
        },
        hardhat: {
            chainId: 31337,
            blockConfirmation: 1,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player_1: {
            default: 1,
        },
        player_2: {
            default: 2,
        },
    },
    gasReporter: {
        enabled: false,
    },

    mocha: {
        timeout: 800000, //200 second max
    },

    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
}
