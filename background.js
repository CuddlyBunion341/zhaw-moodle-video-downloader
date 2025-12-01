// Background script to capture Kaltura video URLs from network requests
const videoUrlCache = new Map();

// Listen for all requests to Kaltura
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    const url = details.url;
    console.log('[Kaltura Downloader] Request intercepted:', url);

    // Look for .m3u8 URLs (HLS streams)
    if (url.includes('.m3u8') || url.includes('playManifest')) {
      const match = url.match(/entryId[\/=%]([^\/&%]+)/i);
      if (match) {
        const entryId = match[1];
        videoUrlCache.set(entryId, url);
        console.log('[Kaltura Downloader] Captured video URL for entry:', entryId, url);
      }
    }
  },
  {urls: [
    "*://*.kaltura.switch.ch/*",
    "*://*.kaltura.zhaw.ch/*",
    "*://api.kaltura.switch.ch/*"
  ]},
  []
);

// Also listen to completed requests to catch redirects
browser.webRequest.onCompleted.addListener(
  function(details) {
    const url = details.url;
    if (url.includes('.m3u8') || url.includes('playManifest')) {
      const match = url.match(/entryId[\/=%]([^\/&%]+)/i);
      if (match) {
        const entryId = match[1];
        if (!videoUrlCache.has(entryId)) {
          videoUrlCache.set(entryId, url);
          console.log('[Kaltura Downloader] Captured video URL from completed request:', entryId);
        }
      }
    }
  },
  {urls: [
    "*://*.kaltura.switch.ch/*",
    "*://*.kaltura.zhaw.ch/*",
    "*://api.kaltura.switch.ch/*"
  ]}
);

// Listen for messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getVideoUrl') {
    const url = videoUrlCache.get(message.entryId);
    console.log('[Kaltura Downloader] Requested URL for entry:', message.entryId, 'Found:', url);
    sendResponse({url: url || null});
  } else if (message.type === 'getAllUrls') {
    // Debug: return all cached URLs
    const allUrls = Object.fromEntries(videoUrlCache);
    sendResponse({urls: allUrls});
  }
  return true;
});
