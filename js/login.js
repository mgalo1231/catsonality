// ===== 認証ページのロジック =====

// 現在のモード（login または register）
let currentMode = 'login';

// アバター画像データ
let avatarData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // URLパラメータをチェックして、mode=registerなら登録モードに切り替え
    const urlParams = new URLSearchParams(window.location.search);
    const isRegisterMode = urlParams.get('mode') === 'register';

    // 既にログイン済みならリダイレクト（登録モードは除外）
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user && !isRegisterMode) {
        // 保存されたリダイレクト先があればそこへ、なければマイページへ
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        } else {
            window.location.href = 'mypage.html';
        }
        return;
    }
    if (user && isRegisterMode) {
        // 登録モードで来た場合は一旦ログアウトして登録できるようにする
        await supabaseClient.auth.signOut();
    }

    const loginToggle = document.getElementById('loginToggle');
    const registerToggle = document.getElementById('registerToggle');
    const loginCard = document.getElementById('loginCard');
    const profileSection = document.getElementById('profileSection');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const welcomeText = document.getElementById('welcomeText');
    const submitBtn = document.getElementById('submitBtn');
    const form = document.querySelector('.login-form');
    
    // 头像上传相关
    const avatarUpload = document.getElementById('avatarUpload');
    const fileInput = document.getElementById('fileInput');
    const avatarPreview = document.getElementById('avatarPreview');

    // 检查必要的元素是否存在
    if (!loginToggle || !registerToggle || !loginCard || !profileSection || 
        !confirmPasswordGroup || !welcomeText || !submitBtn) {
        console.error('必要な要素が見つかりません');
        return;
    }

    // 切换到注册模式的函数
    function switchToRegisterMode() {
        currentMode = 'register';
        
        // 按钮状态
        loginToggle.classList.remove('active');
        registerToggle.classList.add('active');
        
        // 卡片样式
        loginCard.classList.add('register-mode');
        
        // 显示元素
        profileSection.style.display = 'flex';
        confirmPasswordGroup.style.display = 'flex';
        welcomeText.style.display = 'block';
        
        // 更新文字
        submitBtn.textContent = '新規登録するにゃ';
    }

    // 切换到登录模式的函数
    function switchToLoginMode() {
        currentMode = 'login';
        
        // 按钮状态
        registerToggle.classList.remove('active');
        loginToggle.classList.add('active');
        
        // 卡片样式
        loginCard.classList.remove('register-mode');
        
        // 隐藏元素
        profileSection.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        welcomeText.style.display = 'none';
        
        // 更新文字
        submitBtn.textContent = 'ログインするにゃ';
    }

    // 如果URL参数指定了注册模式，自动切换
    if (isRegisterMode) {
        // 自動的に登録モードに切り替え
        switchToRegisterMode();
    }

    // 切换到注册模式
    registerToggle.addEventListener('click', (e) => {
        e.preventDefault();
        switchToRegisterMode();
    });

    // 切换到登录模式
    loginToggle.addEventListener('click', (e) => {
        e.preventDefault();
        switchToLoginMode();
    });

    // 头像上传预览
    if (avatarUpload && fileInput) {
        avatarUpload.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('画像ファイルを選択してください。');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                // 保存 Base64 以便写入数据库
                avatarData = event.target.result;
                // 显示预览
                avatarPreview.style.backgroundImage = `url(${event.target.result})`;
                avatarPreview.innerHTML = ''; // 清除提示文字
                avatarUpload.style.borderStyle = 'solid';
                avatarUpload.style.borderColor = '#FE7EB1';
            };
            reader.readAsDataURL(file);
        });
    }

    // 从诊断结果读取用户填写的名字和头像，预填充到注册表单
    prefillFromTestResult(avatarPreview, avatarUpload);

    // フォーム送信処理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showError('メールアドレスとパスワードを入力してください。');
            return;
        }

        // ボタンを無効化
        submitBtn.disabled = true;
        submitBtn.textContent = '処理中...';

        try {
            if (currentMode === 'register') {
                await handleRegister(email, password);
            } else {
                await handleLogin(email, password);
            }
        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = currentMode === 'register' ? '新規登録するにゃ' : 'ログインするにゃ';
        }
    });
});

// ===== ログイン処理 =====
async function handleLogin(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw new Error(getErrorMessage(error));
    }

    console.log('ログイン成功:', data.user.email);
    
    // 保存されたリダイレクト先があればそこへ、なければマイページへ
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    } else {
        window.location.href = 'mypage.html';
    }
}

// ===== 新規登録処理 =====
async function handleRegister(email, password) {
    const confirmPassword = document.getElementById('confirmPassword').value;
    const catName = document.getElementById('catName').value.trim();

    // パスワード確認
    if (password !== confirmPassword) {
        throw new Error('パスワードが一致しません。');
    }

    if (password.length < 6) {
        throw new Error('パスワードは6文字以上で入力してください。');
    }

    // 診断結果を取得
    const savedResult = localStorage.getItem('catsonalityResult');
    let testResult = null;
    let userProfileData = null;
    
    if (savedResult) {
        const parsed = JSON.parse(savedResult);
        testResult = {
            type: parsed.type,
            scores: parsed.scores
        };
        userProfileData = parsed.userProfile;
    }

    // 1. Supabase Auth でユーザー作成
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (authError) {
        throw new Error(getErrorMessage(authError));
    }

    const user = authData.user;
    console.log('ユーザー作成成功:', user.id);

    // 2. プロフィールを作成（診断結果のタイプとアバターを含む）
    const username = catName || userProfileData?.name || `ねこ${Math.floor(Math.random() * 10000)}`;
    const avatarUrl = avatarData || userProfileData?.avatar || null;
    const primaryCatType = testResult?.type || null;
    
    const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
            id: user.id,
            username: username,
            avatar_url: avatarUrl,
            primary_cat_type: primaryCatType
        });

    if (profileError) {
        console.error('プロフィール作成エラー:', profileError);
    }

    // 3. 診断結果を保存
    let redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (testResult && !redirectUrl) {
        const { error: resultError } = await supabaseClient
            .from('results')
            .insert({
                user_id: user.id,
                cat_type: testResult.type,
                cat_name: username,
                cat_avatar: avatarUrl,
                scores: testResult.scores
            });

        if (resultError) {
            console.error('診断結果保存エラー:', resultError);
        } else {
            console.log('診断結果を保存しました');
            // 清除localStorage中的测试结果，避免重复保存
            localStorage.removeItem('catsonalityResult');
            localStorage.removeItem('catsonalityProfile');
        }
    }

    console.log('登録完了！');
    
    // 保存されたリダイレクト先があればそこへ、なければマイページへ
    // redirectUrl は上で既に取得済み
    if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    } else {
        window.location.href = 'mypage.html';
    }
}

// ===== 診断結果から名前・アバターを読み込んで予填充 =====
function prefillFromTestResult(avatarPreview, avatarUpload) {
    try {
        const savedResult = localStorage.getItem('catsonalityResult');
        if (!savedResult) return;

        const { userProfile } = JSON.parse(savedResult);
        if (!userProfile) return;

        // 名前を予填充
        const catNameInput = document.getElementById('catName');
        if (catNameInput && userProfile.name) {
            catNameInput.value = userProfile.name;
        }

        // アバターを予填充
        if (avatarPreview && userProfile.avatar) {
            avatarPreview.style.backgroundImage = `url(${userProfile.avatar})`;
            avatarPreview.innerHTML = ''; // プレースホルダーテキストを消す
            if (avatarUpload) {
                avatarUpload.style.borderStyle = 'solid';
                avatarUpload.style.borderColor = '#FE7EB1';
            }
            // Base64データを保存（登録時に使用）
            avatarData = userProfile.avatar;
        }

        console.log('診断結果からプロフィールを読み込みました:', userProfile.name);
    } catch (error) {
        console.error('プロフィール読み込みエラー:', error);
    }
}

// ===== エラーメッセージの日本語化 =====
function getErrorMessage(error) {
    const messages = {
        'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません。',
        'Email not confirmed': 'メールアドレスの確認が必要です。',
        'User already registered': 'このメールアドレスは既に登録されています。',
        'Password should be at least 6 characters': 'パスワードは6文字以上で入力してください。',
        'Unable to validate email address: invalid format': 'メールアドレスの形式が正しくありません。'
    };

    return messages[error.message] || error.message;
}

// ===== エラー表示 =====
function showError(message) {
    // 既存のエラーを削除
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // エラーメッセージを作成
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #ffe6e6;
        color: #d63031;
        padding: 0.8rem 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        text-align: center;
    `;

    // フォームの前に挿入
    const form = document.querySelector('.login-form');
    form.insertBefore(errorDiv, form.firstChild);

    // 3秒後に自動で消える
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

