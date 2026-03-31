document.addEventListener('DOMContentLoaded', () => {
  const itemsEl = document.getElementById('items');
  const countEl = document.getElementById('count');

  chrome.runtime.sendMessage({ action: 'get-saved' }, (board) => {
    if (!board || !board.length) {
      itemsEl.innerHTML = '<div class="empty">no images saved yet.<br>right-click any image → save to insposearch board</div>';
      countEl.textContent = '0 images';
      return;
    }
    countEl.textContent = board.length + ' image' + (board.length === 1 ? '' : 's');
    // Show most recent first
    const recent = board.slice().reverse().slice(0, 30);
    recent.forEach((item) => {
      const img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.pageTitle || '';
      img.title = item.pageTitle || item.imageUrl;
      itemsEl.appendChild(img);
    });
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clear-board' }, () => {
      itemsEl.innerHTML = '<div class="empty">board cleared</div>';
      countEl.textContent = '0 images';
    });
  });
});
