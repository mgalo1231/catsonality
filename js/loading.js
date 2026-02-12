// ===== Loading Page Controller =====

/**
 * 页面加载控制器
 * 在页面切换时显示加载动画，直到内容加载完成
 */

class LoadingController {
    constructor() {
        this.loadingOverlay = null;
        this.minDisplayTime = 500; // 最小显示时间（毫秒），避免闪烁
        this.startTime = Date.now();
        this.isPageTransition = false;
        
        this.init();
    }

    init() {
        // 创建 loading overlay
        this.createLoadingOverlay();
        
        // 监听页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.handlePageLoad();
            });
        } else {
            // 如果 DOM 已经加载完成
            this.handlePageLoad();
        }

        // 监听页面卸载（用于页面切换）
        window.addEventListener('beforeunload', () => {
            this.show();
        });

        // 监听所有链接点击（页面内导航）
        this.setupLinkInterception();
    }

    createLoadingOverlay() {
        // 检查是否已存在 loading overlay
        let overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            this.loadingOverlay = overlay;
            return;
        }

        // 创建 loading overlay
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        
        overlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-logo">
                    <img src="images/logo.svg" alt="Catsonality Logo">
                </div>
                <div class="loading-text">
                    読み込み中
                    <div class="loading-dots">
                        <span class="loading-dot"></span>
                        <span class="loading-dot"></span>
                        <span class="loading-dot"></span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.loadingOverlay = overlay;
    }

    show() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
            this.startTime = Date.now();
        }
    }

    hide() {
        if (!this.loadingOverlay) return;

        const elapsed = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayTime - elapsed);

        setTimeout(() => {
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.add('hidden');
            }
        }, remainingTime);
    }

    handlePageLoad() {
        // 等待所有资源加载完成
        if (document.readyState === 'complete') {
            this.hide();
        } else {
            window.addEventListener('load', () => {
                this.hide();
            });
        }
    }

    setupLinkInterception() {
        // 拦截所有内部链接点击
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            
            // 只拦截内部链接（相对路径或同域）
            if (href && 
                !href.startsWith('#') && 
                !href.startsWith('javascript:') &&
                !href.startsWith('mailto:') &&
                !href.startsWith('tel:') &&
                !link.hasAttribute('target') &&
                !link.hasAttribute('download')) {
                
                // 检查是否是外部链接
                try {
                    const url = new URL(href, window.location.origin);
                    if (url.origin === window.location.origin || href.startsWith('/') || !href.includes('://')) {
                        // 内部链接，显示 loading
                        this.show();
                    }
                } catch (e) {
                    // 相对路径，显示 loading
                    this.show();
                }
            }
        });
    }
}

// 初始化 loading controller
let loadingController;

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadingController = new LoadingController();
    });
} else {
    loadingController = new LoadingController();
}

// 导出供其他脚本使用
window.loadingController = loadingController;
