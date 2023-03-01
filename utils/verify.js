const { run } = require("hardhat")

const verify = async (contractAddress, arg) => {
    console.log("Verifing contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: arg,
        })
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified")
        } else {
            console.log(error)
        }
    }
}

module.exports = { verify }
