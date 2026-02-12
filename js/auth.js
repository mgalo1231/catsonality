// ===== 認証ユーティリティ =====

// 現在のユーザー情報をキャッシュ
let currentUserCache = null;
let currentProfileCache = null;

// ===== ユーザー情報取得 =====
async function getCurrentUser() {
    if (currentUserCache) return currentUserCache;
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUserCache = user;
    return user;
}

// ===== プロフィール情報取得 =====
async function getCurrentProfile() {
    if (currentProfileCache) return currentProfileCache;
    
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    currentProfileCache = profile;
    return profile;
}

// ===== ログアウト =====
async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('ログアウトエラー:', error);
        return false;
    }
    
    // キャッシュをクリア
    currentUserCache = null;
    currentProfileCache = null;
    
    // トップページへリダイレクト
    window.location.href = 'index.html';
    return true;
}

// ===== ナビゲーション更新 =====
async function updateNavigation() {
    const user = await getCurrentUser();
    const loginBtn = document.querySelector('.nav-link.login-btn') || document.querySelector('.nav-link.mypage-btn');
    
    if (!loginBtn) return;

    // マイページの場合はログアウトボタンを表示
    const isMyPage = window.location.pathname.includes('mypage.html');
    
    if (user) {
        if (isMyPage) {
            // マイページ：ログアウトボタン
            loginBtn.href = '#';
            loginBtn.textContent = 'ログアウト';
            loginBtn.classList.remove('mypage-btn');
            loginBtn.classList.add('login-btn');
            loginBtn.id = 'logoutBtn';
            loginBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await logout();
            });
        } else {
            // 他のページ：マイページリンクに変更（アバター+名前）
            const profile = await getCurrentProfile();
            const displayName = profile?.username || 'マイページ';
            let avatarUrl = profile?.avatar_url;

            if (!avatarUrl && profile?.primary_cat_type) {
                const type = profile.primary_cat_type;
                avatarUrl = `images/cats-svg/${type.charAt(0).toUpperCase() + type.slice(1)}Cat.svg`;
            }
            if (!avatarUrl) {
                avatarUrl = 'images/cats-svg/ExplorerCat.svg';
            }
            
            loginBtn.href = 'mypage.html';
            loginBtn.classList.remove('login-btn');
            loginBtn.classList.add('mypage-btn');
            loginBtn.innerHTML = '';

            const avatarImg = document.createElement('img');
            avatarImg.src = avatarUrl;
            avatarImg.alt = '';
            avatarImg.className = 'nav-avatar';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'nav-name';
            nameSpan.textContent = displayName;

            loginBtn.appendChild(avatarImg);
            loginBtn.appendChild(nameSpan);
        }
    } else {
        // 未ログイン：ログインボタンのまま
        loginBtn.href = 'login.html';
        loginBtn.textContent = 'ログイン';
        loginBtn.classList.add('login-btn');
        loginBtn.classList.remove('mypage-btn');
    }
}

// ===== 認証状態の変化を監視 =====
supabaseClient.auth.onAuthStateChange((event, session) => {
    // キャッシュをクリア
    currentUserCache = session?.user || null;
    currentProfileCache = null;
    
    // ナビゲーションを更新
    updateNavigation();
});

// ===== ページ読み込み時にナビゲーションを更新 =====
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    updateHeaderOverlay();
});

// ===== ナビの背景制御 =====
function updateHeaderOverlay() {
    const header = document.querySelector('.header');
    if (!header) return;

    const shouldOverlay = window.scrollY > 0;
    header.classList.toggle('nav-overlay', shouldOverlay);
}

window.addEventListener('scroll', () => {
    updateHeaderOverlay();
});

// ===== ログインが必要な機能のチェック =====
async function requireAuth(callback) {
    const user = await getCurrentUser();
    if (user) {
        callback();
    } else {
        // ログインプロンプトを表示
        showLoginPrompt();
    }
}

// ===== ログインプロンプト表示 =====
function showLoginPrompt() {
    const modal = document.getElementById('loginPromptModal') || document.getElementById('loginPrompt');
    if (modal) {
        modal.classList.add('active');
    } else {
        // モーダルがない場合は直接ログインページへ
        if (confirm('この機能を使うにはログインが必要です。ログインページへ移動しますか？')) {
            window.location.href = 'login.html';
        }
    }
}
