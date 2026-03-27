(()=>{

const {ethers}=window;
const CFG=window.APP_CONFIG;
const ABIS=window.ABIS;

/* ================= STATE ================= */

let captchaToken=null;
let captchaRendered=false;

let s={
  provider:null,
  signer:null,
  address:null,
  bm:null,
  pool:null,
  battles:[],
  days:1,
  imgs:{a:null,b:null}
};

/* ================= HELPERS ================= */

const $=(x)=>document.querySelector(x);
const $$=(x)=>[...document.querySelectorAll(x)];

/* ================= CAPTCHA ================= */

function initCaptcha(){
  if(!window.turnstile || captchaRendered) return;

  const box=document.getElementById('captchaBox');
  if(!box) return;

  turnstile.render('#captchaBox',{
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
  if(!window.ethereum){
    alert('MetaMask required');
    return false;
  }

  const provider=new ethers.BrowserProvider(window.ethereum);
  const acc=await provider.send('eth_requestAccounts',[]);

  s.provider=provider;
  s.signer=await provider.getSigner();
  s.address=acc[0];

  s.bm=new ethers.Contract(CFG.contracts.battleManager,ABIS.battle,s.signer);
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

  s.battles=[];

  for(let i=1;i<=n;i++){
    const r=await s.bm.battles(i);

    s.battles.push({
      id:i,
      title:`Battle #${i}`,
      la:'Option A',
      lb:'Option B',
      ia:'',
      ib:''
    });
  }
}

function card(b){
  return `
  <div class="card">

    <h3>${b.title}</h3>

    <div class="grid2">

      <div class="opt">
        ${b.ia ? `<img src="${b.ia}">` : `<div class="empty">No image</div>`}
        <button data-vote="${b.id}" data-side="1">${b.la}</button>
      </div>

      <div class="opt">
        ${b.ib ? `<img src="${b.ib}">` : `<div class="empty">No image</div>`}
        <button data-vote="${b.id}" data-side="2">${b.lb}</button>
      </div>

    </div>

  </div>`;
}

function render(){
  const el=$('#feed');
  if(!el) return;

  el.innerHTML=s.battles.length
    ? s.battles.map(card).join('')
    : `<div class="card" style="padding:20px;text-align:center">No battles yet</div>`;
}

/* ================= UPLOAD ================= */

function bindUpload(which){
  const drop=$('#drop'+which);
  const file=$('#file'+which);

  if(!drop || !file) return;

  drop.onclick=()=>file.click();

  file.onchange=(e)=>{
    const f=e.target.files[0];
    if(!f) return;

    if(f.size>2*1024*1024){
      alert('Max 2MB');
      return;
    }

    const fr=new FileReader();

    fr.onload=()=>{
      s.imgs[which.toLowerCase()]=fr.result;

      drop.classList.add('has');
      drop.innerHTML=`<img src="${fr.result}">`;
    };

    fr.readAsDataURL(f);
  };
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

  if(!title || !la || !lb){
    alert('Fill all fields');
    return;
  }

  try{
    const tx=await s.bm.createBattle(s.days);
    await tx.wait();

    alert('Battle created');
    location.reload();

  }catch(e){
    console.error(e);
    alert('Error creating battle');
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

function modalClose(){

  $$('[data-close]').forEach(btn=>{
    btn.onclick=()=>close(btn.dataset.close);
  });

  ['createModal','voteModal'].forEach(id=>{
    const el=document.getElementById(id);

    if(!el) return;

    el.addEventListener('click',(e)=>{
      if(e.target.id===id){
        close(id);
      }
    });
  });
}

/* ================= INIT ================= */

function init(){

  modalClose();

  bindUpload('A');
  bindUpload('B');

  $('#openCreateBtn') && ($('#openCreateBtn').onclick=()=>open('createModal'));
  $('#heroCreateBtn') && ($('#heroCreateBtn').onclick=()=>open('createModal'));

  $('#createBtn') && ($('#createBtn').onclick=createBattle);

  $('#connectBtn') && ($('#connectBtn').onclick=connect);

}

window.addEventListener('load',init);

})();
