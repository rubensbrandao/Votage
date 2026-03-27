(()=>{

const {ethers}=window;
const CFG=window.APP_CONFIG;
const ABIS=window.ABIS;

/* ================= STATE ================= */

let captchaToken=null;
let captchaRendered=false;

const LS={meta:'v_meta'};

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

const getMeta=()=>JSON.parse(localStorage.getItem(LS.meta)||'{}');
const setMeta=(m)=>localStorage.setItem(LS.meta,JSON.stringify(m));

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

  if(s.signer) return true;

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

  $('#walletText').textContent=s.address.slice(0,6)+'...'+s.address.slice(-4);

  await loadBattles();
  render();

  return true;
}

/* ================= BATTLES ================= */

async function loadBattles(){

  if(!s.bm) return;

  const n=Number(await s.bm.battleCount());
  const meta=getMeta();

  s.battles=[];

  for(let i=1;i<=n;i++){

    const r=await s.bm.battles(i);

    s.battles.push({
      id:i,
      title:meta[i]?.title || `Battle #${i}`,
      desc:meta[i]?.desc || '',
      la:meta[i]?.la || 'Option A',
      lb:meta[i]?.lb || 'Option B',
      ia:meta[i]?.ia || '',
      ib:meta[i]?.ib || '',
      a:Number(r.totalA),
      b:Number(r.totalB)
    });
  }
}

function card(b){

  const total=b.a+b.b;
  const pA=total?Math.round((b.a/total)*100):50;
  const pB=100-pA;

  return `
  <article class="battle card">

    <h2>${b.title}</h2>

    <div class="grid2">

      <div class="opt">
        ${b.ia ? `<img src="${b.ia}">` : `<div class="empty">No image</div>`}
        <button>${b.la} (${pA}%)</button>
      </div>

      <div class="opt">
        ${b.ib ? `<img src="${b.ib}">` : `<div class="empty">No image</div>`}
        <button>${b.lb} (${pB}%)</button>
      </div>

    </div>

  </article>`;
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

      const img=fr.result;
      s.imgs[which.toLowerCase()]=img;

      drop.classList.add('has');

      drop.innerHTML=`
        <div class="preview-img">
          <img src="${img}">
        </div>
        <button class="change-btn">Change</button>
      `;

      drop.querySelector('.change-btn').onclick=(e)=>{
        e.stopPropagation();
        file.click();
      };
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

  if(!s.signer){
    alert('Connect wallet first');
    return;
  }

  const title=$('#title').value.trim();
  const desc=$('#desc').value.trim();
  const la=$('#labelA').value.trim();
  const lb=$('#labelB').value.trim();

  if(!title || !la || !lb || !s.imgs.a || !s.imgs.b){
    alert('Fill everything');
    return;
  }

  try{

    const tx=await s.bm.createBattle(s.days);
    await tx.wait();

    const id=Number(await s.bm.battleCount());

    const meta=getMeta();

    meta[id]={
      title,
      desc,
      la,
      lb,
      ia:s.imgs.a,
      ib:s.imgs.b
    };

    setMeta(meta);

    await loadBattles();
    render();

    close('createModal');

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
