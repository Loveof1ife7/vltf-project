(() => {
  const button = document.getElementById('copy-link');
  const address = document.getElementById('share-address');
  const url = document.querySelector('link[rel="canonical"]').href;

  address.value = url;
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      address.hidden = true;
      button.textContent = 'Link copied';
    } catch {
      button.textContent = 'Copy link';
      address.hidden = false;
      address.focus();
      address.select();
    }
  });
})();
