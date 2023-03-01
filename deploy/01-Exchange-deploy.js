const { network, ethers } = require("hardhat")
const {  developmentChains } = require("../helper.hardhat.config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer, player_1 } = await getNamedAccounts()
    const chainId = network.config.chainId

    // Constractor arguments
    const feeAccount = player_1
    const feePercent = "1"
    const args = [feeAccount,feePercent]

    //deploy contract
    const exchange = await deploy("Exchange", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmation || 1,
    })

    log("----------- deploying Exchange contract is successfully -----------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("----------- starting verification process -----------")

        await verify(exchange.address, args)
    }
}

module.exports.tags = ["all", "exchange"]
