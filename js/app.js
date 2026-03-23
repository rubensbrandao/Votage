const leaderboard = [
  { wallet: "0xA1...91", points: 1200 },
  { wallet: "0xF3...22", points: 980 },
  { wallet: "0x9B...77", points: 870 },
];

function renderLeaderboard() {
  const container = document.getElementById("leaderboardList");
  container.innerHTML = "";

  leaderboard.forEach((user, i) => {
    const div = document.createElement("div");

    div.innerHTML = `
      <strong>#${i + 1}</strong>
      ${user.wallet}
      <span>${user.points} pts</span>
    `;

    container.appendChild(div);
  });
}

renderLeaderboard();
