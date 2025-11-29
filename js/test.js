// 当前页面状态
let currentPage = 1;
const totalPages = 6; // 增加了一页Profile设置
let isTransitioning = false; // 防止动画期间重复切换

// 存储用户的答案
const answers = {};
let userProfile = {
    name: '',
    avatar: null // Base64 string
};

// DOM元素
const questionPages = document.querySelectorAll('.question-page');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const nextBtnText = document.getElementById('nextBtnText');
const indicatorDots = document.querySelectorAll('.indicator-dot');
const ratingCircles = document.querySelectorAll('.rating-circle');
// Profile页元素
const avatarUpload = document.getElementById('avatarUpload');
const fileInput = document.getElementById('fileInput');
const avatarPreview = document.getElementById('avatarPreview');
const catNameInput = document.getElementById('catName');

// 初始化
function init() {
    updateNavigation();
    attachEventListeners();
    restoreAnsweredStates();
    initProfileHandlers();
}

// Profile页面事件处理
function initProfileHandlers() {
    if (!avatarUpload || !fileInput) return;

    avatarUpload.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);
    
    catNameInput.addEventListener('input', (e) => {
        userProfile.name = e.target.value.trim();
    });
}

// 处理文件选择与压缩
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 简单的文件类型检查
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // 压缩图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置最大尺寸
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

            // 转换为Base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            userProfile.avatar = dataUrl;

            // 显示预览
            avatarPreview.style.backgroundImage = `url(${dataUrl})`;
            avatarPreview.innerHTML = ''; // 清除提示文字
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}


// 恢复已回答题目的状态
function restoreAnsweredStates() {
    // 遍历所有已保存的答案
    Object.keys(answers).forEach(questionNum => {
        const value = answers[questionNum];
        
        // 找到对应的圆圈并设置选中状态
        const selectedCircle = document.querySelector(
            `.rating-circle[data-question="${questionNum}"][data-value="${value}"]`
        );
        
        if (selectedCircle) {
            selectedCircle.classList.add('selected');
            
            // 为题目添加 answered 类，使其透明度降低
            const questionItem = selectedCircle.closest('.question-item');
            if (questionItem) {
                questionItem.classList.add('answered');
            }
        }
    });
}

// 附加事件监听器
function attachEventListeners() {
    // 评分圆点点击事件
    ratingCircles.forEach(circle => {
        circle.addEventListener('click', handleRatingClick);
    });

    // 导航按钮点击事件
    prevBtn.addEventListener('click', goToPreviousPage);
    nextBtn.addEventListener('click', goToNextPage);

    // 分页指示器点击事件
    indicatorDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            if (isTransitioning) return; // 动画期间禁用点击
            const targetPage = parseInt(e.target.dataset.page);
            goToPage(targetPage);
        });
    });
}

// 处理评分圆点点击
function handleRatingClick(e) {
    const circle = e.currentTarget;
    const questionNum = circle.dataset.question;
    const value = parseInt(circle.dataset.value);

    // 保存答案
    answers[questionNum] = value;

    // 移除同一题目的其他选中状态
    const allCirclesForQuestion = document.querySelectorAll(
        `.rating-circle[data-question="${questionNum}"]`
    );
    allCirclesForQuestion.forEach(c => c.classList.remove('selected'));

    // 添加当前选中状态
    circle.classList.add('selected');

    // 为题目添加 answered 类，使其透明度降低
    const questionItem = circle.closest('.question-item');
    if (questionItem) {
        questionItem.classList.add('answered');
    }

    // 添加点击动画
    circle.style.transform = 'scale(1.2)';
    setTimeout(() => {
        circle.style.transform = '';
    }, 200);
}

// 切换到指定页面
function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages || isTransitioning) return;

    // 找到当前活动页面
    const currentActivePage = document.querySelector('.question-page.active');
    const targetPage = document.querySelector(`.question-page[data-page="${pageNum}"]`);

    if (!targetPage) return;

    // 设置转换状态，禁用按钮
    isTransitioning = true;
    disableNavigationButtons();

    // 如果有当前页面，先添加退出动画
    if (currentActivePage) {
        currentActivePage.classList.add('exiting');
        
        // 等待退出动画完成后再显示新页面
        setTimeout(() => {
            currentActivePage.classList.remove('active', 'exiting');
            
            // 显示新页面
            targetPage.classList.add('active');
            
            // 动画完成后解除转换状态
            setTimeout(() => {
                isTransitioning = false;
                enableNavigationButtons();
            }, 500); // 等待进入动画完成
        }, 400); // 与 pageExit 动画时长匹配
    } else {
        // 没有当前页面，直接显示新页面
        targetPage.classList.add('active');
        setTimeout(() => {
            isTransitioning = false;
            enableNavigationButtons();
        }, 500);
    }

    // 更新当前页码
    currentPage = pageNum;

    // 更新导航和指示器
    updateNavigation();
    updateIndicator();
}

// 更新导航按钮显示
function updateNavigation() {
    // 上一页按钮
    if (currentPage === 1) {
        prevBtn.classList.remove('show');
    } else {
        prevBtn.classList.add('show');
    }

    // 下一页按钮文字
    if (currentPage === totalPages) {
        nextBtnText.textContent = '診断結果を見る'; // 第6页是结果
    } else if (currentPage === totalPages - 1) {
        nextBtnText.textContent = '次へ'; // 第5页去第6页
    } else {
        nextBtnText.textContent = '次へ';
    }
    
    // 特殊处理：第6页是Profile设置，文字可以是“跳过”如果没有填写？
    // 这里简化逻辑，最后一步总是“查看结果”，在JS里判断是否保存数据
}

// 更新分页指示器
function updateIndicator() {
    const indicatorContainer = document.querySelector('.page-indicator');
    
    // 如果是Profile页（第6页），隐藏进度条
    if (currentPage === totalPages) {
        indicatorContainer.style.opacity = '0';
        indicatorContainer.style.pointerEvents = 'none';
    } else {
        indicatorContainer.style.opacity = '1';
        indicatorContainer.style.pointerEvents = 'auto';
        
        indicatorDots.forEach(dot => {
            const dotPage = parseInt(dot.dataset.page);
            if (dotPage === currentPage) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// 前往上一页
function goToPreviousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

// 前往下一页或查看结果
function goToNextPage() {
    // 检查当前页是否回答完毕（如果是问题页）
    if (currentPage < totalPages) { // 1-5页是问题
        // 这里可以加一个简单的检查，确保当前页每道题都答了
        // 为了用户体验，可以在这里检查
        // 计算当前页应有的题目ID范围
        // Page 1: 1-3, Page 2: 4-6...
        // 简单起见，我们在showResults里做最终检查，这里允许翻页？
        // 为了严谨，还是在最后一步检查所有题目吧
    }

    if (currentPage === totalPages) {
        // 在最后一页（Profile页），显示结果
        showResults();
    } else {
        // 如果是第5页跳第6页，先检查题目是否答完
        if (currentPage === totalPages - 1) {
            const totalQuestions = 15;
            const answeredQuestions = Object.keys(answers).length;
            if (answeredQuestions < totalQuestions) {
                 alert(`まだ${totalQuestions - answeredQuestions}問回答していません。すべての質問に答えてください。`);
                 return;
            }
        }
        goToPage(currentPage + 1);
    }
}

// 显示结果
function showResults() {
    // 再次确认题目回答完整
    const totalQuestions = 15;
    const answeredQuestions = Object.keys(answers).length;

    if (answeredQuestions < totalQuestions) {
        alert(`まだ${totalQuestions - answeredQuestions}問回答していません。すべての質問に答えてください。`);
        return;
    }

    // 保存 Profile 数据到 localStorage
    if (userProfile.name || userProfile.avatar) {
        localStorage.setItem('catsonalityProfile', JSON.stringify(userProfile));
    } else {
        // 清除旧数据
        localStorage.removeItem('catsonalityProfile');
    }

    // 计算各维度分数
    // 维度计算公式：
    // Neuroticism: (Q2 + Q6 + Q10 + (6 - Q15)) / 4
    // Extraversion: (Q1 + Q7 + Q11) / 3
    // Dominance: (Q3 + Q8 + Q12) / 3
    // Impulsiveness: (Q4 + Q13) / 2
    // Agreeableness: (Q5 + Q9 + Q14) / 3

    // 辅助函数：获取题目分数，默认0以防万一
    const getScore = (q) => answers[q] || 0;

    const scores = {
        neuroticism: (getScore(2) + getScore(6) + getScore(10) + (6 - getScore(15))) / 4,
        extraversion: (getScore(1) + getScore(7) + getScore(11)) / 3,
        dominance: (getScore(3) + getScore(8) + getScore(12)) / 3,
        impulsiveness: (getScore(4) + getScore(13)) / 2,
        agreeableness: (getScore(5) + getScore(9) + getScore(14)) / 3
    };

    console.log("Calculated Scores:", scores);

    // 定义8种性格类型的理想特征向量
    // 分数范围 1-5。设定理想值：High=4.5, Low=1.5, Mid=3.0
    const types = {
        explorer: { // 高外向, 低神经质, 中支配
            name: 'explorer',
            vector: { extraversion: 4.5, neuroticism: 1.5, dominance: 3.0, impulsiveness: 3.0, agreeableness: 3.0 } 
        },
        healer: { // 高亲和, 低支配, 低冲动
            name: 'healer',
            vector: { agreeableness: 4.5, dominance: 1.5, impulsiveness: 1.5, extraversion: 3.0, neuroticism: 3.0 }
        },
        leader: { // 高支配, 高外向, 低神经质
            name: 'leader',
            vector: { dominance: 4.5, extraversion: 4.5, neuroticism: 1.5, impulsiveness: 3.0, agreeableness: 3.0 }
        },
        thinker: { // 高神经质, 高亲和, 低冲动
            name: 'thinker',
            vector: { neuroticism: 4.5, agreeableness: 4.5, impulsiveness: 1.5, extraversion: 3.0, dominance: 3.0 }
        },
        wild: { // 高冲动, 高外向, 低神经质
            name: 'wild',
            vector: { impulsiveness: 4.5, extraversion: 4.5, neuroticism: 1.5, dominance: 3.0, agreeableness: 3.0 }
        },
        solitary: { // 低外向, 低亲和, 低冲动
            name: 'solitary',
            vector: { extraversion: 1.5, agreeableness: 1.5, impulsiveness: 1.5, neuroticism: 3.0, dominance: 3.0 }
        },
        royal: { // 高支配, 高神经质, 高冲动
            name: 'royal',
            vector: { dominance: 4.5, neuroticism: 4.5, impulsiveness: 4.5, extraversion: 3.0, agreeableness: 3.0 }
        },
        guardian: { // 高亲和, 低冲动, 中外向
            name: 'guardian',
            vector: { agreeableness: 4.5, impulsiveness: 1.5, extraversion: 3.0, neuroticism: 3.0, dominance: 3.0 }
        }
    };

    // 计算欧几里得距离，找出最近的性格类型
    let minDistance = Infinity;
    let matchedType = 'explorer'; // 默认

    for (const typeKey in types) {
        const type = types[typeKey];
        let distance = 0;
        
        // 计算该类型定义的关键维度的距离
        // 如果只关注该类型定义的特定维度（如上文High/Low组合），可以只计算相关维度的距离
        // 这里为了全面，计算所有5个维度，未特别说明的维度取中值3.0参与计算，避免偏差
        for (const dim in scores) {
            const diff = scores[dim] - type.vector[dim];
            distance += diff * diff;
        }
        
        if (distance < minDistance) {
            minDistance = distance;
            matchedType = typeKey;
        }
    }

    console.log("Matched Type:", matchedType);

    // 保存结果并跳转
    localStorage.setItem('catsonalityResult', JSON.stringify({
        scores: scores,
        type: matchedType
    }));

    // 跳转到结果页面
    window.location.href = `result.html?type=${matchedType}`;
}

// 禁用导航按钮
function disableNavigationButtons() {
    prevBtn.classList.add('disabled');
    nextBtn.classList.add('disabled');
}

// 启用导航按钮
function enableNavigationButtons() {
    prevBtn.classList.remove('disabled');
    nextBtn.classList.remove('disabled');
}

// 键盘导航支持
document.addEventListener('keydown', (e) => {
    if (isTransitioning) return; // 动画期间禁用键盘导航
    
    if (e.key === 'ArrowLeft' && currentPage > 1) {
        goToPreviousPage();
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        goToNextPage();
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

