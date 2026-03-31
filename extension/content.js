/**
 * InspoSearch Extension — Content Script
 * Shows a brief toast confirmation when an image is saved via right-click.
 */

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== 'inspo-save-image') return;

  // Save to chrome.storage.local
  chrome.storage.local.get({ inspoBoard: [] }, (data) => {
    const board = data.inspoBoard;
    board.push({
      imageUrl: msg.imageUrl,
      pageUrl: msg.pageUrl,
      pageTitle: msg.pageTitle,
      savedAt: new Date().toISOString(),
    });
    // Keep max 500 items
    if (board.length > 500) board.splice(0, board.length - 500);
    chrome.storage.local.set({ inspoBoard: board }, () => {
      showToast('saved to insposearch board');
    });
  });
});

function showToast(text) {
  const existing = document.getElementById('inspo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'inspo-toast';
  toast.className = 'inspo-ext-toast';
  toast.textContent = text;
  document.body.appendChild(toast);

  setTimeout(() => { toast.classList.add('inspo-ext-toast-show'); }, 10);
  setTimeout(() => {
    toast.classList.remove('inspo-ext-toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
