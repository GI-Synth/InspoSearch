document.addEventListener('DOMContentLoaded', function () {
  var itemsEl = document.getElementById('items');
  var countEl = document.getElementById('count');

  chrome.runtime.sendMessage({ action: 'get-saved' }, function (board) {
    if (!board || !board.length) {
      itemsEl.innerHTML = '<div class="empty">no images saved yet.<br>right-click any image \u2192 save to insposearch board</div>';
      countEl.textContent = '0 images';
      return;
    }
    countEl.textContent = board.length + ' image' + (board.length === 1 ? '' : 's');
    var recent = board.slice().reverse().slice(0, 30);
    recent.forEach(function (item) {
      var img = document.createElement('img');
      img.src = item.imageUrl;
      img.alt = item.pageTitle || '';
      img.title = item.pageTitle || item.imageUrl;
      itemsEl.appendChild(img);
    });
  });

  document.getElementById('btn-clear').addEventListener('click', function () {
    chrome.runtime.sendMessage({ action: 'clear-board' }, function () {
      itemsEl.innerHTML = '<div class="empty">board cleared</div>';
      countEl.textContent = '0 images';
    });
  });
});
