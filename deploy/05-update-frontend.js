const { ethers, network } = require("hardhat")
const fs = require("fs")

const fronEndContractsFile = "../react-exchange-market/src/constants/networkMapping.json"
const frontendAbiLocation = "../react-exchange-market/src/constants/"

module.exports = async function () {
    const contractList = ["Exchange","DEX","mDAI","mETH"]
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front-end...")
        console.log(network.config.chainId.toString())
        await updateContractAddresses(contractList)
        await updateAbi(contractList.slice(0,2))
    }
}

async function updateAbi(contracts) {
    contracts.forEach(async (contract) => {
        const Contract = await ethers.getContract(contract)
        fs.writeFileSync(
            `${frontendAbiLocation}${contract}.json`,
            Contract.interface.format(ethers.utils.FormatTypes.json)
        )
    })
}

async function updateContractAddresses(contracts) {
    contracts.forEach(async (contract) => {
        const Contract = await ethers.getContract(contract)
        const chainId = network.config.chainId.toString()
        console.log(chainId)
        const contractAddresses = JSON.parse(fs.readFileSync(fronEndContractsFile, "utf8"))
        contractAddresses[chainId] = {
            ...contractAddresses[chainId],
            [contract]: [Contract.address],
        }
        fs.writeFileSync(fronEndContractsFile, JSON.stringify(contractAddresses))
    })
}

module.exports.tags = ["all", "frontend"]
