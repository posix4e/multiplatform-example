// Safari Extension Background Script
// Listens for tab updates and sends history to main app via native messaging

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only report when the page has finished loading and has a URL
  if (changeInfo.status === 'complete' && tab.url) {
    const historyEntry = {
      url: tab.url,
      title: tab.title || 'Untitled',
      timestamp: Date.now()
    };

    // Send to native app via App Groups / native messaging
    browser.runtime.sendNativeMessage('com.multiplatform.example', {
      type: 'history_entry',
      payload: historyEntry
    }).then(response => {
      console.log('History entry sent successfully:', response);
    }).catch(error => {
      console.error('Failed to send history entry:', error);
    });
  }
});

// Handle messages from the native app
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse({ status: 'ok', timestamp: Date.now() });
  }
  return true;
});
