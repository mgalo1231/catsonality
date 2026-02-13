// ===== コミュニティページ =====

// 猫タイプ定義
const catTypes = {
    explorer: { name: '探検家猫', nameEn: 'Explorer Cat' },
    healer: { name: '癒し猫', nameEn: 'Healer Cat' },
    leader: { name: 'リーダー猫', nameEn: 'Leader Cat' },
    thinker: { name: '哲学者猫', nameEn: 'Thinker Cat' },
    wild: { name: '冒険家猫', nameEn: 'Wild Cat' },
    solitary: { name: '隠者猫', nameEn: 'Solitary Cat' },
    royal: { name: '王子猫', nameEn: 'Royal Cat' },
    guardian: { name: '守護猫', nameEn: 'Guardian Cat' }
};

// 投稿データ
let posts = [];
let currentUser = null;
let userLikes = new Set(); // 用户点赞过的帖子ID集合

// ===== DOM要素 =====
const postsGrid = document.getElementById('postsGrid');
const postModal = document.getElementById('postModal');
const modalClose = document.getElementById('modalClose');
const modalOwnerActions = document.getElementById('modalOwnerActions');
const modalOwnerEdit = document.getElementById('modalOwnerEdit');
const modalOwnerDelete = document.getElementById('modalOwnerDelete');
const modalEdit = document.getElementById('modalEdit');
const modalEditPreview = document.getElementById('modalEditPreview');
const modalEditImageInput = document.getElementById('modalEditImageInput');
const modalEditUploadBtn = document.getElementById('modalEditUploadBtn');
const modalEditCaption = document.getElementById('modalEditCaption');
const modalEditSave = document.getElementById('modalEditSave');
const modalEditCancel = document.getElementById('modalEditCancel');
const loginPromptModal = document.getElementById('loginPromptModal');
const promptClose = document.getElementById('promptClose');
const directPostModal = document.getElementById('directPostModal');
const directPostClose = document.getElementById('directPostClose');
const directPostUploadBtn = document.getElementById('directPostUploadBtn');
const directPostImageInput = document.getElementById('directPostImageInput');
const directPostPreview = document.getElementById('directPostPreview');
const directPostCaption = document.getElementById('directPostCaption');
const directPostSubmit = document.getElementById('directPostSubmit');
const communityPostBtn = document.getElementById('communityPostBtn');

let directPostImageData = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // ログイン状態を確認
        const { data: { user } } = await supabaseClient.auth.getUser();
        currentUser = user;

        // 用户点赞记录を読み込む
        if (currentUser) {
            await loadUserLikes();
        }

        // 投稿を読み込む
        await loadPosts();
        
        // UIを初期化
        initModalEvents();
        initDirectPost();
        
        // 数据加载完成后，隐藏 loading
        if (window.loadingController) {
            window.loadingController.hide();
        }
    } catch (error) {
        console.error('ページ初期化エラー:', error);
        // 出错也要隐藏 loading
        if (window.loadingController) {
            window.loadingController.hide();
        }
    }
});

// ===== 用户点赞记录読み込み =====
async function loadUserLikes() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('likes')
            .select('post_id')
            .eq('user_id', currentUser.id);
        
        if (!error && data) {
            userLikes = new Set(data.map(like => like.post_id));
        }
    } catch (e) {
        console.error('いいね取得エラー:', e);
    }
}

// ===== いいね数再計算 =====
async function applyLikeCounts(postList) {
    if (!postList || postList.length === 0) return;
    const postIds = postList.map(p => p.id);
    try {
        const { data: likes, error } = await supabaseClient
            .from('likes')
            .select('post_id')
            .in('post_id', postIds);
        if (error) throw error;

        const likeMap = {};
        (likes || []).forEach(row => {
            likeMap[row.post_id] = (likeMap[row.post_id] || 0) + 1;
        });

        postList.forEach(post => {
            post.likes_count = likeMap[post.id] || 0;
        });
    } catch (e) {
        console.error('いいね数再計算エラー:', e);
    }
}

// ===== 投稿読み込み =====
async function loadPosts() {
    try {
        let query = supabaseClient
            .from('posts')
            .select(`
                *,
                profiles:user_id (
                    username,
                    avatar_url,
                    primary_cat_type
                )
            `);

        // 並び順（likes_countは後で再計算するためcreated_atで取得）
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('投稿取得エラー:', error);
            showEmptyState();
            bindDirectPostButtons();
            return;
        }

        posts = data || [];
        await applyLikeCounts(posts);

        if (posts.length === 0) {
            showEmptyState();
            bindDirectPostButtons();
        } else {
            renderPosts(posts);
        }

    } catch (error) {
        console.error('投稿読み込みエラー:', error);
        showEmptyState();
        bindDirectPostButtons();
    }
}

// ===== 空状態表示 =====
function showEmptyState() {
    postsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <p style="color: #888; font-size: 1rem; margin-bottom: 1rem;">まだ投稿がありません</p>
            <p style="color: #aaa; font-size: 0.9rem;">診断結果をシェアして、最初の投稿者になりましょう！</p>
            <div style="margin-top: 1.5rem; display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap;">
                <a href="test.html" style="display: inline-block; padding: 0.8rem 2rem; background: #FE7EB1; color: white; border-radius: 999px; text-decoration: none;">診断を始める</a>
                <button id="emptyDirectPostBtn" class="community-post-btn" style="margin: 0;">直接投稿する</button>
            </div>
        </div>
    `;
    bindDirectPostButtons();
}

// ===== 投稿一覧表示 =====
function renderPosts(postsToRender) {
    if (postsToRender.length === 0) {
        showEmptyState();
        return;
    }

    postsGrid.innerHTML = postsToRender.map(post => {
        const profile = post.profiles || {};
        const catType = profile.primary_cat_type || 'explorer';
        const typeInfo = catTypes[catType] || { name: '不明' };
        const avatarUrl = profile.avatar_url || `images/cats-svg/${catType.charAt(0).toUpperCase() + catType.slice(1)}Cat.svg`;
        const isLiked = userLikes.has(post.id);
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-image-wrapper">
                    <span class="post-type-chip">${typeInfo.name}</span>
                    <img src="${post.share_image_url || 'images/sample/IMG_1276.JPG'}" alt="" class="post-image">
                </div>
                <div class="post-info">
                    <p class="post-caption">${post.caption || ''}</p>
                    <div class="post-author">
                        <img src="${avatarUrl}" alt="" class="post-avatar">
                        <div class="post-author-info">
                            <span class="post-author-name">${profile.username || '匿名'}</span>
                            <span class="post-date">${formatDate(post.created_at)}</span>
                        </div>
                    </div>
                    <div class="post-footer">
                        <button class="card-like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span class="card-like-count">${post.likes_count || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // クリックイベント追加
    document.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // 点赞按钮点击时不打开弹窗
            if (e.target.closest('.card-like-btn')) return;
            const postId = card.dataset.postId;
            openPostModal(postId);
        });
    });

    // 卡片点赞按钮事件
    document.querySelectorAll('.card-like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const postId = btn.dataset.postId;
            handleCardLike(postId, btn);
        });
    });
}

function bindDirectPostButtons() {
    const emptyBtn = document.getElementById('emptyDirectPostBtn');
    if (emptyBtn) {
        emptyBtn.addEventListener('click', () => {
            requireAuth(openDirectPostModal);
        });
    }
}

// ===== モーダルイベント =====
function initModalEvents() {
    // 投稿詳細モーダルを閉じる
    modalClose.addEventListener('click', closePostModal);
    postModal.querySelector('.modal-overlay').addEventListener('click', closePostModal);

    // ログインプロンプトを閉じる
    promptClose.addEventListener('click', closeLoginPrompt);
    loginPromptModal.querySelector('.modal-overlay').addEventListener('click', closeLoginPrompt);

    // いいねボタン
    document.getElementById('modalLikeBtn').addEventListener('click', handleLike);

    // コメント送信
    document.getElementById('commentSubmit').addEventListener('click', handleCommentSubmit);
    document.getElementById('commentInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCommentSubmit();
        }
    });

    // 編集/削除（本人投稿のみ表示）
    modalOwnerEdit?.addEventListener('click', () => toggleModalEdit(true));
    modalOwnerDelete?.addEventListener('click', confirmDeleteCurrentPost);
    modalEditCancel?.addEventListener('click', () => toggleModalEdit(false));
    modalEditSave?.addEventListener('click', saveModalEdits);
    modalEditUploadBtn?.addEventListener('click', () => modalEditImageInput?.click());
    modalEditImageInput?.addEventListener('change', handleModalEditImageChange);
}

// ===== 直接投稿 =====
function initDirectPost() {
    if (communityPostBtn) {
        communityPostBtn.addEventListener('click', () => {
            requireAuth(openDirectPostModal);
        });
    }

    if (directPostUploadBtn && directPostImageInput) {
        directPostUploadBtn.addEventListener('click', () => {
            directPostImageInput.click();
        });
    }

    if (directPostImageInput) {
        directPostImageInput.addEventListener('change', handleDirectPostImageChange);
    }

    if (directPostClose) {
        directPostClose.addEventListener('click', closeDirectPostModal);
    }

    const overlay = directPostModal?.querySelector('.direct-post-overlay');
    overlay?.addEventListener('click', closeDirectPostModal);

    if (directPostSubmit) {
        directPostSubmit.addEventListener('click', handleDirectPostSubmit);
    }
}

function openDirectPostModal() {
    if (!directPostModal) return;
    directPostModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDirectPostModal() {
    if (!directPostModal) return;
    directPostModal.classList.remove('active');
    document.body.style.overflow = '';
    resetDirectPostForm();
}

function resetDirectPostForm() {
    directPostImageData = null;
    if (directPostPreview) {
        directPostPreview.innerHTML = '<span class="direct-post-placeholder">画像を選択</span>';
    }
    if (directPostImageInput) {
        directPostImageInput.value = '';
    }
    if (directPostCaption) {
        directPostCaption.value = '';
    }
}

function handleDirectPostImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        directPostImageData = event.target.result;
        if (directPostPreview) {
            directPostPreview.innerHTML = `<img src="${directPostImageData}" alt="">`;
        }
    };
    reader.readAsDataURL(file);
}

async function handleDirectPostSubmit() {
    if (!directPostImageData) {
        alert('画像を選択してください。');
        return;
    }

    const caption = directPostCaption?.value.trim() || null;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        showLoginPrompt();
        return;
    }

    const { error } = await supabaseClient
        .from('posts')
        .insert({
            user_id: user.id,
            result_id: null,
            caption,
            share_image_url: directPostImageData
        });

    if (error) {
        console.error('投稿エラー:', error);
        alert('投稿に失敗しました');
        return;
    }

    closeDirectPostModal();
    await loadPosts();
}

// ===== 投稿詳細モーダル =====
let currentPostId = null;
let currentModalPost = null;
let modalEditImageData = null;

async function openPostModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    currentPostId = postId;
    currentModalPost = post;
    modalEditImageData = null;

    const profile = post.profiles || {};
    const catType = profile.primary_cat_type || 'explorer';
    const typeInfo = catTypes[catType] || { name: '不明' };
    const avatarUrl = profile.avatar_url || `images/cats-svg/${catType.charAt(0).toUpperCase() + catType.slice(1)}Cat.svg`;

    // 内容を設定
    document.getElementById('modalImage').src = post.share_image_url || 'images/sample/IMG_1276.JPG';
    document.getElementById('modalAuthorAvatar').src = avatarUrl;
    document.getElementById('modalAuthorName').textContent = profile.username || '匿名';
    document.getElementById('modalAuthorType').textContent = typeInfo.name;
    document.getElementById('modalCaption').textContent = post.caption || '';
    document.getElementById('modalDate').textContent = formatDate(post.created_at);
    document.getElementById('modalLikeCount').textContent = post.likes_count || 0;

    // 本人投稿なら編集/削除を表示
    const isOwner = currentUser && post.user_id === currentUser.id;
    if (modalOwnerActions) {
        modalOwnerActions.classList.toggle('active', !!isOwner);
    }
    
    // 确保编辑区域隐藏，显示区域可见
    if (modalEdit) {
        modalEdit.classList.remove('active');
    }
    const modalCaption = document.getElementById('modalCaption');
    const modalImageContainer = document.getElementById('modalImage')?.closest('.modal-image');
    const modalDateRow = document.querySelector('.modal-date-row');
    if (modalCaption) modalCaption.style.display = 'block';
    if (modalImageContainer) modalImageContainer.style.display = 'block';
    if (modalDateRow) modalDateRow.style.display = 'flex';
    
    // 设置编辑表单的值
    if (modalEditCaption) {
        modalEditCaption.value = post.caption || '';
    }
    if (modalEditPreview) {
        if (post.share_image_url) {
            modalEditPreview.innerHTML = `<img src="${post.share_image_url}" alt="">`;
        } else {
            modalEditPreview.innerHTML = '<span class="direct-post-placeholder">画像を選択</span>';
        }
    }

    // いいね状態をチェック
    if (currentUser) {
        const { data: likeData } = await supabaseClient
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUser.id)
            .single();

        const likeBtn = document.getElementById('modalLikeBtn');
        if (likeData) {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.remove('liked');
        }
    }

    // コメントを読み込む
    await loadComments(postId);

    // モーダルを表示
    postModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostModal() {
    postModal.classList.remove('active');
    document.body.style.overflow = '';
    currentPostId = null;
    currentModalPost = null;
    modalEditImageData = null;
}

function toggleModalEdit(isEdit) {
    if (!modalEdit || !modalOwnerActions) return;
    
    const modalCaption = document.getElementById('modalCaption');
    const modalImage = document.getElementById('modalImage');
    const modalImageContainer = modalImage?.closest('.modal-image');
    const modalDateRow = document.querySelector('.modal-date-row');
    
    if (isEdit) {
        // 编辑模式：隐藏显示区域，显示编辑区域
        modalEdit.classList.add('active');
        modalOwnerActions.classList.remove('active');
        
        // 确保编辑表单的值是最新的
        if (modalEditCaption && currentModalPost) {
            modalEditCaption.value = currentModalPost.caption || '';
        }
        
        // 隐藏显示的文字和图片
        if (modalCaption) modalCaption.style.display = 'none';
        if (modalImageContainer) modalImageContainer.style.display = 'none';
        if (modalDateRow) modalDateRow.style.display = 'none';
        
        // 聚焦到 textarea，方便用户编辑
        setTimeout(() => {
            if (modalEditCaption) {
                modalEditCaption.focus();
                // 将光标移到文本末尾
                const length = modalEditCaption.value.length;
                modalEditCaption.setSelectionRange(length, length);
            }
        }, 100);
    } else {
        // 非编辑模式：显示显示区域，隐藏编辑区域
        modalEdit.classList.remove('active');
        
        // 显示文字和图片
        if (modalCaption) modalCaption.style.display = 'block';
        if (modalImageContainer) modalImageContainer.style.display = 'block';
        if (modalDateRow) modalDateRow.style.display = 'flex';
        
        if (currentUser && currentModalPost && currentModalPost.user_id === currentUser.id) {
            modalOwnerActions.classList.add('active');
        }
    }
}

function handleModalEditImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        modalEditImageData = event.target.result;
        if (modalEditPreview) {
            modalEditPreview.innerHTML = `<img src="${modalEditImageData}" alt="">`;
        }
    };
    reader.readAsDataURL(file);
}

async function saveModalEdits() {
    if (!currentModalPost) return;

    const newCaption = modalEditCaption?.value.trim() || null;
    const updatePayload = { caption: newCaption };
    if (modalEditImageData) {
        updatePayload.share_image_url = modalEditImageData;
    }

    try {
        const { error } = await supabaseClient
            .from('posts')
            .update(updatePayload)
            .eq('id', currentModalPost.id);

        if (error) throw error;

        // 更新ローカル
        currentModalPost.caption = updatePayload.caption;
        if (modalEditImageData) {
            currentModalPost.share_image_url = modalEditImageData;
        }

        // 画面反映
        document.getElementById('modalCaption').textContent = currentModalPost.caption || '';
        document.getElementById('modalImage').src = currentModalPost.share_image_url || 'images/sample/IMG_1276.JPG';
        renderPosts(posts);
        toggleModalEdit(false);
        alert('投稿を更新しました');
    } catch (error) {
        console.error('投稿更新エラー:', error);
        alert('投稿の更新に失敗しました');
    }
}

async function confirmDeleteCurrentPost() {
    if (!currentModalPost) return;
    const ok = confirm('この投稿を削除しますか？');
    if (!ok) return;

    try {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', currentModalPost.id);

        if (error) throw error;

        posts = posts.filter(p => p.id !== currentModalPost.id);
        closePostModal();
        renderPosts(posts);
        alert('投稿を削除しました');
    } catch (error) {
        console.error('投稿削除エラー:', error);
        alert('投稿の削除に失敗しました');
    }
}

// ===== コメント読み込み =====
async function loadComments(postId) {
    const commentsList = document.getElementById('modalCommentsList');

    try {
        const { data: comments, error } = await supabaseClient
            .from('comments')
            .select(`
                *,
                profiles:user_id (
                    username,
                    avatar_url,
                    primary_cat_type
                )
            `)
            .eq('post_id', postId)
            .is('parent_id', null)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<p style="color: #999; font-size: 0.85rem;">まだコメントはありません</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => renderCommentItem(comment)).join('');

        // 返信ボタンイベント
        commentsList.querySelectorAll('.comment-action.reply').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!currentUser) {
                    showLoginPrompt();
                    return;
                }
                const input = document.getElementById('commentInput');
                input.focus();
                input.placeholder = `@${btn.dataset.author} への返信...`;
            });
        });

        // 削除ボタン
        commentsList.querySelectorAll('.comment-action.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!currentUser) {
                    showLoginPrompt();
                    return;
                }
                const commentId = btn.dataset.id;
                if (!commentId) return;
                if (!confirm('このコメントを削除しますか？')) return;
                try {
                    const { error } = await supabaseClient
                        .from('comments')
                        .delete()
                        .eq('id', commentId)
                        .eq('user_id', currentUser.id);
                    if (error) throw error;
                    await loadComments(postId);
                } catch (error) {
                    console.error('コメント削除エラー:', error);
                    alert('コメントの削除に失敗しました');
                }
            });
        });

    } catch (error) {
        console.error('コメント読み込みエラー:', error);
        commentsList.innerHTML = '<p style="color: #999; font-size: 0.85rem;">コメントの読み込みに失敗しました</p>';
    }
}

function renderCommentItem(comment) {
    const profile = comment.profiles || {};
    const catType = profile.primary_cat_type || 'explorer';
    const typeInfo = catTypes[catType] || { name: '不明' };
    const avatarUrl = profile.avatar_url || `images/cats-svg/${catType.charAt(0).toUpperCase() + catType.slice(1)}Cat.svg`;
    const isOwner = currentUser && comment.user_id === currentUser.id;

    return `
        <div class="comment-item">
            <img src="${avatarUrl}" alt="" class="comment-avatar">
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-name">${profile.username || '匿名'}</span>
                    <span class="comment-type">${typeInfo.name}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
                <div class="comment-actions">
                    <button class="comment-action like">${comment.likes_count || 0} いいね</button>
                    <button class="comment-action reply" data-author="${profile.username || '匿名'}">返信</button>
                    ${isOwner ? `<button class="comment-action delete" data-id="${comment.id}">削除</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ===== いいね処理 =====
async function handleLike() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    if (!currentPostId) return;

    const likeBtn = document.getElementById('modalLikeBtn');
    const likeCount = document.getElementById('modalLikeCount');
    const isLiked = likeBtn.classList.contains('liked');

    // 确保当前数量是有效数字
    let currentCount = parseInt(likeCount.textContent) || 0;

    try {
        if (isLiked) {
            // いいね解除
            await supabaseClient
                .from('likes')
                .delete()
                .eq('post_id', currentPostId)
                .eq('user_id', currentUser.id);

            likeBtn.classList.remove('liked');
            currentCount = Math.max(0, currentCount - 1); // 确保不会变成负数
            likeCount.textContent = currentCount;

            // posts表のlikes_countも更新
            await supabaseClient
                .from('posts')
                .update({ likes_count: currentCount })
                .eq('id', currentPostId);
        } else {
            // いいね追加
            await supabaseClient
                .from('likes')
                .insert({
                    post_id: currentPostId,
                    user_id: currentUser.id
                });

            likeBtn.classList.add('liked');
            currentCount = currentCount + 1;
            likeCount.textContent = currentCount;

            // posts表のlikes_countも更新
            await supabaseClient
                .from('posts')
                .update({ likes_count: currentCount })
                .eq('id', currentPostId);
        }

        // ローカルデータも更新
        const post = posts.find(p => p.id === currentPostId);
        if (post) {
            post.likes_count = currentCount;
        }

        // userLikesも更新
        if (isLiked) {
            userLikes.delete(currentPostId);
        } else {
            userLikes.add(currentPostId);
        }

        // 卡片上的点赞状态也同步更新
        updateCardLikeState(currentPostId, !isLiked, currentCount);

    } catch (error) {
        console.error('いいねエラー:', error);
    }
}

// ===== 卡片点赞处理 =====
async function handleCardLike(postId, btn) {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    const isLiked = btn.classList.contains('liked');
    const countSpan = btn.querySelector('.card-like-count');
    let currentCount = parseInt(countSpan.textContent) || 0;

    try {
        if (isLiked) {
            // いいね解除
            await supabaseClient
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', currentUser.id);

            currentCount = Math.max(0, currentCount - 1);
            userLikes.delete(postId);

            // posts表のlikes_countも更新
            await supabaseClient
                .from('posts')
                .update({ likes_count: currentCount })
                .eq('id', postId);
        } else {
            // いいね追加
            await supabaseClient
                .from('likes')
                .insert({
                    post_id: postId,
                    user_id: currentUser.id
                });

            currentCount = currentCount + 1;
            userLikes.add(postId);

            // posts表のlikes_countも更新
            await supabaseClient
                .from('posts')
                .update({ likes_count: currentCount })
                .eq('id', postId);
        }

        // ローカルデータも更新
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.likes_count = currentCount;
        }

        // UI更新
        updateCardLikeState(postId, !isLiked, currentCount);

    } catch (error) {
        console.error('いいねエラー:', error);
    }
}

// ===== 卡片点赞状态更新 =====
function updateCardLikeState(postId, isLiked, count) {
    const cardBtn = document.querySelector(`.card-like-btn[data-post-id="${postId}"]`);
    if (cardBtn) {
        if (isLiked) {
            cardBtn.classList.add('liked');
            cardBtn.querySelector('svg').setAttribute('fill', 'currentColor');
        } else {
            cardBtn.classList.remove('liked');
            cardBtn.querySelector('svg').setAttribute('fill', 'none');
        }
        cardBtn.querySelector('.card-like-count').textContent = count;
    }
}

// ===== コメント送信 =====
async function handleCommentSubmit() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }

    if (!currentPostId) return;

    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    
    if (!content) return;

    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert({
                post_id: currentPostId,
                user_id: currentUser.id,
                content: content
            });

        if (error) throw error;

        // 入力をクリア
        input.value = '';
        input.placeholder = 'コメントを入力...';

        // コメントを再読み込み
        await loadComments(currentPostId);

    } catch (error) {
        console.error('コメント送信エラー:', error);
        alert('コメントの送信に失敗しました');
    }
}

// ===== ログインプロンプト =====
function showLoginPrompt() {
    loginPromptModal.classList.add('active');
}

function closeLoginPrompt() {
    loginPromptModal.classList.remove('active');
}

// ===== ユーティリティ =====
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}
