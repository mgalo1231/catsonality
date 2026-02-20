// ===== Loading Page Controller =====

(function() {
    const MIN_DISPLAY_TIME = 500;
    const MAX_DISPLAY_TIME = 20000; // 安全超时：最多20秒（大量数据时も余裕を持つ）
    let startTime = Date.now();
    let overlay = null;
    let manualMode = false; // ページが手動制御を宣言したかどうか
    let alreadyHidden = false; // 既に非表示済みかどうか

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
                <div class="loading-text">読み込み中</div>
                <div class="loading-progress-track">
                    <div class="loading-progress-bar"></div>
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
        if (!overlay || alreadyHidden) return;
        alreadyHidden = true;
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, MIN_DISPLAY_TIME - elapsed);

        // 进度条跳到100%，然后淡出
        const bar = overlay.querySelector('.loading-progress-bar');
        if (bar) {
            bar.style.animation = 'none';
            bar.style.width = '100%';
            bar.style.transition = 'width 0.3s ease-out';
            bar.style.background = 'linear-gradient(90deg, #FE7EB1, #FFB6C1)';
        }

        setTimeout(() => {
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }, delay + 350); // 多等350ms让进度条走完到100%
    }

    function show() {
        if (!overlay) return;
        overlay.classList.remove('hidden');
        startTime = Date.now();
        alreadyHidden = false;

        // 进度条をリセット
        const bar = overlay.querySelector('.loading-progress-bar');
        if (bar) {
            bar.style.transition = 'none';
            bar.style.width = '0%';
            bar.style.background = '';
            // 強制リフロー後にアニメーションを再開
            void bar.offsetWidth;
            bar.style.animation = '';
        }
    }

    // 手動制御モードを有効にする
    // ページのJSがこれを呼ぶと、window.loadの自動非表示が無効になり、
    // ページが明示的にhide()を呼ぶまでloadingが表示され続ける
    function claim() {
        manualMode = true;
    }

    // 立即创建
    createOverlay();

    // 安全超时：無論如何、最多显示 MAX_DISPLAY_TIME 后自动隐藏（フリーズ防止）
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
                    // ページ遷移時はmanualModeをリセット（新しいページで再判定される）
                    manualMode = false;
                }
            } catch (e) {
                show();
                manualMode = false;
            }
        }
    });

    // 导出全局 API
    window.loadingController = { hide, show, claim };

    // 默认行为：window.load 时自动隐藏
    // ただし、ページがclaim()で手動制御を宣言している場合は自動非表示しない
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!manualMode) {
                hide();
            }
        }, 300);
    });
})();
