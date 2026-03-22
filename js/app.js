
const swapModal = document.getElementById('swapModal');
document.querySelectorAll('.js-open-swap').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (swapModal) swapModal.classList.add('open');
  });
});
document.querySelectorAll('.js-close-swap').forEach(el => {
  el.addEventListener('click', () => {
    if (swapModal) swapModal.classList.remove('open');
  });
});
if (swapModal) {
  swapModal.addEventListener('click', (e) => {
    if (e.target === swapModal) swapModal.classList.remove('open');
  });
}

document.querySelectorAll('.js-wallet').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.textContent = btn.textContent.includes('Connect') ? 'Disconnect' : 'Connect Wallet';
  });
});

document.querySelectorAll('.vote-btn-a,.vote-btn-b').forEach(btn => {
  btn.addEventListener('click', () => {
    alert('Placeholder flow: open mini modal → confirm vote → sign wallet.');
  });
});
