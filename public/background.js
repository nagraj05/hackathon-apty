let sites = {};
let activeTab = null;
let startTime = null;

const categories = {
  "Social Media": ["facebook.com", "twitter.com", "instagram.com", "linkedin.com","x.com"],
  "Work": ["github.com", "notion.so", "slack.com", "figma.com"],
  "News": ["bbc.com", "cnn.com", "nytimes.com", "theguardian.com"]
};

function trackTime() {
  if (activeTab && startTime) {
    let elapsed = Date.now() - startTime;
    sites[activeTab] = (sites[activeTab] || 0) + elapsed;
  }
  startTime = Date.now();
  chrome.storage.local.set({ sites });
}

if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    trackTime();
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab && tab.url) {
        activeTab = new URL(tab.url).hostname;
        startTime = Date.now();
      }
    });
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      trackTime();
      activeTab = new URL(changeInfo.url).hostname;
      startTime = Date.now();
    }
  });

  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      trackTime();
      activeTab = null;
    }
  });
}

// Function to group tabs
function categorizeTabs() {
  chrome.tabs.query({}, (tabs) => {
    let groupedTabs = {};

    tabs.forEach((tab) => {
      for (const [category, sites] of Object.entries(categories)) {
        if (sites.some((site) => tab.url.includes(site))) {
          if (!groupedTabs[category]) groupedTabs[category] = [];
          groupedTabs[category].push(tab);
          break;
        }
      }
    });

    chrome.storage.local.set({ groupedTabs });
  });
}

function saveSession() {
  chrome.tabs.query({}, (tabs) => {
    chrome.storage.local.set({ savedSession: tabs });
  });
}

function restoreSession() {
  chrome.storage.local.get(["savedSession"], (result) => {
    if (result.savedSession) {
      result.savedSession.forEach((tab) => {
        chrome.tabs.create({ url: tab.url });
      });
    }
  });
}

chrome.tabs.onUpdated.addListener(categorizeTabs);
chrome.tabs.onRemoved.addListener(categorizeTabs);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "saveSession") saveSession();
  if (message.action === "restoreSession") restoreSession();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_NOTE") {
    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      if (message.index !== undefined) {
        notes[message.index] = message.note;
      } else {
        notes.push(message.note);
      }
      chrome.storage.local.set({ notes });
    });
  } else if (message.type === "GET_NOTES") {
    chrome.storage.local.get(["notes"], (result) => {
      sendResponse({ notes: result.notes || [] });
    });
    return true;
  } else if (message.type === "DELETE_NOTE") {
    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      notes.splice(message.index, 1);
      chrome.storage.local.set({ notes });
    });
  }
});
