#!/usr/bin/env bash
set -e

[ -z "$CONTRACT" ] && echo "Missing \$CONTRACT environment variable" && exit 1
[ -z "$OWNER" ] && echo "Missing \$OWNER environment variable" && exit 1
[ -z "$CALLER" ] && echo "Missing \$CALLER environment variable" && exit 1

echo "Owner voting for: "
near call $CONTRACT vote_for '{"receiver":"test1"}' --accountId $OWNER
echo "Getting vote score"
near view $CONTRACT get_vote_score_for '{"receiver":"test1"}'
echo "Caller voting for: "
near call $CONTRACT vote_for '{"receiver":"test2"}' --accountId $CALLER
echo "Getting vote score"
near view $CONTRACT get_vote_score_for '{"receiver":"test2"}'
echo "Vote cooldown set to 12s, sleeping for 12s"
sleep 12
echo "Owner voting again for:"
near call $CONTRACT vote_for '{"receiver":"test1"}' --accountId $OWNER
near view $CONTRACT get_vote_score_for '{"receiver":"test1"}'
echo "Get opponent data"
near view $CONTRACT get_opponents 
echo "End duel early"
near call $CONTRACT end_duel --accountId $CONTRACT
echo "Verify duel completed"
near view $CONTRACT check_if_active
echo "View reward pool distribution"
near view $CONTRACT get_pool_distribution
echo "View duel details"
near view $CONTRACT get_duel


exit 0