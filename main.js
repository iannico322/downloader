// Global function for inline onclick handlers
function switchTab(platform) {
    console.log('Switching to platform:', platform);
    
    // Remove active class from all tabs and sections
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.platform-section');
    
    tabBtns.forEach(tab => tab.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    // Add active class to clicked tab
    const activeTab = document.querySelector(`[data-platform="${platform}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Show corresponding section
    const targetSection = document.getElementById(`${platform}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Activated section:', platform);
    } else {
        console.error('Section not found:', `${platform}Section`);
    }
}

class TikTokDownloader {
    constructor() {
        this.currentVideoData = null;
        this.generatedCaption = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.initPlatformTabs();
    }

    initPlatformTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const sections = document.querySelectorAll('.platform-section');

        console.log('Found tabs:', tabBtns.length);
        console.log('Found sections:', sections.length);

        // Add multiple event listeners for better compatibility
        tabBtns.forEach((btn, index) => {
            // Remove any existing listeners first
            btn.removeEventListener('click', this.handleTabClick);
            
            // Add click listener
            btn.addEventListener('click', (e) => this.handleTabClick(e, btn));
            
            // Add mousedown as backup
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleTabClick(e, btn);
            });
            
            // Add touchstart for mobile
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleTabClick(e, btn);
            });
        });
    }

    handleTabClick(e, btn) {
        e.preventDefault();
        e.stopPropagation();
        
        const platform = btn.dataset.platform;
        console.log('Tab clicked:', platform);
        
        // Use the global switchTab function
        switchTab(platform);
    }

    bindEvents() {
        const downloadBtn = document.getElementById('downloadBtn');
        const tiktokUrl = document.getElementById('tiktokUrl');
        const youtubeUrl = document.getElementById('youtubeUrl');
        const downloadWithoutWatermark = document.getElementById('downloadWithoutWatermark');
        const downloadWithWatermark = document.getElementById('downloadWithWatermark');
        const downloadYoutubeMp4 = document.getElementById('downloadYoutubeMp4');
        const downloadYoutubeMp3 = document.getElementById('downloadYoutubeMp3');

        // TikTok events - check if elements exist
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.handleDownload());
        }
        
        if (tiktokUrl) {
            tiktokUrl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleDownload();
                }
            });
        }

        // YouTube events - check if elements exist
        if (youtubeUrl) {
            youtubeUrl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleYouTubeDownload('mp4');
                }
            });
        }

        if (downloadYoutubeMp4) {
            downloadYoutubeMp4.addEventListener('click', () => this.handleYouTubeDownload('mp4'));
        }
        
        if (downloadYoutubeMp3) {
            downloadYoutubeMp3.addEventListener('click', () => this.handleYouTubeDownload('mp3'));
        }

        if (downloadWithoutWatermark) {
            downloadWithoutWatermark.addEventListener('click', () => this.downloadVideo('nowm'));
        }
        
        if (downloadWithWatermark) {
            downloadWithWatermark.addEventListener('click', () => this.downloadVideo('wm'));
        }
    }

    generateCaption(videoData) {
        const title = videoData.title || '';
        const author = videoData.author?.nickname || videoData.author?.unique_id || 'Unknown';
        
        // Create the custom format you requested
        let caption = '';
        
        if (title) {
            // Clean and enhance the title - make it uppercase
            const cleanTitle = title.replace(/[#@]/g, '').trim().toUpperCase();
            caption = cleanTitle || 'THE GORGE';
        } else {
            caption = 'THE GORGE';
        }
        
        // Add your specific hashtag format with proper spacing
        caption += '\n\n';
        caption += `
        
#cinesnaps #movierecaps #filmclips #CinemaMagic
#FlickFix #MovieMoments #scenesnaps #ReelItUp
#MustWatchScenes #shortrecaps #MovieVibes
#FilmGeek #movieaddict #BingeWorthy #ClipCulture
#movieclips #cineedits #CineLovers #plotinminutes
`;

        return caption;
    }

    copyCaption() {
        if (this.generatedCaption) {
            navigator.clipboard.writeText(this.generatedCaption).then(() => {
                this.showError('✅ Caption copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy caption: ', err);
                this.showError('Failed to copy caption');
            });
        }
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    showProgressBar(show) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.display = show ? 'block' : 'none';
        }
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
    }

    async handleDownload() {
        const urlInput = document.getElementById('tiktokUrl');
        let url = urlInput.value.trim();

        if (!this.isValidTikTokUrl(url)) {
            this.showError('Please enter a valid TikTok URL');
            return;
        }

        // If it's a mobile/shortened URL, try to resolve it first
        if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
            this.showError('🔄 Resolving mobile link...');
            try {
                url = await this.resolveMobileUrl(url);
            } catch (error) {
                console.log('Could not resolve mobile URL, trying original:', error);
                // Continue with original URL if resolution fails
            }
        }

        this.showAnalyzing(true);
        this.hideError();
        this.hideVideoInfo();

        try {
            const videoData = await this.fetchVideoData(url);
            this.displayVideoInfo(videoData);
        } catch (error) {
            this.showError('Failed to fetch video data. Please try again.');
            console.error('Error:', error);
        } finally {
            this.showAnalyzing(false);
        }
    }

    async resolveMobileUrl(mobileUrl) {
        try {
            // Try to follow redirects to get the full URL
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mobileUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const data = await response.json();
                // Look for canonical URL in the HTML
                const canonicalMatch = data.contents.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
                if (canonicalMatch && canonicalMatch[1]) {
                    return canonicalMatch[1];
                }
                
                // Look for og:url meta tag
                const ogUrlMatch = data.contents.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
                if (ogUrlMatch && ogUrlMatch[1]) {
                    return ogUrlMatch[1];
                }
            }
            
            return mobileUrl; // Return original if resolution fails
        } catch (error) {
            console.log('URL resolution failed:', error);
            return mobileUrl; // Return original if resolution fails
        }
    }

    showAnalyzing(show) {
        const analyzingOverlay = document.getElementById('analyzingOverlay');
        if (analyzingOverlay) {
            analyzingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    isValidTikTokUrl(url) {
        // Updated regex to handle all TikTok URL formats including mobile
        const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com)/;
        return tiktokRegex.test(url);
    }

    async fetchVideoData(url) {
        // Using a free TikTok API service
        const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        
        try {
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.video) {
                throw new Error('No video data found');
            }
            
            return data;
        } catch (error) {
            // Fallback to alternative API
            return await this.fetchVideoDataFallback(url);
        }
    }

    async fetchVideoDataFallback(url) {
        // Alternative API endpoint
        const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 0) {
            throw new Error(data.msg || 'Failed to fetch video data');
        }
        
        // Transform data to match expected format
        return {
            video: {
                noWatermark: data.data.play,
                watermark: data.data.wmplay,
                cover: data.data.cover
            },
            author: {
                nickname: data.data.author.nickname,
                unique_id: data.data.author.unique_id
            },
            title: data.data.title,
            stats: data.data.stats
        };
    }

    displayVideoInfo(data) {
        const videoInfo = document.getElementById('videoInfo');
        const previewVideo = document.getElementById('previewVideo');
        const videoTitle = document.getElementById('videoTitle');
        const videoAuthor = document.getElementById('videoAuthor');

        // Set video preview
        if (data.video.noWatermark || data.video.watermark) {
            previewVideo.src = data.video.noWatermark || data.video.watermark;
            previewVideo.poster = data.video.cover;
        }

        // Set video details
        videoTitle.textContent = data.title || 'TikTok Video';
        videoAuthor.textContent = `@${data.author?.unique_id || data.author?.nickname || 'Unknown'}`;

        // Generate caption with hashtags
        this.generatedCaption = this.generateCaption(data);

        // Store video URLs for download
        this.currentVideoData = data;

        videoInfo.style.display = 'block';
        
        // Add caption display to the video info section
        this.displayCaption();
        
        videoInfo.scrollIntoView({ behavior: 'smooth' });
    }

    displayCaption() {
        // Remove existing caption if any
        const existingCaption = document.getElementById('captionSection');
        if (existingCaption) {
            existingCaption.remove();
        }

        // Create caption section
        const videoInfo = document.getElementById('videoInfo');
        const captionSection = document.createElement('div');
        captionSection.id = 'captionSection';
        captionSection.className = 'caption-section';
        captionSection.innerHTML = `
            <div class="caption-header">
                <h3><i class="fas fa-edit"></i> Generated Caption</h3>
                <div class="caption-controls">
                    <button id="boldBtn" class="format-btn" title="Bold">
                        <i class="fas fa-bold"></i>
                    </button>
                    <button id="italicBtn" class="format-btn" title="Italic">
                        <i class="fas fa-italic"></i>
                    </button>
                    <select id="fontFamily" class="font-control">
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                    </select>
                    <input type="range" id="fontSize" min="12" max="24" value="14" class="font-control">
                    <span id="fontSizeValue" class="font-size-value">14px</span>
                    <button id="copyCaptionBtn" class="copy-btn">
                        <i class="fas fa-copy"></i> Copy Caption
                    </button>
                </div>
            </div>
            <div class="caption-content">
                <div id="captionText" contenteditable="true" class="caption-editor">${this.generatedCaption.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        // Insert after video container
        const videoContainer = videoInfo.querySelector('.video-container');
        videoContainer.appendChild(captionSection);

        // Add functionality
        this.bindCaptionControls();
    }

    bindCaptionControls() {
        const captionText = document.getElementById('captionText');
        const fontFamily = document.getElementById('fontFamily');
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const copyBtn = document.getElementById('copyCaptionBtn');
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');

        // Bold formatting for selected text
        boldBtn.addEventListener('click', () => {
            this.applyFormatToSelection('bold');
        });

        // Italic formatting for selected text
        italicBtn.addEventListener('click', () => {
            this.applyFormatToSelection('italic');
        });

        // Font family change for selected text
        fontFamily.addEventListener('change', (e) => {
            this.applyStyleToSelection('fontFamily', e.target.value);
        });

        // Font size change for selected text
        fontSize.addEventListener('input', (e) => {
            const size = e.target.value;
            fontSizeValue.textContent = size + 'px';
            this.applyStyleToSelection('fontSize', size + 'px');
        });

        // Copy functionality - get plain text content
        copyBtn.addEventListener('click', () => {
            this.copyFormattedCaption();
        });

        // Update format buttons based on selection
        captionText.addEventListener('mouseup', () => {
            this.updateFormatButtons();
        });

        captionText.addEventListener('keyup', () => {
            this.updateFormatButtons();
        });
    }

    applyFormatToSelection(command) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            document.execCommand(command, false, null);
        }
    }

    applyStyleToSelection(property, value) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            
            // Apply the style
            span.style[property] = value;
            
            try {
                // Wrap the selected content
                range.surroundContents(span);
                selection.removeAllRanges();
            } catch (e) {
                // If surroundContents fails, extract and wrap content manually
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
                selection.removeAllRanges();
            }
        }
    }

    updateFormatButtons() {
        const selection = window.getSelection();
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const parentElement = range.commonAncestorContainer.nodeType === 1 
                ? range.commonAncestorContainer 
                : range.commonAncestorContainer.parentElement;

            // Check if selection contains bold text
            const isBold = document.queryCommandState('bold') || 
                          parentElement.closest('b, strong') || 
                          window.getComputedStyle(parentElement).fontWeight === 'bold' ||
                          window.getComputedStyle(parentElement).fontWeight >= '700';

            // Check if selection contains italic text
            const isItalic = document.queryCommandState('italic') || 
                            parentElement.closest('i, em') || 
                            window.getComputedStyle(parentElement).fontStyle === 'italic';

            // Update button states
            boldBtn.classList.toggle('active', isBold);
            italicBtn.classList.toggle('active', isItalic);
        }
    }

    copyFormattedCaption() {
        const captionElement = document.getElementById('captionText');
        
        // Get the plain text content, converting <br> tags back to newlines
        let textContent = captionElement.innerHTML
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '') // Remove all HTML tags for plain text copy
            .replace(/&nbsp;/g, ' ')
            .trim();

        if (textContent) {
            navigator.clipboard.writeText(textContent).then(() => {
                this.showError('✅ Caption copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy caption: ', err);
                this.showError('Failed to copy caption');
            });
        }
    }

    async downloadVideo(type) {
        if (!this.currentVideoData) {
            this.showError('No video data available');
            return;
        }

        // Always download the no-watermark version
        const videoUrl = this.currentVideoData.video.noWatermark;

        if (!videoUrl) {
            this.showError('No watermark-free version available');
            return;
        }

        try {
            this.showLoading(true);
            
            // Auto-copy caption when downloading
            if (this.generatedCaption) {
                try {
                    await navigator.clipboard.writeText(this.generatedCaption);
                    this.showError('📋 Caption copied to clipboard!');
                    
                    // Wait a moment before showing download message
                    setTimeout(() => {
                        this.showError('📥 Starting video download...');
                    }, 1000);
                } catch (clipboardError) {
                    console.log('Clipboard copy failed, but continuing with download');
                }
            }
            
            // Try to download directly without opening new tab
            try {
                const response = await fetch(videoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `DownloadeX_TikTok_${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.URL.revokeObjectURL(url);
                this.showError('✅ Clean video downloaded + Caption copied!');
            } catch (corsError) {
                // If direct download fails, try alternative method
                console.log('Direct download blocked by CORS, trying alternative...');
                
                // Create download instructions instead of opening new tab
                this.showDownloadInstructions(videoUrl);
            }
            
        } catch (error) {
            this.showError('Failed to prepare download. Please try the instructions below.');
            this.showDownloadInstructions(videoUrl);
            console.error('Download error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    showDownloadInstructions(videoUrl) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.innerHTML = `
                <div style="text-align: center; max-width: 100%;">
                    <p><strong>📥 Download Instructions:</strong></p>
                    <div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #cccccc;">
                        <p><strong>Method 1 - Direct Link:</strong></p>
                        <button onclick="window.open('${videoUrl}', '_blank')" 
                                style="padding: 12px 20px; background: #000000; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin: 5px;">
                            🎯 Open Video Link
                        </button>
                        <p style="font-size: 12px; color: #666666; margin-top: 5px;">Right-click on video and select "Save video as..."</p>
                    </div>
                    
                    <div style="background: #f0f0f0; padding: 12px; border-radius: 5px; font-size: 13px; border-left: 4px solid #000000; margin-top: 10px;">
                        <strong>💡 Note:</strong> Caption has been automatically copied to your clipboard!
                    </div>
                </div>
            `;
            errorDiv.classList.add('show');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loadingSpinner');
        if (loadingDiv) {
            loadingDiv.style.display = show ? 'block' : 'none';
        }
    }

    // YouTube download functionality with direct download
    async handleYouTubeDownload(format) {
        const youtubeUrl = document.getElementById('youtubeUrl').value.trim();
        
        if (!youtubeUrl) {
            this.showError('Please enter a YouTube URL');
            return;
        }

        if (!this.isValidYouTubeUrl(youtubeUrl)) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            const videoId = this.extractYouTubeId(youtubeUrl);
            
            // Try direct download methods
            await this.downloadYouTubeDirect(videoId, youtubeUrl, format);

        } catch (error) {
            console.error('YouTube download error:', error);
            this.showError(`Failed to download YouTube ${format.toUpperCase()}: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async downloadYouTubeDirect(videoId, youtubeUrl, format) {
        try {
            this.showError(`🔍 Preparing ${format.toUpperCase()} download...`);
            
            // Since direct APIs have CORS issues, use a more reliable approach
            // Generate downloadable link and provide user-friendly options
            await this.generateWorkingDownload(videoId, youtubeUrl, format);

        } catch (error) {
            console.log('Download preparation failed:', error);
            await this.generateWorkingDownload(videoId, youtubeUrl, format);
        }
    }

    async generateWorkingDownload(videoId, youtubeUrl, format) {
        try {
            // Create multiple working download options
            this.showWorkingDownloadOptions(videoId, youtubeUrl, format);
            
        } catch (error) {
            this.showError('❌ Failed to prepare download. Please check the URL and try again.');
        }
    }

    showWorkingDownloadOptions(videoId, youtubeUrl, format) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            const quickUrl = youtubeUrl.replace('youtube.com', 'ssyoutube.com').replace('youtu.be', 'ssyoutu.be');
            
            errorDiv.innerHTML = `
                <div style="text-align: left; max-width: 100%;">
                    <p><strong>📥 ${format.toUpperCase()} Download Ready!</strong></p>
                    
                    <div style="background: #000000; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p><strong>🚀 INSTANT DOWNLOAD (Recommended):</strong></p>
                        <button onclick="window.open('${quickUrl}', '_blank'); navigator.clipboard.writeText('${quickUrl}')" 
                                style="padding: 15px 25px; background: #fff; color: #000000; border: 2px solid #000000; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; width: 100%; margin: 5px 0;">
                            ⚡ SS-YouTube (Click for Instant ${format.toUpperCase()} Download)
                        </button>
                        <small style="opacity: 0.9;">Opens direct download page - no ads, no waiting!</small>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #dee2e6;">
                        <p><strong>📋 Quick Copy Method:</strong></p>
                        <div style="background: #333; color: #fff; padding: 12px; border-radius: 4px; font-family: monospace; margin: 8px 0; font-size: 14px; word-break: break-all;">
                            ${quickUrl}
                        </div>
                        <button onclick="navigator.clipboard.writeText('${quickUrl}'); this.textContent='✅ Copied!'; setTimeout(() => this.textContent='📋 Copy Quick Download Link', 2000)" 
                                style="padding: 10px 20px; background: #000000; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px;">
                            📋 Copy Quick Download Link
                        </button>
                        <small style="color: #6c757d;">Paste this URL in any browser tab for instant download</small>
                    </div>

                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ffeaa7;">
                        <p><strong>🔄 Alternative Options:</strong></p>
                        <div style="display: grid; gap: 8px;">
                            <button onclick="window.open('https://yt1s.com/en/youtube-to-${format}?q=${youtubeUrl}', '_blank')" 
                                    style="padding: 10px; background: #333333; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                🎯 YT1S (${format.toUpperCase()} Converter)
                            </button>
                            <button onclick="window.open('https://y2mate.com/youtube/${videoId}', '_blank')" 
                                    style="padding: 10px; background: #666666; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                💎 Y2Mate (High Quality)
                            </button>
                        </div>
                    </div>

                    <div style="margin-top: 15px; padding: 12px; background: #f0f0f0; border-radius: 5px; font-size: 13px; border-left: 4px solid #000000;">
                        <strong>💡 Pro Tip:</strong> The SS-YouTube method is fastest - just click the green button above for instant access to ${format.toUpperCase()} download!
                    </div>
                </div>
            `;
            errorDiv.classList.add('show');
        }
    }

    isValidYouTubeUrl(url) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
        return youtubeRegex.test(url);
    }

    extractYouTubeId(url) {
        // Handle various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // If no pattern matches, try to extract from any URL parameter 'v='
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const videoId = urlParams.get('v');
        if (videoId && videoId.length === 11) {
            return videoId;
        }

        return null;
    }

    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    hideVideoInfo() {
        const videoInfo = document.getElementById('videoInfo');
        if (videoInfo) {
            videoInfo.style.display = 'none';
        }
    }
}

// Initialize the TikTok downloader when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TikTokDownloader();
});

// Add some utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('URL copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy URL: ', err);
    });
}

// Auto-paste and download feature
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'v') {
        const urlInput = document.getElementById('tiktokUrl');
        if (document.activeElement === urlInput) {
            setTimeout(() => {
                if (urlInput.value.trim()) {
                    document.getElementById('downloadBtn').click();
                }
            }, 100);
        }
    }
});