#!/usr/bin/env bash
echo
echo "Removing contents of ./neardev folder"
echo
rm -rf ./neardev
echo
echo "Building contract"
echo
yarn build:release
echo
echo "Deploying contract"
echo
near dev-deploy ./build/release/vote_contract.wasm
echo "Run the following commands"
echo
echo 'export CONTRACT=<dev-123>'
echo 'export OWNER=<dev-123>'
echo 'export CALLER=<another-account-id>'
echo "near call \$CONTRACT init '{\"lenInSeconds\": \"120\",\"numOpponents\":2, \"submissions\": {\"test1\": {\"title\": \"first\", \"data\":\"https://9gag.com/gag/ayMDG8Y\", \"account\": \"test1\"},\"test2\": {\"title\": \"second\", \"data\":\"https://9gag.com/gag/ayMDG8Y\", \"account\": \"test2\"}}}' --accountId \$CONTRACT"
echo

exit 0