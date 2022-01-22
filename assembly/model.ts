import {
    u128,
    context,
    storage,
    PersistentVector,
    PersistentSet
} from "near-sdk-as";

type Timestamp = u64;
type AccountId = string;


@nearBindgen
export class Opponent {
    vote_score: i32 = 0;
    voters: Array<AccountId> = [];
    constructor(
        public title: string,
        public data: string
    ) {}
}

@nearBindgen
export class Duel {
    created_at: Timestamp = context.blockTimestamp;
    constructor(
        public opponents: PersistentVector<Opponent>,
    ) {}
    static create(opponents: PersistentVector<Opponent>): void {
        const duel = new Duel(opponents)
        this.set(duel);
    }
    static get(): Duel {
        return storage.getSome<Duel>("state")
    }
    static set(duel: Duel): void {
        storage.set("state", duel)
    }
    static add_vote(voter: string, receiver: i8): void {
        assert(!voters.has(voter), "You have already voted.")
        const duel = this.get()
        duel.opponents[receiver].vote_score = duel.opponents[receiver].vote_score + 1;
        duel.opponents[receiver].voters.push(voter)
        this.set(duel)
        voters.add(voter)
    }
    static get_total_vote_count(): u32 {
        return voters.size
    } 

}

const voters = new PersistentSet<AccountId>("voter");