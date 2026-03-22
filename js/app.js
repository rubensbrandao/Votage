
// Placeholder interactions only. Replace with real logic later.
document.querySelectorAll('.vote-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    alert('Placeholder flow: open mini modal → confirm vote → sign wallet.');
  });
});

document.querySelectorAll('.x-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    window.open('https://twitter.com/intent/tweet?text=Choose%20your%20side%20on%20Votage', '_blank');
  });
});
