
Votage premium final test build

Live wired:
- Wallet connect
- Reads WIN, BattleManager FINAL, RewardDistributor
- Create battle on-chain
- Approve USDC and vote on-chain
- Resolve and claim on-chain
- Results page from live battles
- Market reads live balances

Local/front-end only:
- Battle title, description, labels, category and images (stored in localStorage because the deployed BattleManager FINAL only stores duration and pool values on-chain)
- Human verification, points, streak, badges, profile edit
- X connect state

Not wired because no contract/router was provided:
- real swap
- real liquidity add/remove

Contract addresses are already configured in js/config.js.
