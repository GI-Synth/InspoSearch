/**
 * InspoSearch Extension — Background Service Worker
 * Sets up right-click context menu for saving images to boards.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'inspo-save',
    title: 'Save to InspoSearch Board',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'inspo-save' && info.srcUrl) {
    // Send image URL to content script for overlay
    chrome.tabs.sendMessage(tab.id, {
      action: 'inspo-save-image',
      imageUrl: info.srcUrl,
      pageUrl: tab.url,
      pageTitle: tab.title || '',
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'get-saved') {
    chrome.storage.local.get({ inspoBoard: [] }, (data) => {
      sendResponse(data.inspoBoard);
    });
    return true; // async sendResponse
  }
  if (msg.action === 'clear-board') {
    chrome.storage.local.set({ inspoBoard: [] }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
