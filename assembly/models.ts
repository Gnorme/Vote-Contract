import {
    context,
    storage,
    PersistentMap,
    PersistentSet,
} from "near-sdk-as";

export type Timestamp = u64;
export type VoteCount = i32;
export type AccountId = string;
export const NANO_FROM_S:Timestamp = 1000000000;
export const NANO_FROM_MS:Timestamp = 1000000;
export const MAX_OPPONENTS = 10;
//Shortened for testing
export const VOTE_COOLDOWN:Timestamp = 12 * NANO_FROM_S;

const WINNER_CUT = 0.1
const OVERTIME:Timestamp = 600 * NANO_FROM_S

//Holds count of total votes received and a map of the vote count of each user that voted for it
@nearBindgen
export class Opponent {
    voteScore: VoteCount = 0;
    voters: Map<AccountId,VoteCount> = new Map<AccountId, VoteCount>();
    constructor(
        public title: string,
        public data: string,
        public account: AccountId,     
    ) {}
}
//Handles logic for a Duel between X# Opponents, up to MAX_OPPONENTS, decided by votes. Rounds last for X# seconds.
//Users can vote for either opponent, not exclusively, and once per VOTE_COOLDOWN
//If result is a tie, increase round length by OVERTIME
//Once complete, set to inactive and distribute reward pool to winner and voters
@nearBindgen
export class Duel {
    created_at: Timestamp = context.blockTimestamp;
    active: bool;
    winner: Opponent;
    overtime: bool = false;
    totalVotes: i32 = 0;
    poolDistribution: Map<AccountId, f64> = new Map<AccountId, f64>();
    constructor(
        public opponents: PersistentMap<AccountId, Opponent>,
        public roundLength: u64,
        public numOpponents: i32
    ) {}
    static create(challengers: PersistentMap<AccountId, Opponent>, lenInSeconds: u64): void {
        let numOpponents = challengers.get.length
        assert(numOpponents < MAX_OPPONENTS, "Too many opponents")
        const duel = new Duel(challengers, lenInSeconds * NANO_FROM_S, numOpponents)
        duel.active = true;
        this.set(duel);
    }
    static vote_for(voter: string, receiver: AccountId): string {
        //Checks if duel is active, if it should be inactivated, if opponent exists, and if user can vote
        assert(this.get().active, "This duel is no longer active")
        if(!this.shouldBeActive()) return "This duel has just completed"
        const duel = this.get()
        assert(duel.opponents.contains(receiver), "Opponent doesn't exist.")
        const opponent = duel.opponents.get(receiver)!
        assert(this.canVote(voter), "You must wait longer to vote again.")
        //if voter has already voted, increase their vote count by 1
        if (opponent.voters.has(voter)) {
            var voteCount = opponent.voters.get(voter)
            voteCount = voteCount + 1
            opponent.voters.set(voter, voteCount)
        //else add voter
        } else {
            opponent.voters.set(voter, 1)
        }
        //increase voteScore and totalVotes, save opponents/duel/voterHistory
        opponent.voteScore = opponent.voteScore + 1
        duel.totalVotes  = duel.totalVotes + 1
        duel.opponents.set(receiver, opponent)
        this.set(duel)
        //Used to track times of votes to check if voter cooldown is up
        voterHistory.set(voter, context.blockTimestamp)
        return "Vote accepted"
    }
    static canVote(voter: AccountId): bool {
        //More logic to verify if user can vote can go here
        if (voterHistory.contains(voter)) {
            let lastVoted = voterHistory.getSome(voter)
            return this.isLaterThan(lastVoted, VOTE_COOLDOWN)
        } else {
            return true
        }     
    }
    static shouldBeActive(): bool {
        //Checks if the time since start of duel is longer than roundLength then checks for winner
        if (this.isLaterThan(this.get().created_at, this.get().roundLength)) {
            return this.end()
        }
        return true
    }
    //Checks if now is later than the given start time and duration
    static isLaterThan(time: u64, duration: u64): bool {
        const now = context.blockTimestamp
        const timeDiff = now - time
        if (timeDiff > duration) {
            return true
        } else {
            return false
        }
    }
    //Checks for winner, if more than 1 winner (tie) then engage overtime
    static winnerDecided(): bool {
        const duel = this.get()
        let winner: Array<Opponent> = []
        let highest = 0
        let opponentIDs = opIDs.values()
        for (let i = 0; i < opIDs.size; i++) {
            assert(duel.opponents.contains(opponentIDs[i]), "Opponent missing?")
            let op = duel.opponents.get(opponentIDs[i])!
            let score = op.voteScore
            if (score > highest) {
                winner = [op]
                highest = score
            } else if (score == highest) {
                winner.push(op)
            }
        }
        //Can add system to handle multiple winners/ties, for now only engages overtime
        if (winner.length > 1) {
            this.engageOvertime()
            return false
        } else {
            duel.winner = winner[0]
            this.set(duel)
            return true
        }
    }
    static engageOvertime(): void {
        const duel = this.get()
        duel.roundLength = duel.roundLength + OVERTIME
        duel.overtime = true
        this.set(duel)
    }
    static end(): bool {
        //More logic to handle end of duel can go here
        const ended = this.winnerDecided()
        if(ended === true) {
            const duel = this.get()
            duel.active = false
            this.set(duel)
            this.distributePool();
            return true
        }

        return false
    }
    //Calculates share the winner receives, and each voter receives, and sets poolDistribution
    static distributePool(): void {
        const duel = this.get()
        assert(duel.active === false, "Duel is still active")
        assert(duel.winner !== null, "Winner not decided?")
        //One improvement would be a sliding scale for WINNER_CUT, closer the votes = bigger cut
        let winnerShare = duel.totalVotes * WINNER_CUT
        duel.poolDistribution.set(duel.winner.account.toString(), winnerShare)
        let votersOfWinner = duel.winner.voters
        let voterSharePerPoint = ((duel.totalVotes - winnerShare) / duel.winner.voteScore)
        for (let i = 0; i < votersOfWinner.size; i++){
            let voter = votersOfWinner.keys()[i]
            let voteCount = votersOfWinner.get(voter)
            let voterShare = voteCount * voterSharePerPoint
            duel.poolDistribution.set(voter, voterShare)
        }
        this.set(duel)
        //give share to winner
        //give share to voters    
    }
    static get_total_votes(): i32 {
        const duel = this.get()
        return duel.totalVotes
    }
    static get_vote_count_for(receiver: AccountId): i32 {
        const duel = this.get()
        assert(duel.opponents.contains(receiver), "Opponent doesn't exist.")
        const votes = duel.opponents.get(receiver)!.voteScore
        return votes
    }
    static get(): Duel {
        return storage.getSome<Duel>("state")
    }
    static set(duel: Duel): void {
        storage.set("state", duel)
    }
}
export const opIDs = new PersistentSet<AccountId>("ops");
export const owners = new PersistentSet<AccountId>("admin")
const voterHistory = new PersistentMap<AccountId, Timestamp>("voters");