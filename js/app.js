(()=>{

const {ethers}=window;
const CFG=window.APP_CONFIG;
const ABIS=window.ABIS;

/* ================= STATE ================= */

let captchaToken=null;
let captchaWidgetId=null;
let captchaRendered=false;

const LS={
  meta:'v_meta',
  likes:'v_likes',
  verified:'v_verified',
  points:'v_points',
  streak:'v_streak',
  profile:'v_profile'
};

let s={
  provider:null,
  signer:null,
  address:null,
  bm:null,
  win:null,
  usdc:null,
  rd:null,
  pool:null,
  battles:[],
  cat:'All',
  q:'',
  days:1,
  cats:['Crypto'],
  imgs:{a:null,b:null},
  vote:null
};

/* ================= UTILS ================= */

const $=(x,r=document)=>r.querySelector(x);
const $$=(x,r=document)=>[...r.querySelectorAll(x)];

const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

const fmtUSD=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0);

/* ================= CAPTCHA ================= */

function initCaptcha(){
  if(!window.turnstile) return;
  if(captchaRendered) return;

  const box=document.getElementById('captchaBox');
  if(!box) return;

  captchaWidgetId=turnstile.render('#captchaBox',{
    sitekey:CFG.captcha.siteKey,
    callback:(token)=>{
      captchaToken=token;
      $('#captchaMsg').textContent='Verified';
    }
  });

  captchaRendered=true;
}

/* ================= WALLET ================= */

async function connect(){
  if(!window.ethereum){alert('MetaMask required');return false;}

  const provider=new ethers.BrowserProvider(window.ethereum);
  const acc=await provider.send('eth_requestAccounts',[]);

  s.provider=provider;
  s.signer=await provider.getSigner();
  s.address=acc[0];

  s.bm=new ethers.Contract(CFG.contracts.battleManager,ABIS.battle,s.signer);
  s.win=new ethers.Contract(CFG.contracts.win,ABIS.erc20,s.signer);
  s.usdc=new ethers.Contract(CFG.contracts.usdc,ABIS.erc20,s.signer);
  s.pool=new ethers.Contract(CFG.contracts.pool,ABIS.pool,s.signer);

  $('#walletText').textContent=s.address.slice(0,6)+'...'+s.address.slice(-4);

  await loadBattles();
  render();

  return true;
}

/* ================= BATTLES ================= */

async function loadBattles(){
  if(!s.bm) return;

  const n=Number(await s.bm.battleCount());
  const meta=get(LS.meta,{});

  s.battles=[];

  for(let i=1;i<=n;i++){
    const r=await s.bm.battles(i);

    s.battles.push({
      id:i,
      a:Number(r.totalA),
      b:Number(r.totalB),
      title:(meta[i]||{}).title||`Battle #${i}`,
      la:(meta[i]||{}).la||'Option A',
      lb:(meta[i]||{}).lb||'Option B',
      ia:(meta[i]||{}).ia||'', // ❌ SEM IMAGEM
      ib:(meta[i]||{}).ib||''
    });
  }
}

function card(b){
  return `
  <div class="card">

    <h3>${b.title}</h3>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">

      <div>
        ${b.ia ? `<img src="${b.ia}">` : `<div class="empty">No image</div>`}
        <button data-vote="${b.id}" data-side="1">${b.la}</button>
      </div>

      <div>
        ${b.ib ? `<img src="${b.ib}">` : `<div class="empty">No image</div>`}
        <button data-vote="${b.id}" data-side="2">${b.lb}</button>
      </div>

    </div>

  </div>`;
}

function render(){
  const el=$('#feed');
  if(!el) return;

  el.innerHTML=s.battles.map(card).join('');
}

/* ================= CREATE ================= */

async function createBattle(){

  if(!captchaToken){
    alert('Complete captcha');
    return;
  }

  if(!await connect()) return;

  const title=$('#title').value.trim();
  const la=$('#labelA').value.trim();
  const lb=$('#labelB').value.trim();

  if(!title||!la||!lb){
    alert('Fill all fields');
    return;
  }

  try{

    const tx=await s.bm.createBattle(s.days);
    await tx.wait();

    alert('Created');

    location.reload();

  }catch(e){
    console.error(e);
    alert('Error');
  }
}

/* ================= MODAL ================= */

function open(id){
  document.getElementById(id)?.classList.add('open');

  if(id==='createModal'){
    setTimeout(initCaptcha,0);
  }
}

function close(id){
  document.getElementById(id)?.classList.remove('open');
}

/* ================= INIT ================= */

function init(){

  $('#openCreateBtn').onclick=()=>open('createModal');
  $('#heroCreateBtn').onclick=()=>open('createModal');

  $('#createBtn').onclick=createBattle;

  $('#connectBtn').onclick=connect;

}

window.addEventListener('load',init);

})();
