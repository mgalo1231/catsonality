// 当前页面状态
let currentPage = 1;
const totalPages = 5;

// 存储用户的答案
const answers = {};

// DOM元素
const questionPages = document.querySelectorAll('.question-page');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const nextBtnText = document.getElementById('nextBtnText');
const indicatorDots = document.querySelectorAll('.indicator-dot');
const ratingCircles = document.querySelectorAll('.rating-circle');

// 初始化
function init() {
    updateNavigation();
    attachEventListeners();
    restoreAnsweredStates();
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
    if (pageNum < 1 || pageNum > totalPages) return;

    // 移除所有页面的active类
    questionPages.forEach(page => {
        page.classList.remove('active');
    });

    // 添加active类到目标页面
    const targetPage = document.querySelector(`.question-page[data-page="${pageNum}"]`);
    if (targetPage) {
        targetPage.classList.add('active');
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
        nextBtnText.textContent = '結果を見る';
    } else {
        nextBtnText.textContent = '次へ';
    }
}

// 更新分页指示器
function updateIndicator() {
    indicatorDots.forEach(dot => {
        const dotPage = parseInt(dot.dataset.page);
        if (dotPage === currentPage) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// 前往上一页
function goToPreviousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

// 前往下一页或查看结果
function goToNextPage() {
    if (currentPage === totalPages) {
        // 在最后一页，显示结果
        showResults();
    } else {
        goToPage(currentPage + 1);
    }
}

// 显示结果（跳转到结果页面或显示结果）
function showResults() {
    // 检查是否所有题目都已回答
    const totalQuestions = 15;
    const answeredQuestions = Object.keys(answers).length;

    if (answeredQuestions < totalQuestions) {
        alert(`まだ${totalQuestions - answeredQuestions}問回答していません。すべての質問に答えてください。`);
        return;
    }

    // 保存答案到localStorage（可选）
    localStorage.setItem('catsonalityAnswers', JSON.stringify(answers));

    // 跳转到结果页面（暂时显示alert，后续可以实现result.html）
    alert('診断が完了しました！結果ページへ移動します。\n\n現在の回答数：' + answeredQuestions);
    
    // TODO: 后续可以跳转到结果页面
    // window.location.href = 'result.html';
}

// 键盘导航支持
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
        goToPreviousPage();
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        goToNextPage();
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

