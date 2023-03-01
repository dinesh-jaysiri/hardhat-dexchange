const { assert, expect } = require("chai")
const { ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains, ETHER_ADDRESS } = require("../helper.hardhat.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Exchange", () => {
          let exchange, feeAccount, deployerSign, player, din, plyaerSign, deployer
          const feePercent = 1
          beforeEach(async () => {
              // Getting accounts
              deployer = (await getNamedAccounts()).deployer // Deployer for Exchange and Din Token
              feeAccount = (await getNamedAccounts()).player_1 // Fee Callecting Account
              player = (await getNamedAccounts()).player_2 // player

              // Deploy Exchage contraact
              const Exchange = await ethers.getContractFactory("Exchange")
              exchange = await Exchange.deploy(feeAccount, feePercent)
              await exchange.deployed()

              // Deploy Din Token
              const Din = await ethers.getContractFactory("Token")
              din = await Din.deploy("mDAI","mDAI",ethers.utils.parseEther("100")) // initial supply 100 tokents
              await din.deployed()

              // transfer 20 token to player
              const transferrecipt = await din.transfer(player, ethers.utils.parseEther("20"))
              await transferrecipt.wait(1)

              plyaerSign = await ethers.getSigner(player)
              deployerSign = await ethers.getSigner(deployer)
          })
          describe("Constructor", () => {
              it("Track the fee account.", async () => {
                  const feeAccountFromContract = await exchange.feeAccount()
                  assert.equal(feeAccount.toString(), feeAccountFromContract.toString())
              })
              it("Track the fee Percentage.", async () => {
                  const feePercenFromContract = await exchange.feePercent()
                  assert.equal(feePercent.toString(), feePercenFromContract.toString())
              })
          })
          describe("depositEthers", () => {
              let depositAmount = ethers.utils.parseEther("10")
              let depositRecipt

              describe("success", () => {
                  beforeEach(async () => {
                      // connect player to din Contract
                      din = await din.connect(plyaerSign)
                      exchange = await exchange.connect(plyaerSign)

                      depositRecipt = await exchange.depositEther({ value: depositAmount })
                      await depositRecipt.wait(1)
                  })
                  it("track deposited ether ammount and event emit.", async () => {
                      // check ether ballance deposited account
                      const balancefromExchage = await exchange.tokens(ETHER_ADDRESS, player)
                      assert.equal(balancefromExchage.toString(), depositAmount.toString())
                      // emint event after depositing
                      expect(depositRecipt).to.emit("Deposit")
                  })
              })
              describe("failure", async () => {})
          })
          describe("withdrawEther", () => {
              let depositAmount = ethers.utils.parseEther("10")
              let depositRecipt

              describe("success", () => {
                  beforeEach(async () => {
                      // connect player to din Contract
                      din = await din.connect(plyaerSign)
                      exchange = await exchange.connect(plyaerSign)

                      depositRecipt = await exchange.depositEther({ value: depositAmount })
                      await depositRecipt.wait(1)
                  })
                  it("track withdraw ether ammount and event emit.", async () => {
                      // withdraw deposited amount form contract
                      const withdrawRecipt = await exchange.withdrawEther(depositAmount)
                      await withdrawRecipt.wait(1)

                      // new balance shold be zero
                      const balancefromExchage = await exchange.tokens(ETHER_ADDRESS, player)
                      assert.equal(balancefromExchage.toString(), "0")
                      // emint event after depositing
                      expect(withdrawRecipt).to.emit("Withdraw")
                  })
              })
              describe("failure", async () => {
                  it("track insufficient balance", async () => {
                      await expect(
                          exchange.withdrawEther(ethers.utils.parseEther("11"))
                      ).to.be.revertedWith("Exchange: insufficient balance")
                  })
              })
          })

          describe("depositTokens", () => {
              let depositAmount = ethers.utils.parseEther("10")
              let depositRecipt

              describe("success", () => {
                  beforeEach(async () => {
                      // connect player to din Contract
                      din = await din.connect(plyaerSign)
                      exchange = await exchange.connect(plyaerSign)
                      const approveRecipt = await din.approve(exchange.address, depositAmount)
                      await approveRecipt.wait(1)
                      depositRecipt = await exchange.depositToken(din.address, depositAmount)
                      await depositRecipt.wait(1)
                  })
                  it("track deposited token ammount and event emit.", async () => {
                      // check exchange token ballance
                      const balance = await din.balanceOf(exchange.address)
                      assert.equal(balance.toString(), depositAmount.toString())
                      const balancefromExchage = await exchange.tokens(din.address, player)
                      assert.equal(balancefromExchage.toString(), depositAmount.toString())
                      // emint event after depositing
                      expect(depositRecipt).to.emit("Deposit")
                  })
              })
              describe("failure", async () => {
                  it("reject ethers deposit", async () => {
                      await expect(
                          exchange.depositToken(ETHER_ADDRESS, depositAmount)
                      ).to.be.revertedWith("Exchange: not allow to deposit ethers")
                  })
                  it("not allow to trnsfert unapproved tokens", async () => {
                      await expect(
                          exchange.depositToken(din.address, depositAmount)
                      ).to.be.revertedWith("ERC20: insufficient allowance")
                  })
              })
          })

          describe("withdraw Tokens", () => {
              let depositAmount = ethers.utils.parseEther("10")
              let depositRecipt

              describe("success", () => {
                  beforeEach(async () => {
                      // connect player to din Contract
                      din = await din.connect(plyaerSign)
                      exchange = await exchange.connect(plyaerSign)
                      const approveRecipt = await din.approve(exchange.address, depositAmount)
                      await approveRecipt.wait(1)

                      depositRecipt = await exchange.depositToken(din.address, depositAmount)
                      await depositRecipt.wait(1)
                  })
                  it("track withdraw ether ammount and event emit.", async () => {
                      // check balance berfor the balance
                      const initialBalance = await din.balanceOf(player)
                      // withdraw 5 tokens
                      const withdrawResponse = await exchange.withdrawToken(
                          din.address,
                          ethers.utils.parseEther("5")
                      )
                      const withdrawRecept = await withdrawResponse.wait(1)
                      //   const { gasUsed, effectiveGasPrice } = withdrawRecept
                      //   const gasCost = gasUsed.mul(effectiveGasPrice)

                      // get balance after transection
                      const currentBalance = await din.balanceOf(player)

                      const estimateBalance = initialBalance.add(ethers.utils.parseEther("5"))

                      // assert
                      assert.equal(currentBalance.toString(), estimateBalance.toString())
                      // emint event after depositing
                      expect(withdrawResponse).to.emit("Withdraw")
                  })
              })
              describe("failure", () => {
                  it("track insufficient balance", async () => {
                      await expect(
                          exchange.withdrawToken(din.address, ethers.utils.parseEther("11"))
                      ).to.be.revertedWith("Exchange: insufficient balance")
                  })
                  it("reject ethers withdraws", async () => {
                      await expect(
                          exchange.withdrawToken(ETHER_ADDRESS, ethers.utils.parseEther("5"))
                      ).to.be.revertedWith("Exchange: not allow to withdraw ethers")
                  })
              })
          })

          describe("checking balance", () => {
              let depositAmount = ethers.utils.parseEther("10")
              beforeEach(async () => {
                  din = await din.connect(plyaerSign)
                  exchange = await exchange.connect(plyaerSign)
                  const approveRecipt = await din.approve(exchange.address, depositAmount)
                  await approveRecipt.wait(1)
                  depositRecipt = await exchange.depositToken(din.address, depositAmount)
                  await depositRecipt.wait(1)
              })
              it("retrn user balance", async () => {
                  const balance = await exchange.balanceOf(din.address, player)

                  assert.equal(balance.toString(), depositAmount.toString())
              })
          })

          describe("making orders", () => {
              let response
              beforeEach(async () => {
                  din = await din.connect(plyaerSign)
                  exchange = await exchange.connect(plyaerSign)
                  response = await exchange.makeOrder(
                      din.address,
                      ethers.utils.parseEther("1"),
                      ETHER_ADDRESS,
                      ethers.utils.parseEther("1")
                  )
                  response.wait(1)
              })
              it("track newly created order", async () => {
                  const orderCount = await exchange.orderCount()
                  const order = await exchange.orders("1")
                  assert.equal(order.id.toString(), "1")
                  assert.equal(order.user.toString(), player.toString())
                  assert.equal(order.tokenGet.toString(), din.address.toString())
                  assert.equal(orderCount.toString(), "1")
              })
              it("emint an Order event", async () => {
                  expect(response).to.emit("Order")
              })
          })

          describe("order actions", () => {
              const depositAmount = ethers.utils.parseEther("10")
              const orderAmount = ethers.utils.parseEther("1")
              let exchangeConPlayer, exchangeConDeployer
              beforeEach(async () => {
                  // deployer connect to the exhcgnge
                  exchangeConDeployer = await exchange.connect(deployerSign)
                  // deployer deposit token
                  const approveResponse = await din.approve(exchange.address, depositAmount)
                  await approveResponse.wait(1)

                  const tokenDepositResponse = await exchangeConDeployer.depositToken(
                      din.address,
                      depositAmount
                  )

                  await tokenDepositResponse.wait(1)

                  // player connect to the exchange
                  exchangeConPlayer = await exchange.connect(plyaerSign)
                  // deposit ethers
                  const etherDepositResponse = await exchangeConPlayer.depositEther({
                      value: depositAmount,
                  })
                  await etherDepositResponse.wait(1)

                  const orderResponse = await exchangeConPlayer.makeOrder(
                      din.address,
                      orderAmount,
                      ETHER_ADDRESS,
                      orderAmount
                  )
                  await orderResponse.wait(1)
                  // second order for cancell
                  const order2Response = await exchangeConPlayer.makeOrder(
                      din.address,
                      orderAmount,
                      ETHER_ADDRESS,
                      orderAmount
                  )
                  await order2Response.wait(1)
              })
              describe("filling orders", async () => {
                  let result
                  describe("success", () => {
                      beforeEach(async () => {

                          result = await exchangeConDeployer.fillOrder("1")
                          await result.wait(1)
                      })
                      it("updates filled orders", async () => {
                          const isOrderFilled = await exchangeConPlayer.orderFilled("1")
                          assert.equal(isOrderFilled, true)
                      })
                      it("emint a Trade event", async () => {
                          expect(result).to.emit("Trade")
                      })
                  })

                  describe("failure", () => {
                      beforeEach(async () => {
                          result = await exchangeConDeployer.fillOrder("1")
                          await result.wait(1)

                          const cancelResult = await exchangeConPlayer.cancelOrder("2")
                          await cancelResult.wait(1)
                      })
                      it("rejects invalid order ids", async () => {
                          await expect(exchangeConDeployer.fillOrder("1")).to.be.revertedWith(
                              "Exchange: filled order"
                          )
                      })
                      it("rejects invalid order ids", async () => {
                          await expect(exchangeConDeployer.fillOrder("999")).to.be.revertedWith(
                              "Exchange: invalid id"
                          )
                      })

                      it("not allow to fill canceld order", async () => {
                          await expect(exchangeConDeployer.fillOrder("2")).to.be.revertedWith(
                              "Exchange: cancelled order"
                          )
                      })
                  })
              })
              describe("cancelling order", async () => {
                  let result
                  describe("success", () => {
                      beforeEach(async () => {
                          result = await exchangeConPlayer.cancelOrder("1")
                      })
                      it("update the cancel order", async () => {
                          const orderCancelled = await exchangeConPlayer.orderCancelled(1)
                          assert.equal(orderCancelled, true)
                      })
                      it("emint a Cancel event", async () => {
                          expect(result).to.emit("Cancel")
                      })
                  })

                  describe("failure", () => {
                      it("rejects invalid order ids", async () => {
                          await expect(exchangeConPlayer.cancelOrder(999)).to.be.revertedWith(
                              "Exchange: order must exist"
                          )
                      })

                      it("rejects unautherzed cancelactions", async () => {
                          await expect(exchangeConDeployer.cancelOrder(1)).to.be.revertedWith(
                              "Exchange: only creater to allow cancel order"
                          )
                      })
                  })
              })
          })
      })
