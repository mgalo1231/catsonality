// ===== 首页预览数据加载 =====

// 猫咪类型配置
const catTypes = {
    explorer: { name: '探検家猫', color: '#FF6B9D' },
    healer: { name: '癒し猫', color: '#FFB6C1' },
    leader: { name: 'リーダー猫', color: '#FFA07A' },
    thinker: { name: '哲学者猫', color: '#9370DB' },
    wild: { name: '冒険家猫', color: '#FF8C42' },
    solitary: { name: '隠者猫', color: '#87CEEB' },
    royal: { name: '王子猫', color: '#FFD700' },
    guardian: { name: '守護猫', color: '#90EE90' }
};

// 页面加载时执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadPreviewPosts();
        
        // 数据加载完成后，隐藏 loading
        if (window.loadingController) {
            window.loadingController.hide();
        }
    } catch (error) {
        console.error('预览数据加载错误:', error);
        // 出错也要隐藏 loading
        if (window.loadingController) {
            window.loadingController.hide();
        }
    }
});

// 加载预览帖子
async function loadPreviewPosts() {
    const previewGrid = document.querySelector('.preview-grid');
    if (!previewGrid) return;

    try {
        // 从数据库获取最新的4条帖子
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select(`
                *,
                profiles:user_id (
                    username,
                    avatar_url,
                    primary_cat_type
                )
            `)
            .order('created_at', { ascending: false })
            .limit(4);

        if (error) throw error;

        // 如果没有帖子，显示示例数据
        if (!posts || posts.length === 0) {
            showSampleData(previewGrid);
            return;
        }

        // 渲染真实帖子
        renderPreviewPosts(posts, previewGrid);

    } catch (error) {
        console.error('预览数据加载错误:', error);
        // 出错时显示示例数据
        showSampleData(previewGrid);
    }
}

// 渲染预览帖子
function renderPreviewPosts(posts, container) {
    container.innerHTML = posts.map(post => {
        const profile = post.profiles || {};
        const catType = profile.primary_cat_type || 'explorer';
        const typeInfo = catTypes[catType] || catTypes.explorer;
        
        return `
            <div class="preview-card">
                <img src="${post.share_image_url || 'images/sample/IMG_1276.JPG'}" 
                     alt="" 
                     class="preview-image"
                     onerror="this.src='images/sample/IMG_1276.JPG'">
                <div class="preview-info">
                    <span class="preview-type">${typeInfo.name}</span>
                    <p class="preview-caption">${post.caption || '診断結果をシェアしました！'}</p>
                </div>
            </div>
        `;
    }).join('');
}

// 显示示例数据（当数据库没有数据或出错时）
function showSampleData(container) {
    container.innerHTML = `
        <div class="preview-card">
            <img src="images/sample/IMG_1276.JPG" alt="" class="preview-image">
            <div class="preview-info">
                <span class="preview-type">探検家猫</span>
                <p class="preview-caption">うちの子は探検家猫でした！</p>
            </div>
        </div>
        <div class="preview-card">
            <img src="images/sample/IMG_6335.JPG" alt="" class="preview-image">
            <div class="preview-info">
                <span class="preview-type">癒し猫</span>
                <p class="preview-caption">癒し猫タイプでした...</p>
            </div>
        </div>
        <div class="preview-card">
            <img src="images/sample/IMG_6533.JPG" alt="" class="preview-image">
            <div class="preview-info">
                <span class="preview-type">リーダー猫</span>
                <p class="preview-caption">リーダー猫！確かに...</p>
            </div>
        </div>
        <div class="preview-card">
            <img src="images/sample/IMG_9452.jpeg" alt="" class="preview-image">
            <div class="preview-info">
                <span class="preview-type">王子猫</span>
                <p class="preview-caption">王子猫でした！</p>
            </div>
        </div>
    `;
}
