Votage V3 Ready

Live integrations included:
- Wallet connect / disconnect
- BattleManager FINAL live reads
- Create battle on-chain
- Vote on-chain using the live pool quote for 1 WIN
- RewardDistributor claim hook
- Real pool price read
- Real swap through your pool
- Real addLiquidity through your pool
- Results page from live battles

Important honesty note:
- The deployed BattleManager FINAL stores duration and pool data on-chain, but not title, category, labels or images.
- Metadata is stored locally in the browser in this build so you can test the final product flow without pretending the contract stores fields it does not store.

Prepared but not fully live:
- Captcha slot is prepared for Cloudflare Turnstile. Add your site key in js/config.js.
- Badge progression is front-driven in this build.
- A sample PointsManager.sol is included in /contracts if you later want an on-chain points backbone.

Replaceable assets:
- /assets/images/*.webp
- /assets/icons/*.svg
- /assets/badges/*-gray.webp
- /assets/badges/*-color.webp
