let sites = {};
let activeTab = null;
let startTime = null;

let adBlockEnabled = true;
let blockedCount = 0;
let blockingRules = {
  images: true,
  popups: true,
  trackers: true,
  social: true
};

const categories = {
  "Social Media": ["facebook.com", "twitter.com", "instagram.com", "linkedin.com","x.com"],
  "Work": ["github.com", "notion.so", "slack.com", "figma.com"],
  "News": ["bbc.com", "cnn.com", "nytimes.com", "theguardian.com"]
};

const adDomains = [
  "doubleclick.net",
  "googlesyndication.com",
  "adservice.google",
  "googleadservices.com",
  "moatads.com",
  "adnxs.com",
  "facebook.com/tr",
  "facebook.net",
  "ads.pubmatic.com",
  "adsystem.com",
  "taboola.com",
  "outbrain.com"
];

chrome.storage.local.get(["adBlockEnabled", "blockedCount", "blockingRules"], (result) => {
  adBlockEnabled = result.adBlockEnabled !== undefined ? result.adBlockEnabled : true;
  blockedCount = result.blockedCount || 0;
  blockingRules = result.blockingRules || {
    images: true,
    popups: true,
    trackers: true,
    social: true
  };
});

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
        try {
          activeTab = new URL(tab.url).hostname;
          startTime = Date.now();
        } catch (e) {
          console.error("Invalid URL:", tab.url);
        }
      }
    });
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      trackTime();
      try {
        activeTab = new URL(changeInfo.url).hostname;
        startTime = Date.now();
      } catch (e) {
        console.error("Invalid URL:", changeInfo.url);
      }
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
      if (tab.url) {
        for (const [category, sites] of Object.entries(categories)) {
          try {
            if (sites.some((site) => tab.url.includes(site))) {
              if (!groupedTabs[category]) groupedTabs[category] = [];
              groupedTabs[category].push(tab);
              break;
            }
          } catch (e) {
            console.error("Error processing tab:", tab.url);
          }
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

// Ad blocking functions
function shouldBlockRequest(details) {
  if (!adBlockEnabled) return false;
  
  try {
    const url = new URL(details.url);
    const domain = url.hostname;
    
    if (adDomains.some(adDomain => domain.includes(adDomain))) {
      incrementBlockedCount();
      return true;
    }
    
    if (details.type === 'image' && blockingRules.images && 
        (url.pathname.includes('ad') || url.pathname.includes('banner'))) {
      incrementBlockedCount();
      return true;
    }
    
    if (details.type === 'script' && blockingRules.trackers && 
        (url.pathname.includes('tracking') || url.pathname.includes('analytics'))) {
      incrementBlockedCount();
      return true;
    }
    
    if (blockingRules.social && 
        (domain.includes('facebook') || domain.includes('twitter') || 
         domain.includes('linkedin') || domain.includes('instagram'))) {
      incrementBlockedCount();
      return true;
    }
  } catch (e) {
    console.error("Error processing URL in ad blocker:", details.url);
  }
  
  return false;
}

function incrementBlockedCount() {
  blockedCount++;
  chrome.storage.local.set({ blockedCount });
}

if (chrome.webRequest) {
  chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      return { cancel: shouldBlockRequest(details) };
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveSession") saveSession();
  if (message.action === "restoreSession") restoreSession();
  
  if (message.type === "TOGGLE_AD_BLOCK") {
    adBlockEnabled = message.enabled;
    chrome.storage.local.set({ adBlockEnabled });
  }
  
  if (message.type === "UPDATE_BLOCKING_RULES") {
    blockingRules = message.rules;
    chrome.storage.local.set({ blockingRules });
  }
});

categorizeTabs();

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "popup") {
    port.onDisconnect.addListener(function() {
      chrome.storage.local.set({
        adBlockEnabled,
        blockedCount,
        blockingRules
      });
    });
  }
});