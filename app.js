const feed = document.getElementById("feed");

const data = [
  {title:"Mario vs Sonic", a:59, b:41},
  {title:"iPhone vs Android", a:52, b:48}
];

data.forEach(d=>{
  const el = document.createElement("div");
  el.className="card";
  el.innerHTML=`
    <h3>${d.title}</h3>
    <div class="vote">
      <button class="btnA">${d.a}%</button>
      <button class="btnB">${d.b}%</button>
    </div>
  `;
  feed.appendChild(el);
});
