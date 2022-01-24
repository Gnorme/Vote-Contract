import {
    context,
    storage,
} from "near-sdk-as";
import { Duel, AccountId } from "./model";

export function init(submitters: Array<string>, titles: Array<string>, nfts: Array<string>): void {
    Duel.create(submitters, titles, nfts)
}

export function vote(receiver: AccountId): void {
    assert_contract_is_initialized()
    assert(context.sender == context.predecessor, "Users must vote directly")
    Duel.vote_for(context.predecessor, receiver)
}

export function get_vote_score(): i32 {
    assert_contract_is_initialized()
   return Duel.get_total_vote_count();
}

export function get_vote_score_for(receiver: AccountId): i32 {
    assert_contract_is_initialized()
    return Duel.get_vote_count_for(receiver)
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