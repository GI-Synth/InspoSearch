/**
 * InspoSearch Extension — Background Script (Firefox MV2)
 * Uses chrome.* API which Firefox maps via the webextensions polyfill.
 * Sets up right-click context menu for saving images to boards.
 */

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'inspo-save',
    title: 'Save to InspoSearch Board',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === 'inspo-save' && info.srcUrl) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'inspo-save-image',
      imageUrl: info.srcUrl,
      pageUrl: tab.url,
      pageTitle: tab.title || '',
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.action === 'get-saved') {
    chrome.storage.local.get({ inspoBoard: [] }, function (data) {
      sendResponse(data.inspoBoard);
    });
    return true; // async sendResponse
  }
  if (msg.action === 'clear-board') {
    chrome.storage.local.set({ inspoBoard: [] }, function () {
      sendResponse({ ok: true });
    });
    return true;
  }
});
