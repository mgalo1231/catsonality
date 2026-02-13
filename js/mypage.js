// ===== マイページ =====

// 猫タイプ定義
const catTypes = {
    explorer: { name: '探検家猫', nameEn: 'Explorer Cat', image: 'images/cats-svg/ExplorerCat.svg' },
    healer: { name: '癒し猫', nameEn: 'Healer Cat', image: 'images/cats-svg/HealerCat.svg' },
    leader: { name: 'リーダー猫', nameEn: 'Leader Cat', image: 'images/cats-svg/LeaderCat.svg' },
    thinker: { name: '哲学者猫', nameEn: 'Thinker Cat', image: 'images/cats-svg/ThinkerCat.svg' },
    wild: { name: '冒険家猫', nameEn: 'Wild Cat', image: 'images/cats-svg/WildCat.svg' },
    solitary: { name: '隠者猫', nameEn: 'Solitary Cat', image: 'images/cats-svg/SolitaryCat.svg' },
    royal: { name: '王子猫', nameEn: 'Royal Cat', image: 'images/cats-svg/RoyalCat.svg' },
    guardian: { name: '守護猫', nameEn: 'Guardian Cat', image: 'images/cats-svg/GuardianCat.svg' }
};

// ユーザーデータ
let currentUser = null;
let userProfile = null;
let userResults = [];
let userPosts = [];

// ===== DOM要素 =====
const historyList = document.getElementById('historyList');
const myPostsGrid = document.getElementById('myPostsGrid');
const editModal = document.getElementById('editModal');
const confirmModal = document.getElementById('confirmModal');
const mypagePostBtn = document.getElementById('mypagePostBtn');
const mypageDirectPostModal = document.getElementById('mypageDirectPostModal');
const mypageDirectPostClose = document.getElementById('mypageDirectPostClose');
const mypageDirectPostUploadBtn = document.getElementById('mypageDirectPostUploadBtn');
const mypageDirectPostImageInput = document.getElementById('mypageDirectPostImageInput');
const mypageDirectPostPreview = document.getElementById('mypageDirectPostPreview');
const mypageDirectPostCaption = document.getElementById('mypageDirectPostCaption');
const mypageDirectPostSubmit = document.getElementById('mypageDirectPostSubmit');
const postDetailModal = document.getElementById('postDetailModal');
const postDetailClose = document.getElementById('postDetailClose');
const postDetailImage = document.getElementById('postDetailImage');
const postDetailCaption = document.getElementById('postDetailCaption');
const postDetailDate = document.getElementById('postDetailDate');
const postDetailAuthorAvatar = document.getElementById('postDetailAuthorAvatar');
const postDetailAuthorName = document.getElementById('postDetailAuthorName');
const postDetailAuthorType = document.getElementById('postDetailAuthorType');
const postDetailLikeBtn = document.getElementById('postDetailLikeBtn');
const postDetailLikeCount = document.getElementById('postDetailLikeCount');
const postDetailCommentsList = document.getElementById('postDetailCommentsList');
const postDetailCommentInput = document.getElementById('postDetailCommentInput');
const postDetailCommentSubmit = document.getElementById('postDetailCommentSubmit');
const postDetailEdit = document.getElementById('postDetailEdit');
const postEditPreview = document.getElementById('postEditPreview');
const postEditImageInput = document.getElementById('postEditImageInput');
const postEditUploadBtn = document.getElementById('postEditUploadBtn');
const postEditCaption = document.getElementById('postEditCaption');
const postDetailEditBtn = document.getElementById('postDetailEditBtn');
const postDetailSaveBtn = document.getElementById('postDetailSaveBtn');
const postDetailCancelBtn = document.getElementById('postDetailCancelBtn');

let mypageDirectPostImageData = null;
let currentDetailPost = null;
let postEditImageData = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
    // ログインチェック
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;

    // データを読み込む
    await loadUserData();
    
    // UIを初期化
    initTabs();
    initModals();
    initLogoutButton();
    initDirectPost();
});

// ===== ユーザーデータ読み込み =====
async function loadUserData() {
    try {
        // プロフィール取得
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (profileError) {
            console.error('プロフィール取得エラー:', profileError);
        } else {
            userProfile = profile;
            renderProfile();
        }

        // 診断結果取得
        const { data: results, error: resultsError } = await supabaseClient
            .from('results')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (resultsError) {
            console.error('診断結果取得エラー:', resultsError);
        } else {
            userResults = results || [];
            renderHistory();
        }

        // 投稿取得
        const { data: posts, error: postsError } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (postsError) {
            console.error('投稿取得エラー:', postsError);
        } else {
            userPosts = posts || [];
            await applyLikeCountsToMyPosts(userPosts);
            renderMyPosts();
            updateStats();
        }

    } catch (error) {
        console.error('データ読み込みエラー:', error);
    }
}

// ===== プロフィール表示 =====
function renderProfile() {
    if (!userProfile) return;

    // ユーザー名
    document.getElementById('profileName').textContent = userProfile.username || 'ユーザー';
    
    // 猫タイプ
    const catType = userProfile.primary_cat_type;
    if (catType && catTypes[catType]) {
        document.getElementById('profileTypeLabel').textContent = catTypes[catType].name;
    } else {
        document.getElementById('profileTypeLabel').textContent = '未診断';
    }

    // アバター（ユーザーがアップロードした画像を優先、なければ猫タイプ画像）
    const avatarElement = document.getElementById('profileAvatar');
    if (userProfile.avatar_url) {
        // ユーザーがアップロードした画像（Base64またはURL）
        avatarElement.src = userProfile.avatar_url;
    } else if (catType && catTypes[catType]) {
        // 猫タイプのデフォルト画像
        avatarElement.src = catTypes[catType].image;
    } else {
        // デフォルト画像
        avatarElement.src = 'images/cats-svg/ExplorerCat.svg';
    }

    // 登録日
    const joinedDate = new Date(userProfile.created_at);
    const joinedText = `${joinedDate.getFullYear()}年${joinedDate.getMonth() + 1}月から利用`;
    document.querySelector('.profile-joined').textContent = joinedText;

    // 編集フォームにも反映
    const editNameInput = document.getElementById('editName');
    if (editNameInput) {
        editNameInput.value = userProfile.username || '';
    }
}

// ===== 統計更新 =====
function updateStats() {
    document.getElementById('statDiagnoses').textContent = userResults.length;
    document.getElementById('statPosts').textContent = userPosts.length;
    
    // 総いいね数を計算
    const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
    document.getElementById('statLikes').textContent = totalLikes;
}

// ===== いいね数再計算 =====
async function applyLikeCountsToMyPosts(postList) {
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
    } catch (error) {
        console.error('いいね数再計算エラー:', error);
    }
}

// ===== 診断履歴表示 =====
function renderHistory() {
    if (!historyList) return;

    // 根据是否有诊断履历来显示/隐藏"もう一度診断する"按钮
    const historyCta = document.querySelector('.history-cta');
    if (historyCta) {
        historyCta.style.display = userResults.length > 0 ? 'block' : 'none';
    }

    if (userResults.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <p>まだ診断履歴がありません</p>
                <a href="test.html" class="empty-state-btn">診断を始める</a>
            </div>
        `;
        return;
    }

    historyList.innerHTML = userResults.map((item, index) => {
        const catType = item.cat_type;
        const typeInfo = catTypes[catType] || { name: '不明', image: 'images/cats-svg/ExplorerCat.svg' };
        const isMain = userProfile && userProfile.primary_cat_type === catType;
        
        return `
            <div class="history-item" data-id="${item.id}" data-type="${catType}" data-scores='${JSON.stringify(item.scores || {})}'>
                <img src="${typeInfo.image}" alt="" class="history-cat-image">
                <div class="history-info">
                    <div class="history-type">${typeInfo.name}</div>
                    <div class="history-cat-name">${item.cat_name || ''}</div>
                    <div class="history-date">${formatDate(item.created_at)}</div>
                </div>
                <div class="history-actions">
                    ${isMain ? '<span style="color: #FE7EB1; font-size: 0.75rem;">表示中</span>' : `<button class="history-btn set-main-btn" data-type="${catType}">表示する</button>`}
                </div>
            </div>
        `;
    }).join('');

    // 履历项点击事件 - 查看详细结果
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // 点击"表示する"按钮时不跳转
            if (e.target.closest('.history-btn')) return;
            
            const catType = item.dataset.type;
            let scores = {};
            try {
                scores = JSON.parse(item.dataset.scores || '{}');
            } catch (err) {
                console.error('scores解析エラー:', err);
            }
            
            // 保存到localStorage以便结果页读取
            localStorage.setItem('catsonalityResult', JSON.stringify({
                type: catType,
                scores: scores,
                fromHistory: true // 标记来自履历
            }));
            
            // 跳转到结果页
            window.location.href = `result.html?type=${catType}&from=history`;
        });
    });

    // "表示する"按钮点击事件
    document.querySelectorAll('.set-main-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const catType = btn.dataset.type;
            setMainType(catType);
        });
    });
}

// ===== 投稿表示 =====
function renderMyPosts() {
    if (!myPostsGrid) return;

    if (userPosts.length === 0) {
        if (mypagePostBtn) mypagePostBtn.style.display = 'none';
        myPostsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <p>まだ投稿がありません</p>
                <div style="display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap;">
                    <a href="test.html" class="empty-state-btn">診断して投稿する</a>
                    <button id="mypageEmptyPostBtn" class="mypage-post-btn">直接投稿する</button>
                </div>
            </div>
        `;
        bindMyDirectPostButtons();
        return;
    }
    
    if (mypagePostBtn) mypagePostBtn.style.display = '';

    myPostsGrid.innerHTML = userPosts.map(post => {
        const catType = userProfile?.primary_cat_type || 'explorer';
        const typeInfo = catTypes[catType] || { name: '不明' };
        const avatarUrl = userProfile?.avatar_url || `images/cats-svg/${catType.charAt(0).toUpperCase() + catType.slice(1)}Cat.svg`;
        return `
            <div class="post-card" data-id="${post.id}">
                <div class="post-image-wrapper">
                    <span class="post-type-chip">${typeInfo.name}</span>
                    <img src="${post.share_image_url || 'images/sample/IMG_1276.JPG'}" alt="" class="post-image">
                </div>
                <div class="post-info">
                    <p class="post-caption">${post.caption || ''}</p>
                    <div class="post-author">
                        <img src="${avatarUrl}" alt="" class="post-avatar">
                        <span class="post-author-name">${userProfile?.username || 'ユーザー'}</span>
                    </div>
                    <div class="post-footer">
                        <button class="card-like-btn liked" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span class="card-like-count">${post.likes_count || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', () => {
            const postId = card.dataset.id;
            openPostDetail(postId, false);
        });
    });
}

function bindMyDirectPostButtons() {
    const emptyBtn = document.getElementById('mypageEmptyPostBtn');
    if (emptyBtn) {
        emptyBtn.addEventListener('click', openMypageDirectPostModal);
    }
}

// ===== タブ切り替え =====
function initTabs() {
    const tabs = document.querySelectorAll('.mypage-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetTab}Content`).classList.add('active');
        });
    });
}

// ===== モーダル制御 =====
function initModals() {
    // 編集モーダル
    document.getElementById('editProfileBtn').addEventListener('click', openEditModal);
    document.getElementById('editSave').addEventListener('click', saveProfile);
    document.getElementById('editCancel').addEventListener('click', closeEditModal);
    editModal.querySelector('.modal-overlay').addEventListener('click', closeEditModal);
    initEditAvatarHandlers();

    // 削除確認モーダル
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    confirmModal.querySelector('.modal-overlay').addEventListener('click', closeConfirmModal);

    // 投稿詳細モーダル
    postDetailClose?.addEventListener('click', closePostDetail);
    postDetailModal?.querySelector('.modal-overlay')?.addEventListener('click', closePostDetail);
    postDetailEditBtn?.addEventListener('click', () => togglePostEdit(true));
    postDetailCancelBtn?.addEventListener('click', () => togglePostEdit(false));
    postDetailSaveBtn?.addEventListener('click', savePostEdits);
    document.getElementById('postDetailDeleteBtn')?.addEventListener('click', () => {
        if (currentDetailPost) {
            const postId = currentDetailPost.id;
            closePostDetail();
            confirmDeletePost(postId);
        }
    });
    postEditUploadBtn?.addEventListener('click', () => postEditImageInput?.click());
    postEditImageInput?.addEventListener('change', handlePostEditImageChange);
    postDetailLikeBtn?.addEventListener('click', handlePostDetailLike);
    postDetailCommentSubmit?.addEventListener('click', handlePostDetailCommentSubmit);
    postDetailCommentInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePostDetailCommentSubmit();
        }
    });
}

// ===== 直接投稿 =====
function initDirectPost() {
    if (mypagePostBtn) {
        mypagePostBtn.addEventListener('click', openMypageDirectPostModal);
    }

    if (mypageDirectPostUploadBtn && mypageDirectPostImageInput) {
        mypageDirectPostUploadBtn.addEventListener('click', () => {
            mypageDirectPostImageInput.click();
        });
    }

    if (mypageDirectPostImageInput) {
        mypageDirectPostImageInput.addEventListener('change', handleMypageDirectPostImageChange);
    }

    if (mypageDirectPostClose) {
        mypageDirectPostClose.addEventListener('click', closeMypageDirectPostModal);
    }

    const overlay = mypageDirectPostModal?.querySelector('.direct-post-overlay');
    overlay?.addEventListener('click', closeMypageDirectPostModal);

    if (mypageDirectPostSubmit) {
        mypageDirectPostSubmit.addEventListener('click', handleMypageDirectPostSubmit);
    }
}

function openMypageDirectPostModal() {
    if (!mypageDirectPostModal) return;
    mypageDirectPostModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMypageDirectPostModal() {
    if (!mypageDirectPostModal) return;
    mypageDirectPostModal.classList.remove('active');
    document.body.style.overflow = '';
    resetMypageDirectPostForm();
}

function resetMypageDirectPostForm() {
    mypageDirectPostImageData = null;
    if (mypageDirectPostPreview) {
        mypageDirectPostPreview.innerHTML = '<span class="direct-post-placeholder">画像を選択</span>';
    }
    if (mypageDirectPostImageInput) {
        mypageDirectPostImageInput.value = '';
    }
    if (mypageDirectPostCaption) {
        mypageDirectPostCaption.value = '';
    }
}

function handleMypageDirectPostImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        mypageDirectPostImageData = event.target.result;
        if (mypageDirectPostPreview) {
            mypageDirectPostPreview.innerHTML = `<img src="${mypageDirectPostImageData}" alt="">`;
        }
    };
    reader.readAsDataURL(file);
}

async function handleMypageDirectPostSubmit() {
    if (!mypageDirectPostImageData) {
        alert('画像を選択してください。');
        return;
    }

    const caption = mypageDirectPostCaption?.value.trim() || null;

    if (!currentUser) {
        alert('ログインが必要です。');
        return;
    }

    const { error } = await supabaseClient
        .from('posts')
        .insert({
            user_id: currentUser.id,
            result_id: null,
            caption,
            share_image_url: mypageDirectPostImageData
        });

    if (error) {
        console.error('投稿エラー:', error);
        alert('投稿に失敗しました');
        return;
    }

    closeMypageDirectPostModal();
    await loadUserData();
}

// ===== 投稿詳細 =====
function openPostDetail(postId, editMode) {
    const post = userPosts.find(p => p.id === postId);
    if (!post || !postDetailModal) return;

    currentDetailPost = post;
    postDetailImage.src = post.share_image_url || 'images/sample/IMG_1276.JPG';
    postDetailCaption.textContent = post.caption || '';
    postDetailDate.textContent = formatDate(post.created_at);

    // 作者情報（マイページは自分）
    const catType = userProfile?.primary_cat_type;
    const typeInfo = catType && catTypes[catType] ? catTypes[catType] : null;
    if (postDetailAuthorAvatar) {
        postDetailAuthorAvatar.src = userProfile?.avatar_url || typeInfo?.image || 'images/cats-svg/ExplorerCat.svg';
    }
    if (postDetailAuthorName) {
        postDetailAuthorName.textContent = userProfile?.username || 'ユーザー';
    }
    if (postDetailAuthorType) {
        postDetailAuthorType.textContent = typeInfo?.name || '未診断';
    }
    if (postDetailLikeCount) {
        postDetailLikeCount.textContent = post.likes_count || 0;
    }
    if (postDetailLikeBtn) {
        postDetailLikeBtn.classList.toggle('liked', false);
    }

    // コメント読み込み
    loadPostDetailComments(post.id);

    postEditCaption.value = post.caption || '';
    postEditImageData = null;
    if (postEditPreview) {
        if (post.share_image_url) {
            postEditPreview.innerHTML = `<img src="${post.share_image_url}" alt="">`;
        } else {
            postEditPreview.innerHTML = '<span class="direct-post-placeholder">画像を選択</span>';
        }
    }

    // 确保显示区域可见
    const caption = document.getElementById('postDetailCaption');
    const imageContainer = document.getElementById('postDetailImage')?.closest('.modal-image');
    const dateRow = postDetailModal?.querySelector('.modal-date-row');
    const ownerActions = document.getElementById('postDetailOwnerActions');
    if (caption) caption.style.display = 'block';
    if (imageContainer) imageContainer.style.display = 'block';
    if (dateRow) dateRow.style.display = 'flex';
    if (ownerActions) ownerActions.classList.add('active');

    togglePostEdit(!!editMode);
    postDetailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePostDetail() {
    if (!postDetailModal) return;
    postDetailModal.classList.remove('active');
    document.body.style.overflow = '';
    currentDetailPost = null;
    togglePostEdit(false);
}

// ===== 投稿詳細コメント =====
async function loadPostDetailComments(postId) {
    if (!postDetailCommentsList) return;
    postDetailCommentsList.innerHTML = '<p style="color:#999;font-size:0.85rem;">読み込み中...</p>';

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
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!comments || comments.length === 0) {
            postDetailCommentsList.innerHTML = '<p style="color:#999;font-size:0.85rem;">まだコメントはありません</p>';
            return;
        }

        postDetailCommentsList.innerHTML = comments.map(comment => {
            const profile = comment.profiles || {};
            const catType = profile.primary_cat_type || 'explorer';
            const avatarUrl = profile.avatar_url || `images/cats-svg/${catType.charAt(0).toUpperCase() + catType.slice(1)}Cat.svg`;
            const isOwner = currentUser && comment.user_id === currentUser.id;
            return `
                <div class="comment-item">
                    <img src="${avatarUrl}" class="comment-avatar" alt="">
                    <div class="comment-content">
                        <div class="comment-author">${profile.username || '匿名'}</div>
                        <div class="comment-text">${comment.content}</div>
                        ${isOwner ? `<button class="comment-delete-btn" data-id="${comment.id}">削除</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        postDetailCommentsList.querySelectorAll('.comment-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
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
                    await loadPostDetailComments(postId);
                } catch (error) {
                    console.error('コメント削除エラー:', error);
                    alert('コメントの削除に失敗しました');
                }
            });
        });
    } catch (error) {
        console.error('コメント取得エラー:', error);
        postDetailCommentsList.innerHTML = '<p style="color:#999;font-size:0.85rem;">コメントの取得に失敗しました</p>';
    }
}

async function handlePostDetailCommentSubmit() {
    if (!currentDetailPost || !currentUser) {
        alert('ログインが必要です。');
        return;
    }

    const content = postDetailCommentInput?.value.trim();
    if (!content) return;

    try {
        const { error } = await supabaseClient
            .from('comments')
            .insert({
                post_id: currentDetailPost.id,
                user_id: currentUser.id,
                content
            });

        if (error) throw error;

        postDetailCommentInput.value = '';
        await loadPostDetailComments(currentDetailPost.id);
    } catch (error) {
        console.error('コメント投稿エラー:', error);
        alert('コメントの送信に失敗しました');
    }
}

async function handlePostDetailLike() {
    if (!currentDetailPost || !currentUser || !postDetailLikeBtn || !postDetailLikeCount) return;

    const isLiked = postDetailLikeBtn.classList.contains('liked');
    let currentCount = parseInt(postDetailLikeCount.textContent) || 0;

    try {
        if (isLiked) {
            await supabaseClient
                .from('likes')
                .delete()
                .eq('post_id', currentDetailPost.id)
                .eq('user_id', currentUser.id);
            currentCount = Math.max(0, currentCount - 1);
            postDetailLikeBtn.classList.remove('liked');
        } else {
            await supabaseClient
                .from('likes')
                .insert({
                    post_id: currentDetailPost.id,
                    user_id: currentUser.id
                });
            currentCount = currentCount + 1;
            postDetailLikeBtn.classList.add('liked');
        }

        postDetailLikeCount.textContent = currentCount;

        // ローカル更新
        currentDetailPost.likes_count = currentCount;
        renderMyPosts();
    } catch (error) {
        console.error('いいねエラー:', error);
    }
}

function togglePostEdit(isEdit) {
    if (!postDetailEdit) return;
    
    const caption = document.getElementById('postDetailCaption');
    const imageContainer = document.getElementById('postDetailImage')?.closest('.modal-image');
    const dateRow = postDetailModal?.querySelector('.modal-date-row');
    const ownerActions = document.getElementById('postDetailOwnerActions');
    
    if (isEdit) {
        // 编辑模式：隐藏显示区域，显示编辑区域
        postDetailEdit.classList.add('active');
        if (ownerActions) ownerActions.classList.remove('active');
        
        // 确保编辑表单的值是最新的
        if (postEditCaption && currentDetailPost) {
            postEditCaption.value = currentDetailPost.caption || '';
        }
        
        // 隐藏显示区域
        if (caption) caption.style.display = 'none';
        if (imageContainer) imageContainer.style.display = 'none';
        if (dateRow) dateRow.style.display = 'none';
        
        // 聚焦到 textarea
        setTimeout(() => {
            if (postEditCaption) {
                postEditCaption.focus();
                const length = postEditCaption.value.length;
                postEditCaption.setSelectionRange(length, length);
            }
        }, 100);
    } else {
        // 非编辑模式：显示显示区域，隐藏编辑区域
        postDetailEdit.classList.remove('active');
        
        if (caption) caption.style.display = 'block';
        if (imageContainer) imageContainer.style.display = 'block';
        if (dateRow) dateRow.style.display = 'flex';
        if (ownerActions) ownerActions.classList.add('active');
    }
}

function handlePostEditImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        postEditImageData = event.target.result;
        if (postEditPreview) {
            postEditPreview.innerHTML = `<img src="${postEditImageData}" alt="">`;
        }
    };
    reader.readAsDataURL(file);
}

async function savePostEdits() {
    if (!currentDetailPost) return;

    const newCaption = postEditCaption.value.trim();
    const updatePayload = {
        caption: newCaption || null
    };
    if (postEditImageData) {
        updatePayload.share_image_url = postEditImageData;
    }

    try {
        const { error } = await supabaseClient
            .from('posts')
            .update(updatePayload)
            .eq('id', currentDetailPost.id);

        if (error) throw error;

        // 更新ローカル
        currentDetailPost.caption = updatePayload.caption;
        if (postEditImageData) {
            currentDetailPost.share_image_url = postEditImageData;
        }

        renderMyPosts();
        updateStats();
        closePostDetail();
        alert('投稿を更新しました');
    } catch (error) {
        console.error('投稿更新エラー:', error);
        alert('投稿の更新に失敗しました');
    }
}

let editAvatarData = null;

function openEditModal() {
    // 预填充当前值
    document.getElementById('editName').value = userProfile?.username || '';
    
    // 预填充头像
    const editAvatarPreview = document.getElementById('editAvatarPreview');
    if (editAvatarPreview && userProfile?.avatar_url) {
        editAvatarPreview.src = userProfile.avatar_url;
    } else if (editAvatarPreview) {
        const type = userProfile?.primary_cat_type || 'explorer';
        editAvatarPreview.src = catTypes[type]?.image || 'images/cats-svg/ExplorerCat.svg';
    }
    editAvatarData = null;
    
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    editAvatarData = null;
}

function initEditAvatarHandlers() {
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    const editAvatarInput = document.getElementById('editAvatarInput');
    const editAvatarPreview = document.getElementById('editAvatarPreview');

    if (editAvatarBtn && editAvatarInput) {
        editAvatarBtn.addEventListener('click', () => {
            editAvatarInput.click();
        });
    }

    if (editAvatarInput) {
        editAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('画像ファイルを選択してください。');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                // 压缩图片
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_SIZE = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    editAvatarData = canvas.toDataURL('image/jpeg', 0.8);
                    if (editAvatarPreview) {
                        editAvatarPreview.src = editAvatarData;
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
}

// ===== プロフィール保存 =====
async function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    
    if (!name) {
        alert('ニックネームを入力してください');
        return;
    }

    const updatePayload = {
        username: name,
        updated_at: new Date().toISOString()
    };

    // 如果有新头像，添加到更新数据中
    if (editAvatarData) {
        updatePayload.avatar_url = editAvatarData;
    }

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(updatePayload)
            .eq('id', currentUser.id)
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // ローカルデータを更新
        userProfile.username = name;
        if (editAvatarData) {
            userProfile.avatar_url = editAvatarData;
        }
        
        // 表示を更新
        renderProfile();
        renderHistory();
        closeEditModal();
        
        alert('プロフィールを更新しました');
    } catch (error) {
        console.error('プロフィール更新エラー:', error);
        alert('プロフィールの更新に失敗しました');
    }
}

// ===== 削除確認 =====
let postToDelete = null;

function confirmDeletePost(postId) {
    postToDelete = postId;
    confirmModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
    confirmModal.classList.remove('active');
    document.body.style.overflow = '';
    postToDelete = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmDelete');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!postToDelete) return;

            try {
                const { error } = await supabaseClient
                    .from('posts')
                    .delete()
                    .eq('id', postToDelete);

                if (error) throw error;

                // ローカルデータから削除
                userPosts = userPosts.filter(p => p.id !== postToDelete);
                renderMyPosts();
                updateStats();
                closeConfirmModal();
                
                alert('投稿を削除しました');
            } catch (error) {
                console.error('削除エラー:', error);
                alert('投稿の削除に失敗しました');
            }
        });
    }
});

// ===== メインタイプ設定 =====
async function setMainType(type) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                primary_cat_type: type,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // ローカルデータを更新
        userProfile.primary_cat_type = type;
        
        // 表示を更新
        renderProfile();
        renderHistory();
        
        alert('表示タイプを変更しました');
    } catch (error) {
        console.error('タイプ更新エラー:', error);
        alert('タイプの変更に失敗しました');
    }
}

// ===== 投稿編集 =====
function editPost(postId) {
    openPostDetail(postId, true);
}

// ===== ログアウト =====
function initLogoutButton() {
    // ログアウトボタンがあれば初期化
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }
}

// ===== ユーティリティ =====
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}
