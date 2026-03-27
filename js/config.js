window.APP_CONFIG = {
  chainName: 'ARC Testnet',

  usdcDecimals: 6,
  winDecimals: 18,

  seasonEnd: '2026-09-30T23:59:59Z',

  contracts: {
    win: '0xf83EC0b8A43cF921116EfF822a6334aFFd67E55F',
    treasuryWallet: '0x52803C39A0B79C3733C3928B7FE91b70bF6D2f84',
    rewardDistributor: '0x781a0A88Ad34841Eea028BfEAeC320Ed5A9053e1',
    battleManager: '0x14cDD5cd4Ab6a72e1196Cf4F0017f9Cf157abAA7',
    usdc: '0x3600000000000000000000000000000000000000',
    pool: '0x9c11Fd6c5965e519665C497Db1398DB57fFBdF13'
  },

  captcha: {
    provider: 'cloudflare-turnstile',
    siteKey: '0x4AAAAAACwgcAs0o6vq-i_9'
  }
};


window.ABIS = {

  erc20: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function transfer(address,uint256) returns (bool)"
  ],

  battle: [
    "function battleCount() view returns (uint256)",
    "function airdropPool() view returns (uint256)",
    "function createBattle(uint256 durationDays)",
    "function vote(uint256 id,uint8 side,uint256 amount)",
    "function resolve(uint256 id)",
    "function claim(uint256 id)",
    "function battles(uint256) view returns (address creator,uint256 startTime,uint256 endTime,uint256 totalA,uint256 totalB,bool resolved,uint8 winner,bool feesDistributed)",
    "function contractBalances() view returns (uint256 usdcBalance,uint256 winBalance)"
  ],

  rewardDistributor: [
    "function rewards(address) view returns (uint256)",
    "function claimed(address) view returns (bool)",
    "function claim()"
  ],

  pool: [
    "function reserveWIN() view returns (uint256)",
    "function reserveUSDC() view returns (uint256)",
    "function getPrice() view returns (uint256)",
    "function addLiquidity(uint256 winAmount,uint256 usdcAmount)",
    "function swapUSDCforWIN(uint256 usdcIn) returns (uint256)",
    "function swapWINforUSDC(uint256 winIn) returns (uint256)"
  ]

};
