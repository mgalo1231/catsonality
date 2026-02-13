// ===== Loading Page Controller =====

(function() {
    const MIN_DISPLAY_TIME = 500;
    const MAX_DISPLAY_TIME = 8000; // 安全超时：最多8秒
    let startTime = Date.now();
    let overlay = null;

    // 立即创建 loading overlay
    function createOverlay() {
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

        if (document.body) {
            document.body.appendChild(overlay);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(overlay);
            });
        }
    }

    function hide() {
        if (!overlay) return;
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, MIN_DISPLAY_TIME - elapsed);

        setTimeout(() => {
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }, delay);
    }

    function show() {
        if (!overlay) return;
        overlay.classList.remove('hidden');
        startTime = Date.now();
    }

    // 立即创建
    createOverlay();

    // 安全超时：无论如何，最多显示 MAX_DISPLAY_TIME 后自动隐藏
    setTimeout(() => { hide(); }, MAX_DISPLAY_TIME);

    // 拦截内部链接点击，显示 loading
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (href && 
            !href.startsWith('#') && 
            !href.startsWith('javascript:') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:') &&
            !link.hasAttribute('target') &&
            !link.hasAttribute('download')) {
            try {
                const url = new URL(href, window.location.origin);
                if (url.origin === window.location.origin || !href.includes('://')) {
                    show();
                }
            } catch (e) {
                show();
            }
        }
    });

    // 导出全局 API
    window.loadingController = { hide, show };

    // 默认行为：window.load 时自动隐藏（如果页面脚本没有主动调用 hide）
    window.addEventListener('load', () => {
        // 延迟一下再隐藏，给异步数据加载一点缓冲
        // 如果页面脚本已经手动调用了 hide()，重复调用也无副作用
        setTimeout(() => { hide(); }, 300);
    });
})();
