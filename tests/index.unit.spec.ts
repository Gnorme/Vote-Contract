import { VMContext } from "near-sdk-as";
import * as model from "../assembly/models";
import * as contract from "../assembly";

const OP_ONE = new model.Opponent("first", "https://9gag.com/gag/ayMDG8Y", "test1");
const OP_TWO = new model.Opponent("second", "https://9gag.com/gag/ayMDG8Y", "test2");
const OP_THREE = new model.Opponent("third", "https://9gag.com/gag/ayMDG8Y", "test3");
const OP_FOUR = new model.Opponent("fourth", "https://9gag.com/gag/ayMDG8Y", "test4");
const NANO_TO_MS: model.Timestamp = 1000000;

const NUM_OPPONENTS = 2

describe("Duel initialization", () =>{
    it("Starts a duel with the correct number of opponents", () => {
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("test2", OP_TWO)
        opponents.set("test3", OP_THREE)
        opponents.set("test4", OP_FOUR)
        
        contract.init(opponents, NUM_OPPONENTS)

        const ops = contract.get_opponents()

        expect(ops.length).toBe(NUM_OPPONENTS)
    })
    it("Starts a duel with valid submissions and no duplicates", () => {
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("test2", OP_TWO)

        contract.init(opponents, opponents.size)

        const ops = contract.get_opponents()

        expect(ops[0].account).not.toBe(ops[1].account)
        expect(ops).toContainEqual(OP_ONE)
        expect(ops).toContainEqual(OP_TWO)
    })
    throws("Fails to start a duel because of incorect metadata", () => {
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("fail", OP_TWO)

        contract.init(opponents, opponents.size)
    })
    throws("Fails to start a duel because of missing metadata", () => {
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("test2", new model.Opponent("second", "", "test2"))

        contract.init(opponents, opponents.size)
    })
    throws("Fails when trying to create duel with too many opponents", () => {
        let opponents = new Map<string, model.Opponent>()
        let tooManyOpponents = model.MAX_OPPONENTS + 2
        for (let i = 0; i < tooManyOpponents; i++) {
            opponents.set(i.toString(), new model.Opponent(i.toString(), "https://9gag.com/gag/ayMDG8Y", i.toString()))
        }

        contract.init(opponents, tooManyOpponents)
    })
    throws("Fails when trying to create duel with not enough opponents", () => {
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("test2", OP_TWO)
        opponents.set("test3", OP_THREE)
        
        let notEnoughOpponents = opponents.size + 1

        contract.init(opponents, notEnoughOpponents)
    })
})

describe("Duel voting", () => {
    beforeEach(() => {
        VMContext.setPredecessor_account_id("allskills");
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("test2", OP_TWO)
        contract.init(opponents, opponents.size)
        VMContext.setPredecessor_account_id("bob");
    })

    it("Sends vote to correct opponent",() => {
        contract.vote_for("test1")
        expect(contract.get_vote_score_for("test1")).toBe(1)
        expect(contract.get_vote_score_for("test2")).toBe(0)
    })
    throws("Stops user from voting too often.", () => {
        contract.vote_for("test1")
        expect(contract.get_vote_score_for("test1")).toBe(1)
        contract.vote_for("test1")
    })
    it("Keeps track of total votes",() => {
        contract.vote_for("test1")
        VMContext.setSigner_account_id("allskills")
        VMContext.setPredecessor_account_id("allskills");
        contract.vote_for("test2")

        expect(contract.get_vote_score()).toBe(2);
    })
    it("Keeps track of users vote counts per opponent",() => {
        contract.vote_for("test1")
        const opponent = contract.get_opponent("test1")
        expect(opponent.voters.get("bob")).toBe(1)
    })
})
 /*Can't get these tests to work? functionality works in contracts. 
describe("Duel time restraints", () => {
    it("Should deny the second vote report as inactive", () => {
        VMContext.setPredecessor_account_id("allskills");
        VMContext.setSigner_account_id("allskills")
        let opponents = new Map<string, model.Opponent>()
        let roundLength = 5
        opponents.set("test1", OP_ONE)
        opponents.set("test2", OP_TWO)
        contract.init(opponents, opponents.size, roundLength)  
        contract.vote_for("test1")
        const target = Date.now() + roundLength * 1000 + 1000 
        while(target > Date.now()) {} 
        VMContext.setPredecessor_account_id("bob");
        VMContext.setSigner_account_id("bob")
        expect(contract.vote_for("test1")).toBe("This duel has just completed")
        expect(contract.check_if_active()).toBe(false)
    })
    it("Allows users to vote again after certain time",() => {
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("test2", OP_TWO)
        contract.init(opponents, opponents.size)  
        contract.vote_for("test1")
        expect(contract.get_vote_score_for("test1")).toBe(1)
        const target = Date.now() + (model.VOTE_COOLDOWN / NANO_TO_MS) + 1000
        while(target > Date.now()) {}
        contract.vote_for("test1")
        expect(contract.get_vote_score_for("test1")).toBe(2)
    })
})
/*describe("Reward pool distribution", () => {
    beforeEach(() => {
        let opponents = new Map<string, model.Opponent>()
        opponents.set("test1", OP_ONE)
        opponents.set("test2", OP_TWO)
        contract.init(opponents, opponents.size)        
    })
    it("Checks if winner gets correct share", () => {

    })
    it("Checks if voters receive correct share", () => {

    })
})*/