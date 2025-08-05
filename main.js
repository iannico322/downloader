class TikTokDownloader {
    constructor() {
        this.currentVideoData = null;
        this.generatedCaption = '';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const downloadBtn = document.getElementById('downloadBtn');
        const tiktokUrl = document.getElementById('tiktokUrl');
        const downloadWithoutWatermark = document.getElementById('downloadWithoutWatermark');
        const downloadWithWatermark = document.getElementById('downloadWithWatermark');

        downloadBtn.addEventListener('click', () => this.handleDownload());
        tiktokUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleDownload();
            }
        });

        downloadWithoutWatermark.addEventListener('click', () => this.downloadVideo('nowm'));
        downloadWithWatermark.addEventListener('click', () => this.downloadVideo('wm'));
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
        const url = urlInput.value.trim();

        if (!this.isValidTikTokUrl(url)) {
            this.showError('Please enter a valid TikTok URL');
            return;
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

    showAnalyzing(show) {
        const analyzingOverlay = document.getElementById('analyzingOverlay');
        if (analyzingOverlay) {
            analyzingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    isValidTikTokUrl(url) {
        const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)/;
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
            
            // For CORS issues, we'll open in new tab
            window.open(videoUrl, '_blank');
            
            // Try to download directly
            try {
                const response = await fetch(videoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `cinesnaps_video_${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.URL.revokeObjectURL(url);
                this.showError('✅ Clean video downloaded successfully!');
            } catch (corsError) {
                console.log('Direct download blocked by CORS, opened in new tab');
                this.showError('Video opened in new tab. Right-click and save to download.');
            }
            
        } catch (error) {
            this.showError('Failed to download video. Please try the link that opened in a new tab.');
            console.error('Download error:', error);
        } finally {
            this.showLoading(false);
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

// Add keyboard shortcuts
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