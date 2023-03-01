const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper.hardhat.config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    // Constractor arguments
    const intialSupply = ethers.utils.parseEther("100000")
    const args = ["mETH", "mETH", intialSupply]

    //deploy contract
    const din = await deploy("mETH", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmation || 1,
    })

    log("----------- deploying mETH Token contract is successfully -----------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("----------- starting verification process -----------")

        await verify(din.address, args)
    }
}

module.exports.tags = ["all", "mETH"]
