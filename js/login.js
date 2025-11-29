document.addEventListener('DOMContentLoaded', () => {
    const loginToggle = document.getElementById('loginToggle');
    const registerToggle = document.getElementById('registerToggle');
    const loginCard = document.getElementById('loginCard');
    const profileSection = document.getElementById('profileSection');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const welcomeText = document.getElementById('welcomeText');
    const submitBtn = document.getElementById('submitBtn');
    
    // 头像上传相关
    const avatarUpload = document.getElementById('avatarUpload');
    const fileInput = document.getElementById('fileInput');
    const avatarPreview = document.getElementById('avatarPreview');

    // 切换到注册模式
    registerToggle.addEventListener('click', () => {
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
    });

    // 切换到登录模式
    loginToggle.addEventListener('click', () => {
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
                // 显示预览
                avatarPreview.style.backgroundImage = `url(${event.target.result})`;
                avatarPreview.innerHTML = ''; // 清除提示文字
                avatarUpload.style.borderStyle = 'solid';
                avatarUpload.style.borderColor = '#FE7EB1';
            };
            reader.readAsDataURL(file);
        });
    }
});

