import {
    u128,
    context,
    storage,
    PersistentVector,
    PersistentSet
} from "near-sdk-as";
import { Duel, Opponent } from "./model";

export function init(titles: Array<string>, nfts: Array<string>): void {
    opponents.push(new Opponent(titles[0], nfts[0]))
    opponents.push(new Opponent(titles[1], nfts[1]))

    Duel.create(opponents)
}

export function vote(receiver: i8): void {
    assert_contract_is_initialized()
    assert(context.sender == context.predecessor, "Users must vote directly")
    Duel.add_vote(context.predecessor, receiver)
}

export function get_vote_score(): i32 {
    assert_contract_is_initialized()
   return Duel.get_total_vote_count();
}

export function get_duel(): Duel {
    assert_contract_is_initialized()
    return Duel.get()
}

function is_initialized(): bool {
    return storage.hasKey("state");
}

function assert_contract_is_initialized(): void {
    assert(is_initialized(), "Contract must be initialized first.");
}

const opponents = new PersistentVector<Opponent>("o");