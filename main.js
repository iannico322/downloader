// Global function for inline onclick handlers
function switchTab(platform) {
    console.log('Switching to platform:', platform);
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.platform-section');
    
    tabBtns.forEach(tab => tab.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    const activeTab = document.querySelector(`[data-platform="${platform}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    const targetSection = document.getElementById(`${platform}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Activated section:', platform);
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
        
        tabBtns.forEach((btn) => {
            btn.removeEventListener('click', this.handleTabClick);
            btn.addEventListener('click', (e) => this.handleTabClick(e, btn));
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
        switchTab(platform);
    }

    bindEvents() {
        const downloadBtn = document.getElementById('downloadBtn');
        const tiktokUrl = document.getElementById('tiktokUrl');
        const youtubeUrl = document.getElementById('youtubeUrl');
        const downloadWithoutWatermark = document.getElementById('downloadWithoutWatermark');
        const downloadTiktokMp3 = document.getElementById('downloadTiktokMp3');
        const downloadYoutubeMp4 = document.getElementById('downloadYoutubeMp4');
        const downloadYoutubeMp3 = document.getElementById('downloadYoutubeMp3');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.handleDownload());
        }
        
        if (tiktokUrl) {
            tiktokUrl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleDownload();
            });
        }

        if (youtubeUrl) {
            youtubeUrl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleYouTubeDownload('mp4');
            });
        }

        if (downloadYoutubeMp4) {
            downloadYoutubeMp4.addEventListener('click', () => this.handleYouTubeDownload('mp4'));
        }
        
        if (downloadYoutubeMp3) {
            downloadYoutubeMp3.addEventListener('click', () => this.handleYouTubeDownload('mp3'));
        }

        if (downloadWithoutWatermark) {
            downloadWithoutWatermark.addEventListener('click', () => this.downloadVideo('mp4'));
        }
        
        if (downloadTiktokMp3) {
            downloadTiktokMp3.addEventListener('click', () => this.downloadVideo('mp3'));
        }
    }

    generateCaption(videoData) {
        const title = videoData.title || '';
        
        let caption = '';
        
        if (title) {
            const cleanTitle = title.replace(/[#@]/g, '').trim().toUpperCase();
            caption = cleanTitle || 'THE GORGE';
        } else {
            caption = 'THE GORGE';
        }
        
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

    async handleDownload() {
        const urlInput = document.getElementById('tiktokUrl');
        let url = urlInput.value.trim();

        if (!this.isValidTikTokUrl(url)) {
            this.showError('Please enter a valid TikTok URL');
            return;
        }

        this.showAnalyzing(true);
        this.hideError();
        this.hideVideoInfo();

        // Handle mobile URLs
        if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
            this.showError('🔄 Resolving mobile link...');
            try {
                url = await this.resolveMobileUrl(url);
                console.log('Resolved URL:', url);
            } catch (error) {
                console.log('Using original URL:', error);
            }
        }

        try {
            const videoData = await this.fetchVideoData(url);
            console.log('Video data received:', videoData);
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
            // Use a different CORS proxy
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(mobileUrl)}`;
            const response = await fetch(proxyUrl, {
                redirect: 'follow'
            });
            
            if (response.ok) {
                const html = await response.text();
                
                // Look for canonical URL
                const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
                if (canonicalMatch && canonicalMatch[1]) {
                    return canonicalMatch[1];
                }
                
                // Look for og:url
                const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
                if (ogUrlMatch && ogUrlMatch[1]) {
                    return ogUrlMatch[1];
                }
                
                // Look for video ID
                const videoIdMatch = html.match(/video\/(\d+)/);
                if (videoIdMatch && videoIdMatch[1]) {
                    return `https://www.tiktok.com/@unknown/video/${videoIdMatch[1]}`;
                }
            }
            
            return mobileUrl;
        } catch (error) {
            console.log('URL resolution failed:', error);
            return mobileUrl;
        }
    }

    showAnalyzing(show) {
        const analyzingOverlay = document.getElementById('analyzingOverlay');
        if (analyzingOverlay) {
            analyzingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    isValidTikTokUrl(url) {
        const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|m\.tiktok\.com)/;
        return tiktokRegex.test(url);
    }

    async fetchVideoData(url) {
        // Try TikWM API first (most reliable)
        try {
            console.log('Trying TikWM API...');
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('TikWM response:', data);
            
            if (data.code === 0 && data.data) {
                return {
                    video: {
                        noWatermark: data.data.hdplay || data.data.play,
                        watermark: data.data.wmplay,
                        cover: data.data.cover
                    },
                    music: {
                        play_url: data.data.music,
                        title: data.data.music_info?.title || 'TikTok Audio'
                    },
                    author: {
                        nickname: data.data.author?.nickname || 'Unknown',
                        unique_id: data.data.author?.unique_id || 'unknown'
                    },
                    title: data.data.title || 'TikTok Video',
                    stats: data.data.stats
                };
            }
            
            throw new Error('Invalid response from TikWM');
        } catch (error) {
            console.error('TikWM failed:', error);
            
            // Fallback to TiklyDown
            try {
                console.log('Trying TiklyDown API...');
                const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('TiklyDown response:', data);
                
                if (data.video) {
                    return data;
                }
                
                throw new Error('Invalid response from TiklyDown');
            } catch (fallbackError) {
                console.error('All APIs failed:', fallbackError);
                throw new Error('Could not fetch video data. Please try a different URL.');
            }
        }
    }

    displayVideoInfo(data) {
        const videoInfo = document.getElementById('videoInfo');
        const previewVideo = document.getElementById('previewVideo');
        const videoTitle = document.getElementById('videoTitle');
        const videoAuthor = document.getElementById('videoAuthor');

        if (data.video.noWatermark || data.video.watermark) {
            previewVideo.src = data.video.noWatermark || data.video.watermark;
            previewVideo.poster = data.video.cover;
        }

        videoTitle.textContent = data.title || 'TikTok Video';
        videoAuthor.textContent = `@${data.author?.unique_id || data.author?.nickname || 'Unknown'}`;

        this.generatedCaption = this.generateCaption(data);
        this.currentVideoData = data;

        console.log('Stored video data:', this.currentVideoData);

        videoInfo.style.display = 'block';
        this.displayCaption();
        videoInfo.scrollIntoView({ behavior: 'smooth' });
    }

    displayCaption() {
        const existingCaption = document.getElementById('captionSection');
        if (existingCaption) existingCaption.remove();

        const videoInfo = document.getElementById('videoInfo');
        const captionSection = document.createElement('div');
        captionSection.id = 'captionSection';
        captionSection.className = 'caption-section';
        captionSection.innerHTML = `
            <div class="caption-header">
                <h3><i class="fas fa-edit"></i> Generated Caption</h3>
                <button id="copyCaptionBtn" class="copy-btn">
                    <i class="fas fa-copy"></i> Copy Caption
                </button>
            </div>
            <div class="caption-content">
                <div id="captionText" class="caption-editor">${this.generatedCaption.replace(/\n/g, '<br>')}</div>
            </div>
        `;

        const videoContainer = videoInfo.querySelector('.video-container');
        videoContainer.appendChild(captionSection);

        document.getElementById('copyCaptionBtn').addEventListener('click', () => {
            const captionElement = document.getElementById('captionText');
            let textContent = captionElement.innerHTML
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();

            navigator.clipboard.writeText(textContent).then(() => {
                this.showError('✅ Caption copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showError('Failed to copy caption');
            });
        });
    }

    async downloadVideo(type) {
        if (!this.currentVideoData) {
            this.showError('No video data available');
            return;
        }

        console.log('Download type:', type);
        console.log('Current video data:', this.currentVideoData);

        const author = this.currentVideoData.author?.unique_id || 'tiktok';
        const timestamp = Date.now();
        
        // Copy caption to clipboard first
        if (this.generatedCaption) {
            try {
                await navigator.clipboard.writeText(this.generatedCaption);
                this.showError('📋 Caption copied to clipboard!');
                await new Promise(resolve => setTimeout(resolve, 800));
            } catch (e) {
                console.log('Clipboard copy failed');
            }
        }

        if (type === 'mp3') {
            // Download audio
            const audioUrl = this.currentVideoData.music?.play_url;
            console.log('Audio URL:', audioUrl);
            
            if (!audioUrl) {
                this.showError('❌ Audio not available for this video. Try downloading the video instead.');
                return;
            }
            
            const fileName = `DownloadeX_${author}_audio_${timestamp}.mp3`;
            this.showError('📥 Preparing MP3 download...');
            await this.downloadFile(audioUrl, fileName);
            
        } else {
            // Download video (MP4)
            const videoUrl = this.currentVideoData.video.noWatermark || this.currentVideoData.video.watermark;
            console.log('Video URL:', videoUrl);
            
            if (!videoUrl) {
                this.showError('❌ Video URL not available');
                return;
            }
            
            const fileName = `DownloadeX_${author}_video_${timestamp}.mp4`;
            this.showError('📥 Preparing MP4 download...');
            await this.downloadFile(videoUrl, fileName);
        }
    }

    async downloadFile(url, filename) {
        try {
            this.showLoading(true);
            
            // Method 1: Try direct blob download
            try {
                console.log('Attempting direct download from:', url);
                
                const response = await fetch(url, {
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = filename;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
                    
                    this.showError('✅ Download started! Check your downloads folder.');
                    this.showLoading(false);
                    return;
                }
            } catch (corsError) {
                console.log('Direct download blocked by CORS:', corsError);
            }
            
            // Method 2: Try using download attribute directly
            try {
                console.log('Trying direct link method...');
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showError('✅ Download started! If not, check the opened tab.');
                this.showLoading(false);
                return;
            } catch (directError) {
                console.log('Direct link failed:', directError);
            }
            
            // Method 3: Show download instructions with working button
            this.showLoading(false);
            this.showDownloadInstructions(url, filename);
            
        } catch (error) {
            console.error('Download error:', error);
            this.showLoading(false);
            this.showDownloadInstructions(url, filename);
        }
    }

    showDownloadInstructions(mediaUrl, filename) {
        const fileType = filename.includes('.mp3') ? 'MP3' : 'MP4';
        const errorDiv = document.getElementById('errorMessage');
        
        if (errorDiv) {
            errorDiv.innerHTML = `
                <div style="text-align: center; max-width: 100%;">
                    <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 15px;">
                        📥 ${fileType} Download Ready!
                    </p>
                    
                    <div style="background: #000; color: #fff; padding: 20px; border-radius: 12px; margin: 15px 0;">
                        <p style="margin-bottom: 15px; font-weight: 600;">Click the button below to download:</p>
                        <a href="${mediaUrl}" 
                           download="${filename}" 
                           target="_blank"
                           rel="noopener noreferrer"
                           style="display: inline-block; padding: 15px 40px; background: #fff; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px 0; transition: all 0.3s;">
                            ⬇️ Download ${fileType}
                        </a>
                        <p style="font-size: 13px; opacity: 0.9; margin-top: 15px;">
                            <strong>Mobile users:</strong> Long-press the button and select "Download link"
                        </p>
                        <p style="font-size: 13px; opacity: 0.9; margin-top: 8px;">
                            <strong>Desktop users:</strong> Right-click → "Save link as..."
                        </p>
                    </div>
                    
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; border-left: 4px solid #000; margin-top: 15px;">
                        <p style="font-size: 14px; color: #333; margin: 0;">
                            💡 <strong>Caption copied!</strong> Paste it when you upload your video.
                        </p>
                    </div>
                </div>
            `;
            errorDiv.classList.add('show');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.innerHTML = message;
            errorDiv.classList.add('show');
            
            // Auto-hide success messages after 3 seconds
            if (message.includes('✅')) {
                setTimeout(() => {
                    if (errorDiv.innerHTML === message) {
                        errorDiv.classList.remove('show');
                    }
                }, 3000);
            }
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
            loadingDiv.style.display = show ? 'flex' : 'none';
        }
    }

    hideVideoInfo() {
        const videoInfo = document.getElementById('videoInfo');
        if (videoInfo) {
            videoInfo.style.display = 'none';
        }
    }

    // YouTube functionality
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
            this.showYouTubeDownloadOptions(videoId, youtubeUrl, format);
        } catch (error) {
            console.error('YouTube download error:', error);
            this.showError(`Failed to prepare ${format.toUpperCase()} download`);
        } finally {
            this.showLoading(false);
        }
    }

    showYouTubeDownloadOptions(videoId, youtubeUrl, format) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            const quickUrl = youtubeUrl.replace('youtube.com', 'ssyoutube.com').replace('youtu.be', 'ssyoutu.be');
            
            errorDiv.innerHTML = `
                <div style="text-align: left; max-width: 100%;">
                    <p><strong>📥 ${format.toUpperCase()} Download Ready!</strong></p>
                    
                    <div style="background: #000; color: #fff; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p><strong>🚀 INSTANT DOWNLOAD:</strong></p>
                        <button onclick="window.open('${quickUrl}', '_blank')" 
                                style="padding: 15px 25px; background: #fff; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; width: 100%; margin: 5px 0;">
                            ⚡ SS-YouTube (${format.toUpperCase()})
                        </button>
                        <small style="opacity: 0.9;">Opens direct download page!</small>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                        <p><strong>🔄 Alternative:</strong></p>
                        <button onclick="window.open('https://yt1s.com/en/youtube-to-${format}?q=${encodeURIComponent(youtubeUrl)}', '_blank')" 
                                style="padding: 12px 20px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;">
                            🎯 YT1S Converter
                        </button>
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
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        const urlParams = new URLSearchParams(url.split('?')[1]);
        return urlParams.get('v');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TikTokDownloader();
});