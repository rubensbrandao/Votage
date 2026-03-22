
const feed = document.getElementById("feed");

if(feed){
  const battles = [
    {title:"Mario vs Sonic", a:59, b:41},
    {title:"BTC vs ETH", a:52, b:48},
    {title:"iPhone vs Android", a:60, b:40}
  ];

  battles.forEach(b=>{
    const el=document.createElement("div");
    el.className="card";
    el.innerHTML=`
      <h3>${b.title}</h3>
      <div class="vote">
        <button class="btnA">${b.a}%</button>
        <button class="btnB">${b.b}%</button>
      </div>
    `;
    feed.appendChild(el);
  });
}
