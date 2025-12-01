// Content script to detect Kaltura videos and add download buttons

class KalturaDownloader {
  constructor() {
    this.processedVideos = new Set();
    this.init();
  }

  init() {
    this.processVideos();
    this.observeDOM();
  }

  observeDOM() {
    const observer = new MutationObserver(() => {
      this.processVideos();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processVideos() {
    const kalturaContainers = document.querySelectorAll('.kaltura-player-container');

    kalturaContainers.forEach(container => {
      if (this.processedVideos.has(container)) {
        return;
      }

      this.processedVideos.add(container);
      const iframe = container.querySelector('iframe.kaltura-player-iframe');

      if (iframe) {
        this.addDownloadButton(container, iframe);
      }
    });
  }

  extractEntryId(iframeSrc) {
    const match = iframeSrc.match(/entryid%2F([^%\/]+)/i) ||
                  iframeSrc.match(/entryid\/([^\/]+)/i);
    return match ? match[1] : null;
  }

  async getVideoUrl(entryId) {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'getVideoUrl',
        entryId: entryId
      });
      return response.url;
    } catch (error) {
      console.error('[Kaltura Downloader] Error getting video URL:', error);
      return null;
    }
  }

  addDownloadButton(container, iframe) {
    const entryId = this.extractEntryId(iframe.src);

    if (!entryId) {
      console.warn('[Kaltura Downloader] Could not extract entry ID from iframe');
      return;
    }

    const button = document.createElement('button');
    button.className = 'kaltura-download-btn';
    button.textContent = '⎘ Copy';
    button.title = 'Copy ffmpeg command to clipboard';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleDownloadClick(button, entryId);
    });

    container.style.position = 'relative';
    container.appendChild(button);
  }

  async handleDownloadClick(button, entryId) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;

    const videoUrl = await this.getVideoUrl(entryId);

    if (!videoUrl) {
      button.textContent = 'Play video first';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
      return;
    }

    const videoName = this.generateVideoName(videoUrl);
    const ffmpegCommand = `ffmpeg -i '${videoUrl}' -c copy ~/Downloads/${videoName}`;

    try {
      await navigator.clipboard.writeText(ffmpegCommand);
      button.textContent = 'Copied!';
      console.log('[Kaltura Downloader] Command copied to clipboard');

      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('[Kaltura Downloader] Failed to copy to clipboard:', error);
      button.textContent = 'Copy failed';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  normalizeTitle(title) {
    // Remove " | Moodle ZHAW" or similar suffixes
    let normalized = title.split('|')[0].trim();

    // Replace colons with hyphens
    normalized = normalized.replace(/:/g, '-');

    // Remove invalid filename characters: / \ * ? " < > |
    normalized = normalized.replace(/[\/\\*?"<>|]/g, '');

    // Replace spaces and multiple hyphens with single underscore
    normalized = normalized.replace(/[\s-]+/g, '_');

    // Remove leading/trailing underscores
    normalized = normalized.replace(/^_+|_+$/g, '');

    // Convert to lowercase
    normalized = normalized.toLowerCase();

    // Limit length (leave room for hash and .mp4 extension)
    if (normalized.length > 80) {
      normalized = normalized.substring(0, 80);
    }

    // If somehow we end up with empty string, use fallback
    if (!normalized) {
      normalized = 'video';
    }

    return normalized;
  }

  simpleHash(str) {
    // Simple hash function to generate a short unique identifier
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to base36 and take first 8 characters
    return Math.abs(hash).toString(36).substring(0, 8).padStart(8, '0');
  }

  generateVideoName(videoUrl) {
    const pageTitle = document.title;
    const normalizedTitle = this.normalizeTitle(pageTitle);
    const date = new Date().toISOString().split('T')[0];
    const urlHash = this.simpleHash(videoUrl);
    return `${normalizedTitle}_${date}_${urlHash}.mp4`;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new KalturaDownloader();
  });
} else {
  new KalturaDownloader();
}
