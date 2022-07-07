import {loadStdlib} from '@reach-sh/stdlib'
import {ask} from '@reach-sh/stdlib'
import * as backend from './build/index.main.mjs'

const getBalance = async (acc) => stdlib.formatCurrency(await stdlib.balanceOf(acc), 4)

const stdlib = loadStdlib()


const isAlice = await ask.ask("Are you Alice?", ask.yesno)
if (!isAlice) console.log("Then you are Bob.")

const startingBalance = stdlib.parseCurrency(100)
const acc = await stdlib.newTestAccount(startingBalance)

const beforeBalance = await getBalance(acc)
console.log("Your account is " + acc.getAddress())
console.log(`Your balance is ${beforeBalance}.`)

let tok
if (!isAlice) {
    tok = await stdlib.launchToken(acc, "Yet Another NFT", "YANFT", {decimals: 0, supply: 1})
    console.log("The details of your NFT are:")
    console.log(tok)
}


let ctc
if (isAlice) {
  ctc = acc.contract(backend)
  ctc.getInfo().then((info) => {
    console.log(`The contract is deployed as ${info}`)
  })
} else {
  const info = ask.ask(
    "Enter the contract information:",
    (x) => x
  )
  ctc = acc.contract(backend, info)
}

const Player = {
    timedOut: () => {console.log("The operation timed out.")},
    success: () => {console.log("Success.")}
}

let interact
if (isAlice) {

  interact = {
    getBobAddress: async () => {
        const addr = await ask.ask(
            `Enter Bob's address:`,
            (x) => x
        )
        return addr
    },
    getDesiredID: async () => {
        const addr = await ask.ask(
            `Enter the NFT ID you wish to acquire from Bob:`,
            (x) => x
        )
        return addr
    },
    howMuch: async () => {
        const amt = await ask.ask(
            `How much are you willing to pay for it in network tokens?`,
            (x) => stdlib.parseCurrency(x)
        )
        return amt
    },
    deadline: 10,
    ...Player
  }

} else {

  interact = {
    accept: async (amt, tok) => {
      const accepted = await ask.ask(
        `Do you accept the payment of ${stdlib.formatCurrency(amt, 4)} network tokens for the asset ${tok}?`,
        ask.yesno
      );
      if (!accepted) process.exit(0)
    },
    ...Player
  }

}

let participant
if (isAlice) {
  participant = ctc.p.Alice
} else {
  participant = ctc.p.Bob
}
await participant(interact)

const afterBalance = await getBalance(acc)
console.log(`Balance went from ${beforeBalance} to ${afterBalance}.`);
console.log("Goodbye!")
ask.done()
