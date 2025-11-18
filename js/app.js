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
            // 初始化資料庫
            await foodDB.init();
            
            // 初始化UI
            this.initUI();
            this.setupEventListeners();
            this.setupPWA();
            
            // 載入食物列表
            await this.loadFoods();
            
            console.log('應用初始化完成');
        } catch (error) {
            console.error('應用初始化失敗:', error);
            this.showNotification('應用初始化失敗，請重新整理頁面', 'error');
        }
    }

  initUI() {
    this.initOptionCards();
    
    // 直接生成 QR Code，不需要延遲
    this.generateQRCode();
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
        // 標籤頁切換
        document.querySelectorAll('.tab').forEach(tab => {
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

        // 按鈕事件
        document.getElementById('next1').addEventListener('click', () => this.goToStep(2));
        document.getElementById('next2').addEventListener('click', () => this.startLottery());
        document.getElementById('back1').addEventListener('click', () => this.goToStep(1));
        document.getElementById('back2').addEventListener('click', () => this.goToStep(2));
        document.getElementById('reset').addEventListener('click', () => this.startLottery());
        
        // 食物管理
        document.getElementById('add-food').addEventListener('click', () => this.addFood());
        document.getElementById('food-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFood();
        });

        // 分享功能
        document.getElementById('install-btn').addEventListener('click', () => this.installPWA());
        document.getElementById('share-link-btn').addEventListener('click', () => this.shareLink());
    }

    // 切換標籤頁
    switchTab(tabName) {
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
    }

    // 切換步驟
    goToStep(step) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById(`step${step}`).classList.add('active');
        
        if (step === 2) {
            const mealOptions = document.getElementById('meal-options');
            const snackOptions = document.getElementById('snack-options');
            
            if (this.currentSelection.type === 'meal') {
                mealOptions.style.display = 'flex';
                snackOptions.style.display = 'none';
            } else {
                mealOptions.style.display = 'none';
                snackOptions.style.display = 'flex';
            }
        }
    }

    // 開始抽獎
    async startLottery() {
        this.goToStep(3);
        
        const spinner = document.getElementById('spinner');
        const result = document.getElementById('result');
        const progress = document.getElementById('progress');
        
        spinner.style.display = 'block';
        result.style.display = 'none';
        progress.style.width = '0%';
        
        // 進度條動畫
        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += Math.random() * 15;
            progress.style.width = `${Math.min(progressValue, 100)}%`;
            
            if (progressValue >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => this.showResult(), 500);
            }
        }, 200);
    }

    // 顯示結果
    async showResult() {
        const spinner = document.getElementById('spinner');
        const result = document.getElementById('result');
        
        spinner.style.display = 'none';
        result.style.display = 'block';
        
        try {
            const foods = await this.getRandomFoods();
            document.getElementById('final-result').textContent = foods[0];
            document.getElementById('option1').textContent = foods[1];
            document.getElementById('option2').textContent = foods[2];
        } catch (error) {
            console.error('獲取食物失敗:', error);
            document.getElementById('final-result').textContent = '獲取失敗';
            document.getElementById('option1').textContent = '請檢查網路';
            document.getElementById('option2').textContent = '或重新整理';
        }
    }

    // 獲取隨機食物
    async getRandomFoods() {
        const foods = await foodDB.getFoodsByType(this.currentSelection.fullType);
        
        if (foods.length === 0) {
            return ['暫無選項', '請新增食物', '到管理頁面'];
        }
        
        if (foods.length <= 3) {
            return foods.map(food => food.name).concat(Array(3 - foods.length).fill('暫無選項'));
        }
        
        const shuffled = [...foods].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3).map(food => food.name);
    }

    // 載入食物列表
    async loadFoods() {
        try {
            const foods = await foodDB.getAllFoods();
            this.renderFoodList(foods);
        } catch (error) {
            console.error('載入食物列表失敗:', error);
        }
    }

    // 渲染食物列表
    renderFoodList(foods) {
        const foodList = document.getElementById('food-list');
        
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
            console.error('新增食物失敗:', error);
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
            console.error('刪除食物失敗:', error);
            this.showNotification('刪除失敗，請重試', 'error');
        }
    }

    // PWA 功能
    setupPWA() {
        // 註冊 Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker 註冊成功:', registration);
                })
                .catch(error => {
                    console.log('Service Worker 註冊失敗:', error);
                });
        }

        // 監聽安裝提示
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('install-btn').style.display = 'flex';
        });
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
    // 生成真正的 QR Code
// 使用在線服務生成 QR Code
generateQRCode() {
    const container = document.getElementById('qrcode');
    if (!container) {
        console.warn('找不到 QR Code 容器');
        return;
    }
    
    const url = window.location.href;
    console.log('使用在線服務生成 QR Code，網址:', url);
    
    // 使用可靠的 QR Code 在線生成服務
    const encodedUrl = encodeURIComponent(url);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodedUrl}&color=6a11cb&bgcolor=ffffff&margin=10&format=png`;
    
    // 顯示載中狀態
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
        console.log('QR Code 圖片載入成功');
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
        console.warn('QR Code 圖片載入失敗，使用備用方案');
        this.generateFallbackQRCode();
    };
    
    // 設定超時（5秒）
    setTimeout(() => {
        if (!img.complete) {
            console.warn('QR Code 載入超時，使用備用方案');
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
    
    console.log('使用備用 QR Code 顯示');
}

    // 顯示通知
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
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

// 應用啟動
document.addEventListener('DOMContentLoaded', () => {
    new FoodPickerApp();
});

// 註冊 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker 註冊成功: ', registration);
            })
            .catch(registrationError => {
                console.log('ServiceWorker 註冊失敗: ', registrationError);
            });
    });
}