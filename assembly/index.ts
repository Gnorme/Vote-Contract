import {context, storage, PersistentMap, RNG} from "near-sdk-as";
import { Duel, AccountId, Opponent, MAX_OPPONENTS, Timestamp , opIDs} from "./models";

export function init(submissions: Map<AccountId, Opponent>,numOpponents: i32, lenInSeconds: Timestamp = 1200): void {
    assert(submissions.size >= numOpponents, "Not enough opponents")
    validate_submissions(submissions)
    const rng = new RNG<u32>(submissions.size, submissions.size);
    const opponents = new PersistentMap<AccountId, Opponent>("o");
    const accounts = submissions.keys()
    let r = rng.next()
    let last = r + 1;
    for (let i = 0; i < numOpponents; i++) {
        const sub = submissions.get(accounts[r])
        opponents.set(accounts[r], sub)
        opIDs.add(accounts[r])
        last = r;
        r = rng.next()
        while (r == last) {
            r = rng.next()
        }
    }
    Duel.create(opponents, lenInSeconds);
}
export function validate_submissions(submissions: Map<AccountId, Opponent>): bool {
    assert(submissions.size < MAX_OPPONENTS, "Too many opponents")
    let accounts = submissions.keys()
    for(let i = 0; i < submissions.size; i++){
        let sub = submissions.get(accounts[i])
        assert_account_is_valid(accounts[i], sub.account)
        assert_data_is_valid(sub.data)
        assert_title_is_valid(sub.title)
    }
    return true
}
export function vote_for(receiver: AccountId): string {
    assert_contract_is_initialized()
    assert(context.sender == context.predecessor, "Users must vote directly")
    //assert(!voters.has(context.sender), "You have already voted.")
    return Duel.vote_for(context.predecessor, receiver)
}
export function get_vote_score(): i32 {
    assert_contract_is_initialized()
   return Duel.get_total_votes()
}
export function get_vote_score_for(receiver: AccountId): i32 {
    assert_contract_is_initialized()
    assert(opIDs.has(receiver), "Opponent doesn't exist.")
    return Duel.get_vote_count_for(receiver)
}
export function check_if_active(): bool {
    return Duel.get().active
}
export function get_opponents(): Array<Opponent> {
    assert_contract_is_initialized()
    const ops = new Array<Opponent>();
    let opponents = Duel.get().opponents
    for (let i = 0; i < opIDs.size; i++) {
        let opponent = opponents.get(opIDs.values()[i])!
        ops.push(opponent)
    }
    return ops
}
export function get_opponent(opponent: AccountId): Opponent {
    assert(opIDs.has(opponent), "Opponent doesn't exist")
    return Duel.get().opponents.get(opponent)!
}
export function get_duel(): Duel {
    return Duel.get()
}
export function get_pool_distribution(): Map<string, number> {
    return Duel.get().poolDistribution
}
function assert_data_is_valid(data: string): void {
    assert(data.includes("9gag"), "Link data is invalid.")
}

function assert_title_is_valid(title: string): void {
    assert(title.length > 0, "Missing a title.")
    assert(title.length < 100, "Title is too long.")
}

function assert_account_is_valid(account: string, sub: string): void {
    assert(account == sub, "Account info doesn't match.")
}

function is_initialized(): bool {
    return storage.hasKey("state");
}

function assert_contract_is_initialized(): void {
    assert(is_initialized(), "Contract must be initialized first.");
}
