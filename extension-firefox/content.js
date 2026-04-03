/**
 * InspoSearch Extension — Content Script (Firefox MV2)
 * Shows a toast confirmation when an image is saved via right-click.
 */

chrome.runtime.onMessage.addListener(function (msg) {
  if (msg.action !== 'inspo-save-image') return;

  chrome.storage.local.get({ inspoBoard: [] }, function (data) {
    var board = data.inspoBoard;
    board.push({
      imageUrl: msg.imageUrl,
      pageUrl: msg.pageUrl,
      pageTitle: msg.pageTitle,
      savedAt: new Date().toISOString(),
    });
    // Keep max 500 items
    if (board.length > 500) board.splice(0, board.length - 500);
    chrome.storage.local.set({ inspoBoard: board }, function () {
      showToast('saved to insposearch board');
    });
  });
});

function showToast(text) {
  var existing = document.getElementById('inspo-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'inspo-toast';
  toast.className = 'inspo-ext-toast';
  toast.textContent = text;
  document.body.appendChild(toast);

  setTimeout(function () { toast.classList.add('inspo-ext-toast-show'); }, 10);
  setTimeout(function () {
    toast.classList.remove('inspo-ext-toast-show');
    setTimeout(function () { toast.remove(); }, 300);
  }, 2000);
}
