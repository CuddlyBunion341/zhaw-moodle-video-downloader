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
    button.textContent = '↓ copy';
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
    button.textContent = '...';
    button.disabled = true;

    const videoUrl = await this.getVideoUrl(entryId);

    if (!videoUrl) {
      button.textContent = 'ERR: play video first';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
      return;
    }

    const videoName = this.generateVideoName(entryId);
    const ffmpegCommand = `ffmpeg -i '${videoUrl}' -c copy ~/Downloads/${videoName}`;

    try {
      await navigator.clipboard.writeText(ffmpegCommand);
      button.textContent = 'OK';
      console.log('[Kaltura Downloader] Command copied to clipboard');

      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('[Kaltura Downloader] Failed to copy to clipboard:', error);
      button.textContent = 'ERR: copy failed';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  generateVideoName(entryId) {
    const date = new Date().toISOString().split('T')[0];
    return `kaltura_${entryId}_${date}.mp4`;
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
