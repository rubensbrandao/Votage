
(()=>{
  const { ethers } = window;
  const CFG = window.APP_CONFIG;
  const ABIS = window.ABIS;

  const LS = {
    meta: 'v_meta',
    likes: 'v_likes',
    verified: 'v_verified',
    points: 'v_points',
    streak: 'v_streak',
    profile: 'v_profile',
    archive: 'v_archive',
    unlocked: 'v_unlocked',
    hiddenBattles: 'v_hidden_battles',
    walletDisconnected: 'v_wallet_disconnected'
  };

  let captchaToken = null;
  let captchaWidgetId = null;
  let captchaRendered = false;
  let ethListenersBound = false;

  let s = {
    provider: null,
    signer: null,
    address: null,
    bm: null,
    win: null,
    usdc: null,
    rd: null,
    pool: null,
    battles: [],
    badges: [],
    cat: 'All',
    q: '',
    days: 1,
    cats: ['Crypto'],
    imgs: { a: null, b: null },
    vote: null,
    marketPrice: 0,
    marketData: {
      walletUsdc: 0,
      walletWin: 0,
      reserveUsdc: 0,
      reserveWin: 0
    }
  };

  const $ = (x, r = document) => r.querySelector(x);
  const $$ = (x, r = document) => [...r.querySelectorAll(x)];
  const now = () => Math.floor(Date.now() / 1000);
  const fmtAddr = a => a ? a.slice(0, 6) + '...' + a.slice(-4) : '—';
  const fmtUSD = n => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4
  }).format(Number.isFinite(n) ? n : 0);
  const fmtNum = n => new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4
  }).format(Number.isFinite(n) ? n : 0);

  const get = (k, f) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? f;
    } catch {
      return f;
    }
  };

  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  function nav() {
    const p = document.body.dataset.page;

    $$('[data-nav]').forEach(a => {
      if (a.dataset.nav === p) a.classList.add('active');
    });

    $$('.bottom a').forEach(a => {
      const h = a.getAttribute('href');
      if (
        (p === 'home' && h === 'index.html') ||
        (p === 'results' && h === 'results.html') ||
        (p === 'market' && h === 'market.html') ||
        (p === 'points' && h === 'points.html') ||
        (p === 'how' && h === 'how-it-works.html')
      ) {
        a.classList.add('active');
      }
    });
  }

  async function ensureProvider() {
    if (!window.ethereum) return null;
    if (!s.provider) s.provider = new ethers.BrowserProvider(window.ethereum);
    if (!ethListenersBound) bindEthereumListeners();
    return s.provider;
  }

  function initContracts(runner) {
    if (!runner) return;
    s.bm = new ethers.Contract(CFG.contracts.battleManager, ABIS.battle, runner);
    s.win = new ethers.Contract(CFG.contracts.win, ABIS.erc20, runner);
    s.usdc = new ethers.Contract(CFG.contracts.usdc, ABIS.erc20, runner);
    s.rd = new ethers.Contract(CFG.contracts.rewardDistributor, ABIS.rewardDistributor, runner);
    s.pool = new ethers.Contract(CFG.contracts.pool, ABIS.pool, runner);
  }

  function bindEthereumListeners() {
    if (!window.ethereum || ethListenersBound) return;
    window.ethereum.on?.('accountsChanged', async accounts => {
      if (accounts && accounts.length) {
        const provider = await ensureProvider();
        s.signer = await provider.getSigner();
        s.address = accounts[0];
        initContracts(s.signer);
        localStorage.setItem(LS.walletDisconnected, '0');
      } else {
        s.signer = null;
        s.address = null;
        const provider = await ensureProvider();
        if (provider) initContracts(provider);
      }
      top();
      await refreshUi();
    });

    window.ethereum.on?.('chainChanged', () => {
      window.location.reload();
    });

    ethListenersBound = true;
  }

  async function signConnectMessage() {
    if (!s.signer) return false;
    try {
      await s.signer.signMessage('Sign to verify your account on Votage');
      return true;
    } catch (e) {
      console.error(e);
      alert('Signature request was cancelled.');
      return false;
    }
  }

  async function connect(requestAccess = true) {
    const provider = await ensureProvider();
    if (!provider) {
      alert('MetaMask is required.');
      return false;
    }

    let accounts = [];
    try {
      accounts = requestAccess
        ? await provider.send('eth_requestAccounts', [])
        : await provider.send('eth_accounts', []);
    } catch (e) {
      console.error(e);
      return false;
    }

    if (!accounts || !accounts.length) {
      s.signer = null;
      s.address = null;
      initContracts(provider);
      top();
      await refreshUi();
      return false;
    }

    s.signer = await provider.getSigner();
    s.address = accounts[0];
    initContracts(s.signer);

    if (requestAccess) {
      const signed = await signConnectMessage();
      if (!signed) return false;
      localStorage.setItem(LS.walletDisconnected, '0');
    }

    top();
    await refreshUi();
    return true;
  }

  async function disconnect() {
    localStorage.setItem(LS.walletDisconnected, '1');
    s.signer = null;
    s.address = null;
    const provider = await ensureProvider();
    if (provider) initContracts(provider);
    top();
    await refreshUi();
  }

  function top() {
    const p = get(LS.profile, {});
    $('#topUsername') && ($('#topUsername').textContent = p.username || 'Guest');
    $('#topAvatar') && ($('#topAvatar').src = p.avatar || 'assets/images/avatar.webp');

    if (s.address) {
      $('#walletText') && ($('#walletText').textContent = fmtAddr(s.address));
      $('#connectBtn') && (
        $('#connectBtn').innerHTML = '<img class="icon" src="assets/icons/wallet.svg" alt=""/>Disconnect',
        $('#connectBtn').disabled = false,
        $('#connectBtn').classList.remove('disabled-btn')
      );
    } else {
      $('#walletText') && ($('#walletText').textContent = 'Not connected');
      $('#connectBtn') && (
        $('#connectBtn').innerHTML = '<img class="icon" src="assets/icons/wallet.svg" alt=""/>Connect',
        $('#connectBtn').disabled = false,
        $('#connectBtn').classList.remove('disabled-btn')
      );
    }
    $('#disconnectBtn') && $('#disconnectBtn').classList.add('hidden');
  }

  async function loadBadges() {
    try {
      s.badges = await (await fetch('data/badges.json')).json();
    } catch {
      s.badges = [];
    }
  }

  async function loadBattles() {
    if (!s.bm) return [];
    const n = Number(await s.bm.battleCount());
    const m = get(LS.meta, {});
    const likes = get(LS.likes, {});
    const hidden = get(LS.hiddenBattles, {});
    s.battles = [];

    for (let i = 1; i <= n; i++) {
      if (hidden[i]) continue;
      try {
        const r = await s.bm.battles(i);
        s.battles.push({
          id: i,
          creator: r.creator,
          start: Number(r.startTime),
          end: Number(r.endTime),
          a: Number(r.totalA),
          b: Number(r.totalB),
          resolved: r.resolved,
          w: Number(r.winner),
          title: (m[i] || {}).title || `Battle #${i}`,
          desc: (m[i] || {}).desc || 'On-chain battle created without full metadata in the deployed contract.',
          cats: (m[i] || {}).cats || ['General'],
          la: (m[i] || {}).la || 'Option A',
          lb: (m[i] || {}).lb || 'Option B',
          ia: (m[i] || {}).ia || '',
          ib: (m[i] || {}).ib || '',
          likes: likes[i] || 0
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  function score(b) {
    const v = (b.a + b.b) / 1e6;
    const age = Math.max(0.1, (now() - b.start) / 3600);
    const rem = Math.max(0.1, (b.end - now()) / 3600);
    return Math.log(v + 1) * 5 + (1 / (age + 1)) * 30 + (!b.resolved ? (1 / (rem + 1)) * 20 : 0);
  }

  function remText(e) {
    const d = Math.max(0, e - now());
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m remaining`;
  }

  function prog(s1, e1) {
    const t = Math.max(1, e1 - s1);
    const el = Math.min(t, Math.max(0, now() - s1));
    return (el / t) * 100;
  }

  function esc(s1) {
    return String(s1 || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function filtered(ended) {
    let x = [...s.battles];
    x = ended
      ? x.filter(b => b.resolved || now() >= b.end)
      : x.filter(b => !b.resolved && now() < b.end);

    if (s.cat !== 'All') x = x.filter(b => b.cats.includes(s.cat));

    if (s.q) {
      const q = s.q.toLowerCase();
      x = x.filter(b =>
        [b.title, b.desc, b.la, b.lb, b.cats.join(' ')].join(' ').toLowerCase().includes(q)
      );
    }

    return x.sort((a, b) => score(b) - score(a));
  }

  function canHideBattle(b) {
    return !!(s.address && b.creator && b.creator.toLowerCase() === s.address.toLowerCase());
  }

  function mediaHtml(src) {
    return src
      ? `<div class="media"><img src="${src}" alt=""></div>`
      : `<div class="media empty-media">No image</div>`;
  }

  function card(b) {
    const t = b.a + b.b;
    const pA = t ? Math.round((b.a / t) * 100) : 50;
    const pB = 100 - pA;
    const ended = b.resolved || now() >= b.end;
    const fill = ended ? '#9ca3af' : (pA >= pB ? 'var(--blue)' : 'var(--red)');
    const winnerA = ended && b.w === 1;
    const winnerB = ended && b.w === 2;
    const p = get(LS.profile, {});

    return `
      <article class="battle card">
        <div class="head">
          <div class="user">
            <img src="${p.avatar || 'assets/images/avatar.webp'}" alt="">
            <div>
              <strong>${esc(p.username || fmtAddr(b.creator))}</strong>
              <div class="mini">${esc(b.cats.join(' • '))}</div>
            </div>
          </div>
          <div>${ended ? '<span class="badge ended">Ended</span>' : '<span class="badge live">Live</span>'}</div>
        </div>

        <h2>${esc(b.title)}</h2>
        <p>${esc(b.desc)}</p>

        <div class="grid2">
          <div class="opt">
            <h4>${esc(b.la)}</h4>
            ${mediaHtml(b.ia)}
            <button class="votea ${ended && winnerA ? 'winner-a' : ''}" data-vote="${b.id}" data-side="1">
              <span class="lbl">${esc(b.la)}</span>
              <span class="pct">${pA}%</span>
            </button>
          </div>

          <div class="opt">
            <h4>${esc(b.lb)}</h4>
            ${mediaHtml(b.ib)}
            <button class="voteb ${ended && winnerB ? 'winner-b' : ''}" data-vote="${b.id}" data-side="2">
              <span class="pct">${pB}%</span>
              <span class="lbl">${esc(b.lb)}</span>
            </button>
          </div>
        </div>

        <div class="time">
          <img class="icon" src="assets/icons/clock.svg" alt="">
          <div class="bar">
            <div class="fill" style="width:${prog(b.start, b.end)}%;background:${fill}"></div>
          </div>
          <span>${ended ? 'Ended' : remText(b.end)}</span>
        </div>

        <div class="meta">
          <div class="acts">
            <button class="iconbtn" data-like="${b.id}"><img src="assets/icons/heart.svg" alt="">${b.likes}</button>
            <button class="iconbtn"><img src="assets/icons/comment.svg" alt="">0</button>
            <button class="iconbtn" data-share="${b.id}"><img src="assets/icons/share.svg" alt="">Share on X</button>
            <button class="iconbtn" data-copy="${b.id}"><img src="assets/icons/copy.svg" alt="">Copy link</button>
            ${canHideBattle(b) ? `<button class="iconbtn delete-battle" data-delete="${b.id}"><img src="assets/icons/trash.svg" alt="">Hide test battle</button>` : ''}
          </div>
          <div class="acts">
            <span>${fmtUSD(t / 1e6)} at stake</span>
            <span>${Math.round(t / 1e6)} voters</span>
          </div>
        </div>
      </article>
    `;
  }

  function render(id, ended) {
    const el = document.getElementById(id);
    if (!el) return;
    const list = filtered(ended);
    el.innerHTML = list.length
      ? list.map(card).join('')
      : '<section class="card" style="padding:24px;text-align:center;color:var(--muted)">No battles found.</section>';
    bindCards();
  }

  function hideBattle(id) {
    const hidden = get(LS.hiddenBattles, {});
    hidden[id] = true;
    set(LS.hiddenBattles, hidden);
    loadBattles().then(() => {
      render(document.body.dataset.page === 'results' ? 'resultsFeed' : 'feed', document.body.dataset.page === 'results');
    });
  }

  function bindCards() {
    $$('[data-like]').forEach(b => b.onclick = () => {
      const l = get(LS.likes, {});
      l[b.dataset.like] = (l[b.dataset.like] || 0) + 1;
      set(LS.likes, l);
      render(document.body.dataset.page === 'results' ? 'resultsFeed' : 'feed', document.body.dataset.page === 'results');
    });

    $$('[data-copy]').forEach(b => b.onclick = () => {
      navigator.clipboard.writeText(`${location.origin}${location.pathname}?battle=${b.dataset.copy}`);
    });

    $$('[data-share]').forEach(b => b.onclick = () => {
      const battle = s.battles.find(x => String(x.id) === b.dataset.share);
      const ref = s.address ? `${location.origin}/?ref=${s.address}` : location.origin;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent('Choose your side on Votage: ' + (battle?.title || 'Battle'))}&url=${encodeURIComponent(ref)}`,
        '_blank'
      );
    });

    $$('[data-delete]').forEach(b => b.onclick = () => {
      const ok = window.confirm('Hide this test battle from your feed?');
      if (ok) hideBattle(b.dataset.delete);
    });

    $$('[data-vote]').forEach(b => b.onclick = async () => {
      if (!await connect(true)) return;
      const battle = s.battles.find(x => x.id === Number(b.dataset.vote));
      const side = Number(b.dataset.side);
      s.vote = { battle, side };
      const price = s.pool ? Number(await s.pool.getPrice()) / 1e6 : 0;
      const label = side === 1 ? battle.la : battle.lb;
      const img = side === 1 ? battle.ia : battle.ib;

      $('#voteBody').innerHTML = `
        ${img ? `<div class="media"><img src="${img}" alt=""></div>` : '<div class="media empty-media">No image</div>'}
        <div>
          <strong style="font-size:22px">${esc(label)}</strong>
          <div class="small">You are voting in <strong>${esc(battle.title)}</strong></div>
        </div>
        <div class="warn">Current vote price: <strong>${fmtUSD(price)}</strong> (live quote for 1 WIN from the pool)</div>
        <div class="small">To increase exposure, vote again after this transaction.</div>
      `;

      open('voteModal');
    });
  }

  function initCaptcha() {
    if (!window.turnstile) return;
    if (captchaRendered) return;
    const box = document.getElementById('captchaBox');
    if (!box) return;
    if (!CFG?.captcha?.siteKey) return;

    captchaWidgetId = turnstile.render('#captchaBox', {
      sitekey: CFG.captcha.siteKey,
      theme: 'light',
      callback: function (token) {
        captchaToken = token;
        $('#captchaMsg') && ($('#captchaMsg').textContent = 'Verified');
      },
      'expired-callback': function () {
        captchaToken = null;
        $('#captchaMsg') && ($('#captchaMsg').textContent = 'Verification expired. Please solve it again.');
      },
      'timeout-callback': function () {
        captchaToken = null;
        $('#captchaMsg') && ($('#captchaMsg').textContent = 'Verification timed out. Please try again.');
      },
      'error-callback': function () {
        captchaToken = null;
        $('#captchaMsg') && ($('#captchaMsg').textContent = 'Could not load the security check.');
      }
    });

    captchaRendered = true;
  }

  function resetCaptcha() {
    captchaToken = null;
    $('#captchaMsg') && ($('#captchaMsg').textContent = '');
    if (window.turnstile && captchaWidgetId !== null) {
      try { turnstile.reset(captchaWidgetId); } catch {}
    }
  }

  function open(id) {
    document.getElementById(id)?.classList.add('open');
    if (id === 'createModal') {
      setTimeout(() => {
        initCaptcha();
        resetCaptcha();
      }, 0);
    }
  }

  function close(id) {
    document.getElementById(id)?.classList.remove('open');
  }

  function modalClose() {
    $$('[data-close]').forEach(b => b.onclick = () => close(b.dataset.close));
    ['createModal', 'voteModal'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        if (e.target.id === id) close(id);
      });
    });
  }

  function cats() {
    const home = ['All', 'Crypto', 'Tech', 'Games', 'Movies', 'Food', 'Design', 'Sports', 'Trends'];
    const create = ['Crypto', 'Tech', 'Games', 'Movies', 'Food', 'Design', 'Sports', 'Trends'];

    $('#chips') && ($('#chips').innerHTML = home.map(c =>
      `<button class="chip ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join(''));

    $('#createCats') && ($('#createCats').innerHTML = create.map(c =>
      `<button class="catbtn ${s.cats.includes(c) ? 'active' : ''}" data-ccat="${c}">${c}</button>`
    ).join(''));

    $$('[data-cat]').forEach(b => b.onclick = () => {
      $$('[data-cat]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      s.cat = b.dataset.cat;
      render('feed', false);
    });

    $$('[data-ccat]').forEach(b => b.onclick = () => {
      const c = b.dataset.ccat;
      if (s.cats.includes(c)) {
        s.cats = s.cats.filter(x => x !== c);
        b.classList.remove('active');
      } else if (s.cats.length < 2) {
        s.cats.push(c);
        b.classList.add('active');
      }
    });
  }

  function resetDrop(which) {
    const drop = $('#drop' + which);
    if (!drop) return;
    drop.classList.remove('has');
    drop.style.backgroundImage = 'none';
    const text = drop.querySelector('.drop-text');
    if (text) text.textContent = 'Upload image';
  }

  function initCreate() {
    const r = $('#days');
    r && r.addEventListener('input', () => {
      s.days = Number(r.value);
      $('#daysLabel').textContent = `${s.days} ${s.days === 1 ? 'day' : 'days'}`;
      $('#daysCost').textContent = `Estimated creation cost: ${fmtUSD(s.days * 1)}`;
    });

    bindUpload('A');
    bindUpload('B');
  }

  function bindUpload(which) {
    const drop = $('#drop' + which);
    const file = $('#file' + which);
    if (!drop || !file) return;

    drop.onclick = e => {
      if (e.target === file) return;
      file.click();
    };

    file.onchange = e => {
      const f = e.target.files[0];
      if (f) process(which, f);
    };
  }

  async function process(which, file) {
    if (file.size > 2 * 1024 * 1024) {
      $('#imgError').textContent = 'This file is too large. Please upload an image under 2MB.';
      return;
    }
    $('#imgError') && ($('#imgError').textContent = '');

    const fr = new FileReader();
    fr.onload = () => {
      s.imgs[which.toLowerCase()] = fr.result;
      const d = $('#drop' + which);
      d.classList.add('has');
      d.style.backgroundImage = `url("${fr.result}")`;
      const text = d.querySelector('.drop-text');
      if (text) text.textContent = 'Change image';
    };
    fr.readAsDataURL(file);
  }

  function resetCreateForm() {
    $('#createSuccess') && $('#createSuccess').classList.remove('show');
    $('#createForm') && $('#createForm').classList.remove('hidden');
    ['title', 'desc', 'labelA', 'labelB'].forEach(id => {
      const el = $('#' + id);
      if (el) el.value = '';
    });
    s.cats = ['Crypto'];
    s.imgs = { a: null, b: null };
    resetDrop('A');
    resetDrop('B');
    $('#imgError') && ($('#imgError').textContent = '');
    cats();
  }

  async function createBattle() {
    if (!captchaToken) {
      alert('Complete the security check before creating a battle.');
      return;
    }

    if (!s.signer) {
      alert('Connect wallet first.');
      return;
    }

    const title = $('#title').value.trim();
    const desc = $('#desc').value.trim();
    const la = $('#labelA').value.trim();
    const lb = $('#labelB').value.trim();

    if (!title || !la || !lb || !s.imgs.a || !s.imgs.b || s.cats.length < 1) {
      alert('Title, labels, categories and both images are required.');
      return;
    }

    try {
      const tx = await s.bm.createBattle(s.days);
      await tx.wait();

      const id = Number(await s.bm.battleCount());
      const m = get(LS.meta, {});
      m[id] = {
        title,
        desc,
        la,
        lb,
        cats: s.cats,
        ia: s.imgs.a,
        ib: s.imgs.b
      };
      set(LS.meta, m);

      $('#createSuccess').classList.add('show');
      $('#createForm').classList.add('hidden');

      localStorage.setItem(LS.points, String(Number(localStorage.getItem(LS.points) || '0') + 5));
      unlock('initiator');

      resetCaptcha();
      await refreshUi();
    } catch (e) {
      console.error(e);
      alert('Create battle failed.');
    }
  }

  async function vote() {
    if (!await connect(true)) return;

    try {
      const price = BigInt(Math.round(Number(await s.pool.getPrice())));
      const allowance = await s.usdc.allowance(s.address, CFG.contracts.battleManager);

      if (allowance < price) {
        const txa = await s.usdc.approve(CFG.contracts.battleManager, price);
        await txa.wait();
      }

      const tx = await s.bm.vote(s.vote.battle.id, s.vote.side, price);
      await tx.wait();

      localStorage.setItem(LS.points, String(Number(localStorage.getItem(LS.points) || '0') + 1));
      unlock('challenger');
      close('voteModal');
      await refreshUi();
    } catch (e) {
      console.error(e);
      alert('Vote failed.');
    }
  }

  async function market() {
    if (!s.win || !s.pool || !$('#marketTotalSupply')) return;

    try {
      const supply = await s.win.totalSupply();
      const reserveWIN = await s.pool.reserveWIN();
      const reserveUSDC = await s.pool.reserveUSDC();
      const price = Number(await s.pool.getPrice()) / 1e6;

      s.marketPrice = price;
      s.marketData.reserveUsdc = Number(ethers.formatUnits(reserveUSDC, 6));
      s.marketData.reserveWin = Number(ethers.formatUnits(reserveWIN, 18));

      $('#marketTotalSupply').textContent = fmtNum(Number(ethers.formatUnits(supply, 18)));
      $('#poolReserveUsdc') && ($('#poolReserveUsdc').textContent = fmtUSD(s.marketData.reserveUsdc));
      $('#poolReserveWin') && ($('#poolReserveWin').textContent = fmtNum(s.marketData.reserveWin));
      $('#marketQuote') && ($('#marketQuote').value = price ? `1 WIN = ${fmtUSD(price)} USDC` : 'Price unavailable');
      $('#marketQuoteText') && ($('#marketQuoteText').textContent = price ? fmtUSD(price) : '—');

      if (s.address) {
        const walletUsdc = await s.usdc.balanceOf(s.address);
        const walletWin = await s.win.balanceOf(s.address);
        s.marketData.walletUsdc = Number(ethers.formatUnits(walletUsdc, 6));
        s.marketData.walletWin = Number(ethers.formatUnits(walletWin, 18));
        $('#walletUsdcBal') && ($('#walletUsdcBal').textContent = fmtUSD(s.marketData.walletUsdc));
        $('#walletWinBal') && ($('#walletWinBal').textContent = fmtNum(s.marketData.walletWin));
        $('#swapHint') && ($('#swapHint').textContent = 'Live quote loaded. Use USDC amount for buy or WIN amount for sell.');
      } else {
        $('#walletUsdcBal') && ($('#walletUsdcBal').textContent = 'Connect wallet');
        $('#walletWinBal') && ($('#walletWinBal').textContent = 'Connect wallet');
        $('#swapHint') && ($('#swapHint').textContent = 'Connect your wallet to trade or add liquidity. Live market data is already loaded.');
      }

      recalcLiquidityFromUsdc();
    } catch (e) {
      console.error(e);
      $('#marketQuote') && ($('#marketQuote').value = 'Price unavailable');
      $('#marketQuoteText') && ($('#marketQuoteText').textContent = '—');
    }
  }

  function recalcLiquidityFromUsdc() {
    const usdcEl = $('#liqUsdc');
    const winEl = $('#liqWin');
    if (!usdcEl || !winEl) return;

    const usdc = Number(usdcEl.value || 0);
    if (!s.marketPrice || usdc <= 0) {
      winEl.value = '';
      $('#liqSummary') && ($('#liqSummary').textContent = 'Enter a USDC amount and the matching WIN amount will be calculated from the live pool price.');
      return;
    }

    const win = usdc / s.marketPrice;
    winEl.value = win ? win.toFixed(4) : '';
    $('#liqSummary') && ($('#liqSummary').textContent = `${fmtUSD(usdc)} currently matches approximately ${fmtNum(win)} WIN at the live pool price.`);
  }

  async function swap(direction) {
    if (!await connect(true)) return;

    const raw = $('#swapAmount').value.trim();
    if (!raw || Number(raw) <= 0) {
      alert('Enter an amount.');
      return;
    }

    try {
      if (direction === 'buy') {
        const a = BigInt(Math.round(Number(raw) * 1e6));
        const al = await s.usdc.allowance(s.address, CFG.contracts.pool);
        if (al < a) {
          const txa = await s.usdc.approve(CFG.contracts.pool, a);
          await txa.wait();
        }
        const tx = await s.pool.swapUSDCforWIN(a);
        await tx.wait();
      } else {
        const a = ethers.parseUnits(raw, 18);
        const al = await s.win.allowance(s.address, CFG.contracts.pool);
        if (al < a) {
          const txa = await s.win.approve(CFG.contracts.pool, a);
          await txa.wait();
        }
        const tx = await s.pool.swapWINforUSDC(a);
        await tx.wait();
      }

      localStorage.setItem(LS.points, String(Number(localStorage.getItem(LS.points) || '0') + 2));
      unlock('initiated-trader');
      await refreshUi();
      alert('Swap completed.');
    } catch (e) {
      console.error(e);
      alert('Swap failed.');
    }
  }

  async function addLiq() {
    if (!await connect(true)) return;

    const usdc = $('#liqUsdc').value.trim();
    const win = $('#liqWin').value.trim();
    if (!usdc || !win) {
      alert('Enter both amounts.');
      return;
    }

    try {
      const ua = BigInt(Math.round(Number(usdc) * 1e6));
      const wa = ethers.parseUnits(win, 18);
      const au = await s.usdc.allowance(s.address, CFG.contracts.pool);
      const aw = await s.win.allowance(s.address, CFG.contracts.pool);

      if (au < ua) {
        const tx1 = await s.usdc.approve(CFG.contracts.pool, ua);
        await tx1.wait();
      }

      if (aw < wa) {
        const tx2 = await s.win.approve(CFG.contracts.pool, wa);
        await tx2.wait();
      }

      const tx = await s.pool.addLiquidity(wa, ua);
      await tx.wait();

      localStorage.setItem(LS.points, String(Number(localStorage.getItem(LS.points) || '0') + 4));
      unlock('pool-walker');
      await refreshUi();
      alert('Liquidity added.');
    } catch (e) {
      console.error(e);
      alert('Add liquidity failed.');
    }
  }

  function unlock(id) {
    const u = get(LS.unlocked, {});
    u[id] = true;
    set(LS.unlocked, u);
  }

  function renderBadges(past = false) {
    const g = $('#badges');
    if (!g) return;
    const unlocked = past ? (get(LS.archive, {}).badges || {}) : get(LS.unlocked, {});
    g.innerHTML = s.badges.map(b => `
      <article class="tile ${unlocked[b.id] ? '' : 'locked'}">
        <img src="assets/badges/${b.id}-${unlocked[b.id] ? 'color' : 'gray'}.webp" alt="">
        <div class="mini">${esc(b.track)}</div>
        <strong>${esc(b.name)}</strong>
        <div class="small">${esc(b.rule)}<br>${esc(b.desc)}<br><strong>Boost +${b.multiplier}%</strong></div>
      </article>
    `).join('');
  }

  async function points() {
    if (!$('#pointsVal')) return;

    const verified = get(LS.verified, false);
    $('#pointsVal').textContent = localStorage.getItem(LS.points) || '0';
    $('#streakVal').textContent = (localStorage.getItem(LS.streak) || '0') + ' days';
    $('#captchaState').textContent = verified ? 'Verified' : 'Not verified';
    $('#refLink').value = s.address ? `${location.origin}/?ref=${s.address}` : location.href;

    const p = get(LS.profile, {});
    $('#savedName') && ($('#savedName').textContent = p.username || 'Guest');
    $('#savedX') && ($('#savedX').textContent = p.x || '@not-connected');
    $('#avatarPreview') && ($('#avatarPreview').src = p.avatar || 'assets/images/avatar.webp');
    $('#topAvatar') && ($('#topAvatar').src = p.avatar || 'assets/images/avatar.webp');

    if ($('#verifyBtn')) {
      $('#verifyBtn').textContent = verified ? 'Verified' : 'Verify account';
      $('#verifyBtn').classList.toggle('disabled-btn', verified);
    }

    if (new Date() > new Date(CFG.seasonEnd) && s.address && s.rd) {
      try {
        const r = await s.rd.rewards(s.address);
        $('#claimText').textContent = fmtNum(Number(ethers.formatUnits(r, 18))) + ' WIN';
        $('#claimBtn').disabled = false;
        $('#claimBtn').classList.remove('disabled-btn');
      } catch (e) {
        console.error(e);
      }
    }

    renderBadges(false);
  }

  function bindPoints() {
    $('#verifyBtn') && ($('#verifyBtn').onclick = async () => {
      if (!get(LS.verified, false)) {
        if (!s.address) {
          const ok = await connect(true);
          if (!ok) return;
        }
        set(LS.verified, true);
        localStorage.setItem(LS.points, String(Number(localStorage.getItem(LS.points) || '0') + 10));
      }
      points();
    });

    $('#profileFile') && ($('#profileFile').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        const p = get(LS.profile, {});
        p.avatar = fr.result;
        set(LS.profile, p);
        $('#avatarPreview') && ($('#avatarPreview').src = fr.result);
        top();
        points();
      };
      fr.readAsDataURL(f);
    });

    $('#uploadProfile') && ($('#uploadProfile').onclick = () => $('#profileFile')?.click());
    $('#avatarPreview') && ($('#avatarPreview').onclick = () => $('#profileFile')?.click());

    $('#editNameBtn') && ($('#editNameBtn').onclick = () => {
      $('#nameEditWrap')?.classList.toggle('hidden');
      const p = get(LS.profile, {});
      $('#userName') && ($('#userName').value = p.username || '');
    });

    $('#saveNameBtn') && ($('#saveNameBtn').onclick = () => {
      const p = get(LS.profile, {});
      p.username = ($('#userName')?.value || '').trim() || 'Guest';
      set(LS.profile, p);
      $('#nameEditWrap')?.classList.add('hidden');
      top();
      points();
    });

    $('#connectX') && ($('#connectX').onclick = () => {
      const p = get(LS.profile, {});
      p.x = p.x || '@connected';
      set(LS.profile, p);
      points();
    });

    $('#shareRef') && ($('#shareRef').onclick = () => {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent('Join me on Votage and choose your side.')}&url=${encodeURIComponent($('#refLink').value)}`,
        '_blank'
      );
    });

    $('#claimBtn') && ($('#claimBtn').onclick = async () => {
      if (!await connect(true)) return;
      try {
        const tx = await s.rd.claim();
        await tx.wait();
        alert('Reward claimed.');
      } catch (e) {
        alert('Claim failed or no rewards available.');
      }
    });

    $$('.tab').forEach(b => b.onclick = () => {
      $$('.tab').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderBadges(b.dataset.season === 'past');
    });
  }

  function initMarketInteractions() {
    $('#liqUsdc') && $('#liqUsdc').addEventListener('input', recalcLiquidityFromUsdc);

    $('#liqHalfBtn') && ($('#liqHalfBtn').onclick = () => {
      if (!s.marketData.walletUsdc) return;
      $('#liqUsdc').value = (s.marketData.walletUsdc / 2).toFixed(2);
      recalcLiquidityFromUsdc();
    });

    $('#liqMaxBtn') && ($('#liqMaxBtn').onclick = () => {
      if (!s.marketData.walletUsdc) return;
      $('#liqUsdc').value = s.marketData.walletUsdc.toFixed(2);
      recalcLiquidityFromUsdc();
    });
  }

  function scrollTop() {
    const btn = $('#scrollTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 380) btn.classList.add('show');
      else btn.classList.remove('show');
    });

    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function refreshUi() {
    if (s.bm) {
      await loadBattles();
      render('feed', false);
      render('resultsFeed', true);
    }
    await market();
    await points();
  }

  async function handleConnectButton() {
    if (s.address) {
      await disconnect();
    } else {
      await connect(true);
    }
  }

  async function initReadMode() {
    const provider = await ensureProvider();
    if (!provider) return;
    initContracts(provider);
    await refreshUi();
  }

  async function init() {
    nav();
    modalClose();
    cats();
    initCreate();
    initMarketInteractions();
    bindPoints();

    $('#connectBtn') && ($('#connectBtn').onclick = handleConnectButton);
    $('#disconnectBtn') && ($('#disconnectBtn').onclick = disconnect);
    $('#openCreateBtn') && ($('#openCreateBtn').onclick = () => open('createModal'));
    $('#heroCreateBtn') && ($('#heroCreateBtn').onclick = () => open('createModal'));
    $('#createBtn') && ($('#createBtn').onclick = createBattle);
    $('#voteBtn') && ($('#voteBtn').onclick = vote);
    $('#swapBuy') && ($('#swapBuy').onclick = () => swap('buy'));
    $('#swapSell') && ($('#swapSell').onclick = () => swap('sell'));
    $('#liqBtn') && ($('#liqBtn').onclick = addLiq);

    $('#searchInput') && ($('#searchInput').addEventListener('input', e => {
      s.q = e.target.value.trim();
      render('feed', false);
    }));

    scrollTop();
    await loadBadges();
    top();

    const manualDisconnect = localStorage.getItem(LS.walletDisconnected) === '1';
    if (!manualDisconnect) {
      try {
        await connect(false);
      } catch (e) {
        console.error(e);
        await initReadMode();
      }
    } else {
      await initReadMode();
    }
  }

  window.addEventListener('load', init);
})();
