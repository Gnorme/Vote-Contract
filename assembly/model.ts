import {
    context,
    storage,
    PersistentVector,
    PersistentMap,
    PersistentSet
} from "near-sdk-as";

type Timestamp = u64;
export type AccountId = string;


@nearBindgen
export class Opponent {
    constructor(
        public title: string,
        public data: string,
        public account: AccountId,
        public vote_score: i32 = 0
    ) {}
}

@nearBindgen
export class Duel {
    created_at: Timestamp = context.blockTimestamp;
    constructor(
        public opponents: PersistentMap<AccountId, Opponent>
    ) {}
    static create(submitters: Array<AccountId>, titles: Array<string>, nfts: Array<string>, ): void {
        const opponents = new PersistentMap<AccountId, Opponent>("o");
        for (let i = 0; i < submitters.length; ++i) {
            let op = new Opponent(titles[i], nfts[i], submitters[i])
            opponents.set(submitters[i], op)
        }
        const duel = new Duel(opponents)
        this.set(duel);
    }
    static get(): Duel {
        return storage.getSome<Duel>("state")
    }
    static set(duel: Duel): void {
        storage.set("state", duel)
    }
    static vote_for(voter: string, receiver: AccountId): void {
        assert(!voters.has(voter), "You have already voted.")
        const duel = this.get()
        assert(duel.opponents.contains(receiver), "Opponent doesn't exist.")
        const op = duel.opponents.get(receiver)
        op!.vote_score = op!.vote_score + 1
        duel.opponents.set(receiver, op!)
        this.set(duel)
        voters.add(voter)
    }
    static get_vote_count_for(receiver: AccountId): i32 {
        const duel = this.get()
        assert(duel.opponents.contains(receiver), "Opponent doesn't exist.")
        const votes = duel.opponents.get(receiver)!.vote_score
        return votes
    }
    static get_total_vote_count(): u32 {
        return voters.size
    } 

}


const voters = new PersistentSet<AccountId>("voter");