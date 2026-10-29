/* ==========================================================================
   STAGED ASSET PRELOADER & CACHE MANAGER — NECRONOMICON EX-MORTIS
   Manages progressive loading, decode verification, bounded memory caches,
   and accurate progress reporting across all ritual stages.
   ========================================================================== */

export class AssetLoader {
  constructor() {
    this.imageCache = new Map();
    this.inFlightLoads = new Map();
    this.failedAssets = new Set();
    this.loadedAssets = new Set();
    
    // Ritual frame caches with sliding-window bounds
    this.rebindFrameCache = new Map();
    this.sealingFrameCache = new Map();
    
    this.stageAComplete = false;
    this.currentStage = 'A';
    this.initialScreenLoaded = false;
  }

  /* ------------------------------------------------------------------------
     1. CORE IMAGE LOADER & GPU DECODE VERIFIER
     ------------------------------------------------------------------------ */
  loadImage(url, priority = false) {
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url));
    }
    if (this.inFlightLoads.has(url)) {
      return this.inFlightLoads.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      if (priority) {
        img.fetchPriority = 'high';
      }

      img.onload = () => {
        this.imageCache.set(url, img);
        this.loadedAssets.add(url);
        this.failedAssets.delete(url);
        this.inFlightLoads.delete(url);

        // Warm GPU texture asynchronously if supported
        if (typeof img.decode === 'function') {
          img.decode()
            .then(() => resolve(img))
            .catch(() => resolve(img)); // Fallback if decode errors on edge case
        } else {
          resolve(img);
        }
      };

      img.onerror = (err) => {
        this.inFlightLoads.delete(url);
        this.failedAssets.add(url);
        console.error(`AssetLoader: Failed to load image: ${url}`, err);
        reject(new Error(`Failed to load: ${url}`));
      };

      img.src = url;
    });

    this.inFlightLoads.set(url, promise);
    return promise;
  }

  /* ------------------------------------------------------------------------
     2. STAGE A: INITIAL EXPERIENCE & DORMANT ASSETS
     ------------------------------------------------------------------------ */
  async loadStageA(onProgress, onError) {
    if (this.stageAComplete) return true;

    const essentialImages = [
      'assets/background_dormant.png',
      'assets/main ui/dormant state/dormant state_Necronomicon.png',
      'assets/main%20ui/awakning%20ritual/0%25.png',
      'assets/main ui/talking ui/ref ui.png',
      'assets/main ui/talking ui/entity.jpg'
    ];

    let completed = 0;
    const total = essentialImages.length + 1; // +1 for fonts

    // Step 1: Wait for essential web fonts
    if (onProgress) onProgress(5, 'Summoning ancient typography…');
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font loading non-fatal issue:', e);
      }
    }
    completed++;
    if (onProgress) onProgress(Math.round((completed / total) * 100), 'Deciphering ancient scriptures…');

    // Step 2: Concurrently fetch and decode essential images
    const failures = [];
    const imagePromises = essentialImages.map(async (url, idx) => {
      try {
        await this.loadImage(url, true);
        completed++;
        const pct = Math.min(99, Math.round((completed / total) * 100));
        const labels = [
          'Preparing the altar…',
          'Unsealing dormant pages…',
          'Aligning ritual circles…',
          'Igniting spectral embers…',
          'Awakening the archives…'
        ];
        if (onProgress) onProgress(pct, labels[idx] || 'Manifesting arcane seals…');
      } catch (err) {
        failures.push(url);
      }
    });

    await Promise.all(imagePromises);

    if (failures.length > 0) {
      if (onError) {
        onError(`Failed to manifest essential asset: ${failures[0].split('/').pop()}`, failures);
      }
      return false;
    }

    this.stageAComplete = true;
    if (onProgress) onProgress(100, 'The gateway is ready.');
    return true;
  }

  /* ------------------------------------------------------------------------
     3. STAGE B: AWAKENING RITUAL PRELOAD
     ------------------------------------------------------------------------ */
  async loadStageBAwakening() {
    this.currentStage = 'B';
    const awakeningAssets = [
      'assets/main%20ui/awakning%20ritual/25%25.png',
      'assets/main%20ui/awakning%20ritual/50%25.png',
      'assets/main%20ui/awakning%20ritual/75%25.png',
      'assets/main%20ui/awakning%20ritual/100%25.png'
    ];

    // Progressive loading with concurrency limit 2
    for (const url of awakeningAssets) {
      try {
        await this.loadImage(url, false);
      } catch (e) {
        console.warn(`Non-fatal Awakening asset prefetch warning: ${url}`, e);
      }
    }

    // Preload first frames of rituals in background
    this.loadRebindFrame(1).catch(() => {});
    this.loadSealingFrame(1).catch(() => {});
  }

  /* ------------------------------------------------------------------------
     4. STAGE C & D: REBINDING AND SEALING FRAME LOADERS
     ------------------------------------------------------------------------ */
  getRebindFrameUrl(num) {
    return `rebinding_ritual_20261025_002707/rebinding_ritual_${String(num).padStart(6, '0')}.png`;
  }

  getSealingFrameUrl(num) {
    return `sealing_ritual_20261025_003823/sealing_ritual_${String(num).padStart(6, '0')}.png`;
  }

  async loadRebindFrame(num) {
    if (this.rebindFrameCache.has(num)) {
      return this.rebindFrameCache.get(num);
    }
    const url = this.getRebindFrameUrl(num);
    try {
      const img = await this.loadImage(url, num === 1);
      if (typeof window !== 'undefined' && window.state && window.state.screen !== 'rebind' && num !== 1) {
        return null;
      }
      this.rebindFrameCache.set(num, img);
      return img;
    } catch (err) {
      console.error(`AssetLoader: rebind frame ${num} missing: ${url}`);
      return null;
    }
  }

  async loadSealingFrame(num) {
    if (this.sealingFrameCache.has(num)) {
      return this.sealingFrameCache.get(num);
    }
    const url = this.getSealingFrameUrl(num);
    try {
      const img = await this.loadImage(url, num === 1);
      if (typeof window !== 'undefined' && window.state && window.state.screen !== 'sealing' && num !== 1) {
        return null;
      }
      this.sealingFrameCache.set(num, img);
      return img;
    } catch (err) {
      console.error(`AssetLoader: sealing frame ${num} missing: ${url}`);
      return null;
    }
  }

  /* Preload a sequential frame range with controlled concurrency */
  async preloadFrameRange(type, start, end, onProgress = null) {
    const isRebind = type === 'rebind';
    const cache = isRebind ? this.rebindFrameCache : this.sealingFrameCache;
    const loadFn = isRebind ? this.loadRebindFrame.bind(this) : this.loadSealingFrame.bind(this);

    const queue = [];
    for (let i = start; i <= end; i++) {
      if (!cache.has(i)) {
        queue.push(i);
      }
    }

    if (queue.length === 0) {
      if (onProgress) onProgress(end, end);
      return;
    }

    const concurrency = 3;
    let index = 0;
    let loadedCount = (end - start + 1) - queue.length;

    const workers = Array(Math.min(concurrency, queue.length)).fill(0).map(async () => {
      while (index < queue.length) {
        if (typeof window !== 'undefined' && window.state && window.state.screen !== type) {
          break;
        }
        const frameNum = queue[index++];
        await loadFn(frameNum);
        loadedCount++;
        if (onProgress) onProgress(loadedCount, end - start + 1);
      }
    });

    await Promise.all(workers);
  }

  /* Prune memory behind playback head */
  prunePastFrames(type, start, current, keepMargin = 6) {
    const cache = type === 'rebind' ? this.rebindFrameCache : this.sealingFrameCache;
    if (current > start + keepMargin) {
      for (let f = start; f < current - keepMargin; f++) {
        cache.delete(f);
      }
    }
  }

  clearRitualCache(type) {
    if (type === 'rebind') {
      this.rebindFrameCache.clear();
    } else if (type === 'sealing') {
      this.sealingFrameCache.clear();
    }
  }
}

export const assetLoader = new AssetLoader();
if (typeof window !== 'undefined') {
  window.assetLoader = assetLoader;
}
