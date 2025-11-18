// 主應用邏輯
class FoodPickerApp {
    constructor() {
        this.currentSelection = {
            type: null,
            category: null,
            fullType: null
        };
        
        this.deferredPrompt = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 應用初始化開始...');
            
            // 初始化資料庫
            await foodDB.init();
            
            // 初始化UI
            this.initUI();
            this.setupEventListeners();
            this.setupPWA();
            
            // 載入食物列表
            await this.loadFoods();
            
            console.log('✅ 應用初始化完成');
        } catch (error) {
            console.error('❌ 應用初始化失敗:', error);
            this.showNotification('應用初始化失敗，請重新整理頁面', 'error');
        }
    }

    // 檢測裝置平台
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        // 檢測 iOS
        const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
                      (/mac/.test(platform) && navigator.maxTouchPoints > 1);
        
        // 檢測 Android
        const isAndroid = /android/.test(userAgent);
        
        console.log('📱 平台檢測結果:', { 
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            isIOS, 
            isAndroid 
        });
        
        return {
            isIOS,
            isAndroid,
            isOther: !isIOS && !isAndroid
        };
    }

    // 設定平台指引
    setupPlatformGuide() {
        const platform = this.detectPlatform();
        const iosGuide = document.getElementById('ios-install-guide');
        const androidGuide = document.getElementById('android-install-guide');
        const installBtn = document.getElementById('install-btn');
        
        console.log('🛠️ 設定平台指引:', platform);
        
        // 重置顯示狀態
        if (iosGuide) iosGuide.style.display = 'none';
        if (androidGuide) androidGuide.style.display = 'none';
        if (installBtn) installBtn.style.display = 'none';
        
        // 根據平台顯示指引
        if (platform.isIOS) {
            console.log('🍎 檢測到 iOS 設備');
            if (iosGuide) {
                iosGuide.style.display = 'block';
                iosGuide.classList.add('ios-guide');
            }
            if (installBtn) {
                installBtn.style.display = 'none';
            }
        } else if (platform.isAndroid) {
            console.log('🤖 檢測到 Android 設備');
            if (androidGuide) {
                androidGuide.style.display = 'block';
                androidGuide.classList.add('android-guide');
            }
            if (installBtn && this.deferredPrompt) {
                installBtn.style.display = 'flex';
            }
        } else {
            console.log('💻 檢測到其他平台');
            if (iosGuide) {
                iosGuide.style.display = 'block';
                iosGuide.classList.add('ios-guide');
            }
            if (androidGuide) {
                androidGuide.style.display = 'block';
                androidGuide.classList.add('android-guide');
            }
            if (installBtn && this.deferredPrompt) {
                installBtn.style.display = 'flex';
            }
        }
        
        this.showPlatformHint(platform);
    }

    // 顯示平台提示
    showPlatformHint(platform) {
        console.log('💡 顯示平台提示:', platform);
        
        // 移除現有提示
        const existingHint = document.querySelector('.platform-hint');
        if (existingHint) {
            existingHint.remove();
        }
        
        const sharePage = document.getElementById('share-page');
        if (!sharePage) {
            console.warn('❌ 找不到分享頁面');
            return;
        }
        
        const hint = document.createElement('div');
        
        if (platform.isIOS) {
            hint.className = 'platform-hint ios';
            hint.innerHTML = `
                <i class="fas fa-apple"></i>
                <strong>檢測到 iOS 設備：</strong>請使用 Safari 的「加入主畫面」功能安裝
            `;
            console.log('📱 顯示 iOS 安裝指引');
        } else if (platform.isAndroid) {
            hint.className = 'platform-hint android';
            hint.innerHTML = `
                <i class="fab fa-android"></i>
                <strong>檢測到 Android 設備：</strong>點擊「安裝App」按鈕或等待瀏覽器提示
            `;
            console.log('🤖 顯示 Android 安裝指引');
        } else {
            hint.className = 'platform-hint';
            hint.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <strong>提示：</strong>請用手機瀏覽器訪問此頁面以安裝App
            `;
            console.log('💻 顯示通用安裝指引');
        }
        
        // 安全地插入到分享頁面頂部
        const firstCard = sharePage.querySelector('.share-card');
        if (firstCard && firstCard.parentNode === sharePage) {
            sharePage.insertBefore(hint, firstCard);
        } else {
            // 如果找不到合適的插入位置，添加到開頭
            sharePage.insertBefore(hint, sharePage.firstChild);
            console.log('使用備用插入方式');
        }
    }

  initUI() {
    console.log('🎨 初始化 UI...');
    
    // 初始化步驟3狀態
    this.resetStep3State();
    
    // 檢查必要元素
    const checkElements = ['meal-options', 'snack-options', 'qrcode'];
    checkElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`元素 ${id}:`, element ? '✅ 找到' : '❌ 未找到');
    });
    
    this.initOptionCards();
    this.generateQRCode();
    console.log('✅ UI 初始化完成');
}

    // 初始化選項卡片
    initOptionCards() {
        const mealCategories = [
            { id: 'rice', name: '飯類', icon: 'fas fa-bowl-rice', type: 'meal-rice' },
            { id: 'noodle', name: '麵類', icon: 'fas fa-utensils', type: 'meal-noodle' },
            { id: 'other', name: '其他', icon: 'fas fa-hamburger', type: 'meal-other' }
        ];

        const snackCategories = [
            { id: 'sweet', name: '甜食', icon: 'fas fa-cookie', type: 'snack-sweet' },
            { id: 'salty', name: '鹹食', icon: 'fas fa-bacon', type: 'snack-salty' },
            { id: 'drink', name: '飲品', icon: 'fas fa-glass-whiskey', type: 'snack-drink' }
        ];

        this.renderOptionCards('meal-options', mealCategories);
        this.renderOptionCards('snack-options', snackCategories);
    }

    renderOptionCards(containerId, categories) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`❌ 找不到容器: ${containerId}`);
            return;
        }
        
        container.innerHTML = '';

        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.dataset.value = cat.id;
            card.dataset.type = cat.type;
            card.innerHTML = `
                <div class="option-icon">
                    <i class="${cat.icon}"></i>
                </div>
                <div class="option-name">${cat.name}</div>
            `;
            container.appendChild(card);
        });
    }

    // 設定事件監聽
    setupEventListeners() {
        console.log('🎯 開始設定事件監聽器...');
        
        // 標籤頁切換 - 安全檢查
        const tabs = document.querySelectorAll('.tab');
        if (tabs.length === 0) {
            console.warn('❌ 未找到標籤頁元素');
            return;
        }
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 選項卡片點擊
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option-card')) {
                const card = e.target.closest('.option-card');
                const parent = card.parentElement;
                
                // 移除同層級的其他卡片的選中狀態
                Array.from(parent.children).forEach(child => {
                    child.classList.remove('selected');
                });
                
                // 選中當前卡片
                card.classList.add('selected');
                
                // 更新按鈕狀態
                if (parent.parentElement.id === 'step1') {
                    this.currentSelection.type = card.dataset.value;
                    document.getElementById('next1').disabled = false;
                } else {
                    this.currentSelection.category = card.dataset.value;
                    this.currentSelection.fullType = card.dataset.type;
                    document.getElementById('next2').disabled = false;
                }
            }
        });

        // 按鈕事件 - 逐個檢查
        const buttons = [
            { id: 'next1', method: () => this.goToStep(2) },
        { id: 'next2', method: () => this.goToStep(3) }, // 只是切換到步驟3，不開始抽獎
        { id: 'back1', method: () => this.goToStep(1) },
        { id: 'back2', method: () => this.goToStep(2) },
        { id: 'reset', method: () => this.startLottery() }, // 點擊「再抽一次」才開始抽獎
            { id: 'add-food', method: () => this.addFood() },
            { id: 'install-btn', method: () => this.installPWA() },
            { id: 'share-link-btn', method: () => this.shareLink() }
        ];

        buttons.forEach(btnConfig => {
            const button = document.getElementById(btnConfig.id);
            if (button) {
                button.addEventListener('click', btnConfig.method);
                console.log(`✅ 綁定按鈕: ${btnConfig.id}`);
            } else {
                console.warn(`❌ 找不到按鈕: ${btnConfig.id}`);
            }
        });

        // 食物名稱輸入框 Enter 事件
        const foodNameInput = document.getElementById('food-name');
        if (foodNameInput) {
            foodNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addFood();
            });
        } else {
            console.warn('❌ 找不到食物名稱輸入框');
        }

        console.log('✅ 事件監聽器設定完成');
    }

    // 切換標籤頁
    switchTab(tabName) {
        console.log(`🔄 切換到標籤頁: ${tabName}`);
        
        // 更新活躍標籤
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // 顯示對應頁面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`${tabName}-page`).classList.add('active');
        
        // 如果切換到分享頁面，設置平台指引
        if (tabName === 'share') {
            setTimeout(() => {
                this.setupPlatformGuide();
            }, 100);
        }
    }

    // 切換步驟
    
g// 切換步驟
goToStep(step) {
    console.log(`🔄 切換到步驟: ${step}`, '當前選擇:', this.currentSelection);
    
    // 確保所有步驟都隱藏
    const steps = document.querySelectorAll('#picker-page .step');
    steps.forEach(stepElement => {
        stepElement.classList.remove('active');
        console.log(`❌ 隱藏步驟: ${stepElement.id}`);
    });
    
    // 顯示當前步驟
    const currentStep = document.getElementById(`step${step}`);
    if (currentStep) {
        currentStep.classList.add('active');
        console.log(`✅ 顯示步驟: ${currentStep.id}`);
    }
    
    // 步驟2的特殊處理
    if (step === 2) {
        const mealOptions = document.getElementById('meal-options');
        const snackOptions = document.getElementById('snack-options');
        
        console.log('步驟2 - 顯示對應選項:', this.currentSelection.type);
        
        if (this.currentSelection.type === 'meal') {
            if (mealOptions) mealOptions.style.display = 'flex';
            if (snackOptions) snackOptions.style.display = 'none';
            console.log('🍽️ 顯示正餐選項');
        } else if (this.currentSelection.type === 'snack') {
            if (mealOptions) mealOptions.style.display = 'none';
            if (snackOptions) snackOptions.style.display = 'flex';
            console.log('🍰 顯示點心選項');
        }
    }
    
    // 步驟3的特殊處理 - 重置狀態，但不自動開始抽獎
    // 步驟3的特殊處理
if (step === 3) {
    console.log('🎰 進入結果步驟 - 自動開始抽獎');
    console.log('🔍 當前選擇:', this.currentSelection);
    
    // 重置狀態
    this.resetStep3State();
    
    // 確保有選擇類型
    if (!this.currentSelection.fullType) {
        console.warn('⚠️ 沒有選擇類型，回到步驟2');
        this.showNotification('請先選擇食物類型', 'warning');
        this.goToStep(2);
        return;
    }
    
    // 延遲開始抽獎
    setTimeout(() => {
        console.log('🚀 開始抽獎');
        this.startLottery();
    }, 300);
}
}

// 重置步驟3狀態

resetStep3State() {
    const spinner = document.getElementById('spinner');
    const result = document.getElementById('result');
    const progress = document.getElementById('progress');
    
    // 重置顯示狀態 - 確保正確的初始狀態
    if (spinner) {
        spinner.style.display = 'block'; // 顯示轉圈動畫
    }
    if (result) {
        result.style.display = 'none';   // 隱藏結果
    }
    if (progress) {
        progress.style.width = '0%';     // 進度條歸零
    }
    
    console.log('🔄 步驟3狀態已重置 - 顯示動畫，隱藏結果');
}

// 開始抽獎（用戶點擊「開始抽獎」或「再抽一次」時呼叫）
// 開始抽獎
// 漸進加速版本 - 開始慢，後面快
async startLottery() {
    console.log('🎰 開始抽獎流程 - 漸進加速版');
    
    const spinner = document.getElementById('spinner');
    const result = document.getElementById('result');
    const progress = document.getElementById('progress');
    
    // 重置狀態
    if (spinner) spinner.style.display = 'block';
    if (result) result.style.display = 'none';
    if (progress) progress.style.width = '0%';
    
    let progressValue = 0;
    let speed = 8; // 初始速度
    
    const progressInterval = setInterval(() => {
        // 隨著進度增加速度
        const currentSpeed = speed + (progressValue / 100) * 25;
        progressValue += Math.random() * currentSpeed + 5;
        
        if (progress) {
            progress.style.width = `${Math.min(progressValue, 100)}%`;
        }
        
        if (progressValue >= 100) {
            clearInterval(progressInterval);
            console.log('📊 進度條完成');
            setTimeout(() => this.showResult(), 250);
        }
    }, 120);
}

// 顯示結果
// 顯示結果
async showResult() {
    console.log('🎯 開始顯示結果');
    
    const spinner = document.getElementById('spinner');
    const result = document.getElementById('result');
    const finalResult = document.getElementById('final-result');
    const option1 = document.getElementById('option1');
    const option2 = document.getElementById('option2');
    
    console.log('🔍 結果元素狀態:', {
        spinner: spinner ? '找到' : '未找到',
        result: result ? '找到' : '未找到',
        finalResult: finalResult ? '找到' : '未找到',
        option1: option1 ? '找到' : '未找到',
        option2: option2 ? '找到' : '未找到'
    });
    
    // 隱藏動畫，顯示結果
    if (spinner) {
        spinner.style.display = 'none';
        console.log('✅ 隱藏轉圈動畫');
    }
    
    if (result) {
        result.style.display = 'block';
        console.log('✅ 顯示結果容器');
    }
    
    try {
        console.log('🔄 獲取隨機食物...');
        const foods = await this.getRandomFoods();
        console.log('🍽️ 獲取到的食物:', foods);
        
        if (finalResult) {
            finalResult.textContent = foods[0];
            console.log('✅ 設置主要結果:', foods[0]);
        }
        
        if (option1) {
            option1.textContent = foods[1];
            console.log('✅ 設置選項1:', foods[1]);
        }
        
        if (option2) {
            option2.textContent = foods[2];
            console.log('✅ 設置選項2:', foods[2]);
        }
        
        console.log('🎉 結果顯示完成');
        
    } catch (error) {
        console.error('❌ 獲取食物失敗:', error);
        
        if (finalResult) finalResult.textContent = '獲取失敗';
        if (option1) option1.textContent = '請檢查網路';
        if (option2) option2.textContent = '或重新整理';
        
        console.log('🔄 顯示錯誤訊息');
    }
}

    // 獲取隨機食物
    a// 獲取隨機食物
async getRandomFoods() {
    console.log('🔄 開始獲取隨機食物，類型:', this.currentSelection.fullType);
    
    if (!this.currentSelection.fullType) {
        console.warn('❌ 沒有選擇食物類型');
        return ['請先選擇', '食物類型', '再試一次'];
    }
    
    try {
        const foods = await foodDB.getFoodsByType(this.currentSelection.fullType);
        console.log('📊 從資料庫獲取的食物:', foods);
        
        if (foods.length === 0) {
            console.warn('⚠️ 該類型沒有食物');
            return ['暫無選項', '請新增食物', '到管理頁面'];
        }
        
        if (foods.length <= 3) {
            const result = foods.map(food => food.name).concat(Array(3 - foods.length).fill('暫無選項'));
            console.log('📝 食物不足3個，結果:', result);
            return result;
        }
        
        const shuffled = [...foods].sort(() => 0.5 - Math.random());
        const selectedFoods = shuffled.slice(0, 3).map(food => food.name);
        console.log('🎲 隨機選擇的食物:', selectedFoods);
        
        return selectedFoods;
        
    } catch (error) {
        console.error('❌ 獲取食物資料失敗:', error);
        return ['資料庫錯誤', '請重新整理', '頁面'];
    }
}

    // 載入食物列表
    async loadFoods() {
        try {
            const foods = await foodDB.getAllFoods();
            this.renderFoodList(foods);
        } catch (error) {
            console.error('❌ 載入食物列表失敗:', error);
        }
    }

    // 渲染食物列表
    renderFoodList(foods) {
        const foodList = document.getElementById('food-list');
        if (!foodList) {
            console.warn('❌ 找不到食物列表容器');
            return;
        }
        
        if (foods.length === 0) {
            foodList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>尚未添加任何食物</p>
                    <p style="font-size: 14px; margin-top: 10px;">點擊上方表單新增食物</p>
                </div>
            `;
            return;
        }
        
        // 按類型分組
        const groupedFoods = {};
        foods.forEach(food => {
            if (!groupedFoods[food.type]) {
                groupedFoods[food.type] = [];
            }
            groupedFoods[food.type].push(food);
        });
        
        const typeLabels = {
            'meal-rice': '🍚 正餐 - 飯類',
            'meal-noodle': '🍜 正餐 - 麵類',
            'meal-other': '🍽️ 正餐 - 其他',
            'snack-sweet': '🍰 點心 - 甜食',
            'snack-salty': '🍟 點心 - 鹹食',
            'snack-drink': '🥤 點心 - 飲品'
        };
        
        let html = '';
        
        for (const [type, typeFoods] of Object.entries(groupedFoods)) {
            html += `<h3>${typeLabels[type] || type}</h3>`;
            
            typeFoods.forEach(food => {
                html += `
                    <div class="food-item" data-id="${food.id}">
                        <div class="food-info">
                            <span class="food-name">${food.name}</span>
                        </div>
                        <div class="food-actions">
                            <button class="action-btn delete" data-id="${food.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        foodList.innerHTML = html;
        
        // 添加刪除事件
        foodList.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                await this.deleteFood(id);
            });
        });
    }

    // 新增食物
    async addFood() {
        const nameInput = document.getElementById('food-name');
        const typeSelect = document.getElementById('food-type');
        
        const name = nameInput.value.trim();
        const type = typeSelect.value;
        
        if (!name) {
            this.showNotification('請輸入食物名稱', 'error');
            nameInput.focus();
            return;
        }
        
        if (!type) {
            this.showNotification('請選擇食物類型', 'error');
            typeSelect.focus();
            return;
        }
        
        try {
            await foodDB.addFood({ name, type });
            
            // 清空表單
            nameInput.value = '';
            typeSelect.value = '';
            
            // 重新載入列表
            await this.loadFoods();
            
            this.showNotification('食物新增成功！');
        } catch (error) {
            console.error('❌ 新增食物失敗:', error);
            this.showNotification('新增失敗，請重試', 'error');
        }
    }

    // 刪除食物
    async deleteFood(id) {
        if (!confirm('確定要刪除這個食物嗎？')) {
            return;
        }
        
        try {
            await foodDB.deleteFood(id);
            await this.loadFoods();
            this.showNotification('食物刪除成功');
        } catch (error) {
            console.error('❌ 刪除食物失敗:', error);
            this.showNotification('刪除失敗，請重試', 'error');
        }
    }

    // PWA 功能
    setupPWA() {
        // 註冊 Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker 註冊成功:', registration);
                })
                .catch(error => {
                    console.log('❌ Service Worker 註冊失敗:', error);
                });
        }

        // 監聽安裝提示
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // 只在非 iOS 平台顯示安裝按鈕
            const platform = this.detectPlatform();
            const installBtn = document.getElementById('install-btn');
            if (installBtn && !platform.isIOS) {
                installBtn.style.display = 'flex';
                console.log('📱 顯示安裝按鈕');
            }
        });
        
        // 延遲設置平台指引
        setTimeout(() => {
            this.setupPlatformGuide();
        }, 500);
    }

    // 安裝 PWA
    async installPWA() {
        if (!this.deferredPrompt) {
            this.showNotification('您的瀏覽器不支援安裝', 'warning');
            return;
        }
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            this.showNotification('App 安裝成功！');
            document.getElementById('install-btn').style.display = 'none';
        } else {
            this.showNotification('安裝已取消', 'warning');
        }
        
        this.deferredPrompt = null;
    }

    // 分享連結
    shareLink() {
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: '今天吃什麼？ - 美食決策助手',
                text: '試試這個有趣的美食選擇器！',
                url: url
            }).then(() => {
                this.showNotification('分享成功！');
            }).catch(error => {
                console.log('分享取消或失敗:', error);
            });
        } else {
            // 降級方案：複製到剪貼簿
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('連結已複製到剪貼簿！');
            }).catch(() => {
                // 如果剪貼簿API不可用，顯示連結讓用戶手動複製
                prompt('請手動複製以下連結：', url);
            });
        }
    }

    // 生成 QR Code
    generateQRCode() {
        const container = document.getElementById('qrcode');
        if (!container) {
            console.warn('❌ 找不到 QR Code 容器');
            return;
        }
        
        const url = window.location.href;
        console.log('🔗 生成 QR Code，網址:', url);
        
        // 使用可靠的 QR Code 在線生成服務
        const encodedUrl = encodeURIComponent(url);
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodedUrl}&color=6a11cb&bgcolor=ffffff&margin=10&format=png`;
        
        // 顯示載入狀態
        container.innerHTML = `
            <div style="
                width: 160px; 
                height: 160px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                background: #f8f4ff;
                border: 2px dashed #6a11cb;
                border-radius: 8px;
                color: #6a11cb;
                font-size: 14px;
            ">載入 QR Code...</div>
        `;
        
        // 創建圖片元素
        const img = new Image();
        img.src = qrCodeImageUrl;
        img.alt = '掃描安裝今天吃什麼 App';
        img.style.cssText = `
            width: 160px; 
            height: 160px; 
            border: 2px solid #6a11cb; 
            border-radius: 8px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            background: white;
        `;
        
        // 圖片載入成功
        img.onload = () => {
            console.log('✅ QR Code 圖片載入成功');
            container.innerHTML = '';
            container.appendChild(img);
            
            // 添加說明文字
            const instruction = document.createElement('div');
            instruction.className = 'qrcode-instruction';
            instruction.innerHTML = '<i class="fas fa-mobile-alt"></i><span>用手機相機掃描安裝</span>';
            container.appendChild(instruction);
        };
        
        // 圖片載入失敗
        img.onerror = () => {
            console.warn('❌ QR Code 圖片載入失敗，使用備用方案');
            this.generateFallbackQRCode();
        };
        
        // 設定超時（5秒）
        setTimeout(() => {
            if (!img.complete) {
                console.warn('⏰ QR Code 載入超時，使用備用方案');
                this.generateFallbackQRCode();
            }
        }, 5000);
    }

    // 備用方案
    generateFallbackQRCode() {
        const container = document.getElementById('qrcode');
        if (!container) return;
        
        const url = window.location.href;
        const shortUrl = url.length > 30 ? url.substring(0, 30) + '...' : url;
        
        container.innerHTML = `
            <div style="
                width: 160px; 
                height: 160px; 
                background: white;
                border: 2px solid #6a11cb;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 15px;
                box-sizing: border-box;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            ">
                <div style="font-size: 36px; color: #6a11cb; margin-bottom: 8px;">🍴</div>
                <div style="font-size: 14px; font-weight: bold; color: #6a11cb; margin-bottom: 4px;">今天吃什麼？</div>
                <div style="font-size: 10px; color: #999; margin-top: 6px; word-break: break-all; line-height: 1.2;">
                    ${shortUrl}
                </div>
            </div>
            <div class="qrcode-instruction">
                <i class="fas fa-link"></i>
                <span>請手動複製網址</span>
            </div>
        `;
        
        console.log('🔄 使用備用 QR Code 顯示');
    }

    // 顯示通知
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) {
            console.warn('❌ 通知元素未找到，無法顯示通知:', message);
            return;
        }
        
        notificationText.textContent = message;
        notification.className = 'notification';
        
        if (type === 'error') {
            notification.classList.add('error');
        } else if (type === 'warning') {
            notification.classList.add('warning');
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// 應用啟動 - 確保 DOM 完全載入
function initApp() {
    // 檢查必要元素是否存在
    const requiredElements = [
        'notification', 'notification-text', 'next1', 'next2'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('❌ 缺少必要元素:', missingElements);
        setTimeout(initApp, 100);
        return;
    }
    
    console.log('✅ 所有必要元素已載入，啟動應用...');
    new FoodPickerApp();
}

// 多種載入事件確保執行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}