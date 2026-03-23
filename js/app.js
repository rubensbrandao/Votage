// ===== CONNECT (mock por enquanto) =====
document.getElementById("connectBtn")?.addEventListener("click", () => {
  alert("Wallet connect (mock)");
});

// ===== VOTE =====
document.querySelectorAll(".vote").forEach(btn => {
  btn.addEventListener("click", () => {

    let votes = document.getElementById("votes");
    let volume = document.getElementById("volume");
    let burn = document.getElementById("burn");

    votes.innerText = Number(votes.innerText) + 1;
    volume.innerText = Number(volume.innerText) + 5;
    burn.innerText = Number(burn.innerText) + 1;

    alert("+5 value generated 🔥");
  });
});


// ===== LEADERBOARD =====
const leaderboard = [
  { wallet: "0xA1...91", points: 1200 },
  { wallet: "0xF3...22", points: 980 },
  { wallet: "0x9B...77", points: 870 },
];

function renderLeaderboard() {
  const container = document.getElementById("leaderboardList");

  if (!container) return;

  leaderboard.forEach((user, i) => {
    const div = document.createElement("div");

    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.margin = "8px 0";

    div.innerHTML = `
      <span>#${i + 1} ${user.wallet}</span>
      <span>${user.points} pts</span>
    `;

    container.appendChild(div);
  });
}

renderLeaderboard();
