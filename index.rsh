'reach 0.1'
'use strict'

export const main = Reach.App(() => {

    const Alice = Participant("Alice", {
        getBobAddress: Fun([], Address),
        getDesiredID: Fun([], Token),
        howMuch: Fun([], UInt),
        deadline: UInt,
        timedOut: Fun([], Null),
        success: Fun([], Null)
    })

    const Bob = Participant("Bob", {
        accept: Fun([UInt, Token], Null),
        timedOut: Fun([], Null),
        success: Fun([], Null)
    })

    const informTimeout = () => {
        each([Alice, Bob], () => {
            interact.timedOut()
        })
    }

    init()

    Alice.only(() => {
        const addr = declassify(interact.getBobAddress())
        const desiredID = declassify(interact.getDesiredID())
        const amountPayable = declassify(interact.howMuch())
        const deadline = declassify(interact.deadline)
    })
    Alice.publish(addr, desiredID, amountPayable, deadline).pay(amountPayable)
    
    const bobAddress = new Set()
    bobAddress.insert(addr) // redundant, but it was in the spec so ok i guess

    commit()

    Bob.only(() => {
        check(Bob == addr, "Error: Unauthorized participant")
        interact.accept(amountPayable, desiredID)
    })
    Bob.pay([[1, desiredID]]).timeout(relativeTime(deadline), () => closeTo(Alice, informTimeout))

    transfer(amountPayable).to(Bob)
    transfer(1, desiredID).to(Alice)

    commit()

    

    each([Alice, Bob], () => {
        interact.success()
    })
})

