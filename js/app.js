// 主應用邏輯 - 完整功能修復版
class FoodPickerApp {
    constructor() {
        this.currentSelection = {
            type: null,
            category: null,
            fullType: null,
            scenario: 'all'
        };
        
        this.deferredPrompt = null;
        this.currentFoods = [];
        
        // 延遲初始化以確保 DOM 完全載入
        setTimeout(() => {
            this.init().catch(error => {
                console.error('❌ 應用初始化失敗:', error);
            });
        }, 100);
    }

    async init() {
        try {
            console.log('🚀 應用初始化開始...');
            
            // 檢查必要元素是否存在
            if (!this.checkRequiredElements()) {
                console.warn('⚠️ 必要元素尚未載入，重試中...');
                setTimeout(() => this.init(), 100);
                return;
            }
            
            console.log('✅ DOM 元素檢查完成');
            
            // 初始化資料庫
            this.foodDB = new FoodDB();
            await this.foodDB.init();
            console.log('✅ 資料庫初始化完成');
            
            // 初始化情境管理器
            this.scenarioManager = new ScenarioManager();
            console.log('✅ 情境管理器初始化完成');
            
            // 初始化UI和事件
            this.initUI();
            this.setupEventListeners();
            this.setupPWA();
            
            // 載入食物列表
            await this.loadFoods();
            
            console.log('✅ 應用初始化完成');
            this.showNotification('應用載入完成！', 'success');
            
        } catch (error) {
            console.error('❌ 應用初始化失敗:', error);
            this.showNotification('應用初始化失敗，請重新整理頁面', 'error');
        }
    }

    // 檢查必要元素是否存在
    checkRequiredElements() {
        const requiredElements = [
            'next0', 'next1', 'next2', 'back1', 'back2', 'back3',
            'quick-back1', 'quick-back2', 'quick-back3', 'reset',
            'notification', 'notification-text'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('❌ 缺少必要元素:', missingElements);
            return false;
        }
        
        return true;
    }

    // 初始化 UI
    initUI() {
        console.log('🎨 初始化 UI...');
        
        // 重置所有狀態
        this.resetUIState();
        
        // 初始化情境選擇
        this.initScenarioUI();
        
        // 確保步驟0是活躍的
        this.forceUpdateStep0();
        
        this.generateQRCode();
        console.log('✅ UI 初始化完成');
    }

    // 強制更新步驟0狀態
    forceUpdateStep0() {
        console.log('🔄 強制更新步驟0狀態');
        
        // 確保步驟0是活躍的
        const steps = document.querySelectorAll('#picker-page .step');
        steps.forEach(step => step.classList.remove('active'));
        
        const step0 = document.getElementById('step0');
        if (step0) {
            step0.classList.add('active');
        }
        
        // 重置所有選擇狀態
        this.resetSelection();
        
        console.log('✅ 步驟0狀態更新完成');
    }

    // 初始化情境UI - 修復事件綁定問題
    initScenarioUI() {
        console.log('🎯 初始化情境選擇UI');
        
        const scenarioCards = document.querySelectorAll('.scenario-card');
        console.log('找到情境卡片:', scenarioCards.length);
        
        // 重新綁定事件（使用更可靠的方式）
        scenarioCards.forEach(card => {
            // 移除舊事件，綁定新事件
            card.onclick = null;
            card.addEventListener('click', () => {
                this.handleScenarioSelection(card);
            });
            card.style.cursor = 'pointer';
        });
    }

    // 情境選擇處理
    handleScenarioSelection(card) {
        console.log('🖱️ 處理情境選擇:', card.dataset.scenario);
        
        // 移除其他卡片的選中狀態
        document.querySelectorAll('.scenario-card').forEach(c => {
            c.classList.remove('selected');
        });
        
        // 選中當前卡片
        card.classList.add('selected');
        
        const scenario = card.dataset.scenario;
        this.currentSelection.scenario = scenario;
        this.scenarioManager.setScenario(scenario);
        
        console.log('✅ 選擇情境:', scenario);
        
        // 如果是自訂清單，顯示清單選擇
        if (scenario === 'custom') {
            this.showCustomLists();
        } else {
            const container = document.getElementById('custom-lists-container');
            if (container) container.style.display = 'none';
        }
        
        // 啟用下一步按鈕
        const next0 = document.getElementById('next0');
        if (next0) {
            next0.disabled = false;
            next0.style.cursor = 'pointer';
            console.log('✅ 啟用 next0 按鈕');
        }
    }

    // 顯示自訂清單
    showCustomLists() {
        const container = document.getElementById('custom-lists-container');
        const listsDiv = document.getElementById('custom-lists');
        
        if (!container || !listsDiv) return;
        
        const customLists = this.scenarioManager.preferences.customLists;
        
        if (Object.keys(customLists).length === 0) {
            listsDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">尚未創建任何自訂清單</p>';
        } else {
            listsDiv.innerHTML = Object.keys(customLists).map(listName => `
                <div class="custom-list-item" data-list="${listName}">
                    <div class="list-name">${listName}</div>
                    <div class="list-count">${customLists[listName].length} 項</div>
                </div>
            `).join('');
            
            // 添加點擊事件
            listsDiv.querySelectorAll('.custom-list-item').forEach(item => {
                item.onclick = null;
                item.addEventListener('click', () => {
                    listsDiv.querySelectorAll('.custom-list-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    this.scenarioManager.currentCustomList = item.dataset.list;
                    
                    // 確保下一步按鈕啟用
                    const next0 = document.getElementById('next0');
                    if (next0) next0.disabled = false;
                });
                item.style.cursor = 'pointer';
            });
        }
        
        container.style.display = 'block';
    }

    // 設定事件監聽
    setupEventListeners() {
        console.log('🎯 開始設定事件監聽器...');
        
        // 標籤頁切換
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.onclick = null;
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
            tab.style.cursor = 'pointer';
        });

        // 步驟導航按鈕
        this.setupButton('next0', () => this.goToStep(1));
        this.setupButton('next1', () => this.goToStep(2));
        this.setupButton('next2', () => this.goToStep(3));
        
        // 正常的上一步（逐步返回）
        this.setupButton('back1', () => this.goToStep(0));
        this.setupButton('back2', () => this.goToStep(1));
        this.setupButton('back3', () => this.goToStep(2));
        
        // 快速返回情境選擇
        this.setupButton('quick-back1', () => this.returnToScenarioSelection());
        this.setupButton('quick-back2', () => this.returnToScenarioSelection());
        this.setupButton('quick-back3', () => this.returnToScenarioSelection());
        
        this.setupButton('reset', () => this.startLottery());
        this.setupButton('add-food', () => this.addFood());
        this.setupButton('install-btn', () => this.installPWA());
        this.setupButton('share-link-btn', () => this.shareLink());
        this.setupButton('create-list-btn', () => this.createCustomList());
        this.setupButton('favorite-btn', () => this.toggleFavorite());
        this.setupButton('exclude-btn', () => this.toggleExclude());
        
        // 食物名稱輸入框 Enter 事件
        const foodNameInput = document.getElementById('food-name');
        if (foodNameInput) {
            foodNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addFood();
            });
        }

        // 快速模板按鈕
        document.querySelectorAll('.btn-template').forEach(btn => {
            btn.onclick = null;
            btn.addEventListener('click', (e) => {
                this.fillTemplate(e.target.dataset.template);
            });
            btn.style.cursor = 'pointer';
        });

        // 設定變更監聽
        document.getElementById('calorie-limit')?.addEventListener('change', (e) => {
            this.scenarioManager.settings.calorieLimit = parseInt(e.target.value);
            this.scenarioManager.saveSettings();
        });
        
        document.getElementById('price-limit')?.addEventListener('change', (e) => {
            this.scenarioManager.settings.priceLimit = parseInt(e.target.value);
            this.scenarioManager.saveSettings();
        });
        
        document.getElementById('time-limit')?.addEventListener('change', (e) => {
            this.scenarioManager.settings.timeLimit = parseInt(e.target.value);
            this.scenarioManager.saveSettings();
        });

        // 設置類型選擇事件
        this.setupTypeSelection();
        
        // 設置選項卡片事件
        this.setupOptionCards();

        console.log('✅ 事件監聽器設定完成');
    }

    // 安全的按鈕設定方法
    setupButton(buttonId, method) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = null;
            button.addEventListener('click', method);
            button.style.cursor = 'pointer';
            console.log(`✅ 綁定按鈕: ${buttonId}`);
        } else {
            console.warn(`❌ 找不到按鈕: ${buttonId}`);
        }
    }

    // 設置類型選擇事件
    setupTypeSelection() {
        console.log('🎯 設置類型選擇事件...');
        
        const typeButtons = document.querySelectorAll('.type-selection .btn-outline');
        typeButtons.forEach(button => {
            button.onclick = null;
            button.addEventListener('click', (e) => {
                // 移除其他按鈕的active狀態
                typeButtons.forEach(btn => btn.classList.remove('active'));
                
                // 設置當前按鈕為active
                e.currentTarget.classList.add('active');
                
                // 更新選擇
                const type = e.currentTarget.dataset.type;
                this.currentSelection.type = type;
                console.log('✅ 選擇類型:', type);
                
                // 啟用下一步按鈕
                document.getElementById('next1').disabled = false;
                document.getElementById('next1').style.cursor = 'pointer';
                
                // 立即顯示相關選項
                this.showRelevantOptions();
            });
            button.style.cursor = 'pointer';
        });
    }

    // 設置選項卡片事件
    setupOptionCards() {
        console.log('🎯 設置選項卡片事件...');
        
        const optionCards = document.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.onclick = null;
            card.addEventListener('click', (e) => {
                // 移除其他選中狀態
                document.querySelectorAll('.option-card').forEach(c => {
                    c.classList.remove('selected');
                });
                
                // 選中當前卡片
                e.currentTarget.classList.add('selected');
                
                // 更新選擇
                const fullType = e.currentTarget.dataset.type;
                this.currentSelection.fullType = fullType;
                console.log('✅ 選擇詳細類型:', fullType);
                
                // 啟用下一步按鈕
                document.getElementById('next2').disabled = false;
                document.getElementById('next2').style.cursor = 'pointer';
            });
            card.style.cursor = 'pointer';
        });
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
        
        // 特殊處理
        if (tabName === 'preferences') {
            this.loadPreferencesUI();
        } else if (tabName === 'share') {
            setTimeout(() => {
                this.setupPlatformGuide();
            }, 100);
        }
    }

    // 切換步驟
    goToStep(step) {
        console.log(`🔄 切換到步驟: ${step}`, '當前選擇:', this.currentSelection);
        
        // 確保所有步驟都隱藏
        const steps = document.querySelectorAll('#picker-page .step');
        steps.forEach(stepElement => {
            stepElement.classList.remove('active');
        });
        
        // 顯示當前步驟
        const currentStep = document.getElementById(`step${step}`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
        
        // 步驟特定的初始化
        switch(step) {
            case 0:
                this.updateStep0UI();
                break;
            case 1:
                this.updateStep1UI();
                break;
            case 2:
                this.showRelevantOptions();
                this.updateStep2UI();
                break;
            case 3:
                this.prepareStep3();
                break;
        }
    }

    // 根據類型顯示相關選項
    showRelevantOptions() {
        const mealOptions = document.getElementById('meal-options');
        const snackOptions = document.getElementById('snack-options');
        
        if (this.currentSelection.type === 'meal') {
            if (mealOptions) mealOptions.style.display = 'flex';
            if (snackOptions) snackOptions.style.display = 'none';
        } else if (this.currentSelection.type === 'snack') {
            if (mealOptions) mealOptions.style.display = 'none';
            if (snackOptions) snackOptions.style.display = 'flex';
        } else {
            // 初始狀態都隱藏
            if (mealOptions) mealOptions.style.display = 'none';
            if (snackOptions) snackOptions.style.display = 'none';
        }
    }

    // 更新各步驟 UI 狀態的方法
    updateStep0UI() {
        const next0 = document.getElementById('next0');
        if (next0) {
            next0.disabled = !this.currentSelection.scenario;
            next0.style.cursor = this.currentSelection.scenario ? 'pointer' : 'not-allowed';
        }
    }

    updateStep1UI() {
        const next1 = document.getElementById('next1');
        if (next1) {
            // 如果之前已經選擇了類型，保持按鈕狀態
            if (this.currentSelection.type) {
                next1.disabled = false;
                next1.style.cursor = 'pointer';
                // 恢復對應按鈕的 active 狀態
                document.querySelectorAll('.type-selection .btn-outline').forEach(btn => {
                    if (btn.dataset.type === this.currentSelection.type) {
                        btn.classList.add('active');
                    }
                });
            } else {
                next1.disabled = true;
                next1.style.cursor = 'not-allowed';
            }
        }
    }

    updateStep2UI() {
        const next2 = document.getElementById('next2');
        if (next2) {
            // 如果之前已經選擇了詳細類型，保持按鈕狀態
            if (this.currentSelection.fullType) {
                next2.disabled = false;
                next2.style.cursor = 'pointer';
                // 恢復對應卡片的 selected 狀態
                document.querySelectorAll('.option-card').forEach(card => {
                    if (card.dataset.type === this.currentSelection.fullType) {
                        card.classList.add('selected');
                    }
                });
            } else {
                next2.disabled = true;
                next2.style.cursor = 'not-allowed';
            }
        }
    }

    // 準備步驟3
    prepareStep3() {
        console.log('🎰 進入結果步驟');
        this.resetStep3State();
        
        // 設定情境顯示
        const scenarioIndicator = document.getElementById('current-scenario');
        if (scenarioIndicator) {
            scenarioIndicator.textContent = this.scenarioManager.getScenarioDisplayName();
        }
        
        // 開始抽獎
        setTimeout(() => {
            this.startLottery();
        }, 400);
    }

    // 重置步驟3狀態
    resetStep3State() {
        const spinner = document.getElementById('spinner');
        const result = document.getElementById('result');
        const progress = document.getElementById('progress');
        
        if (spinner) spinner.style.display = 'none';
        if (result) result.style.display = 'none';
        if (progress) progress.style.width = '0%';
        
        // 重置營養資訊
        this.resetNutritionInfo();
    }

    // 重置營養資訊
    resetNutritionInfo() {
        document.getElementById('calories').textContent = '-';
        document.getElementById('protein').textContent = '-';
        document.getElementById('carbs').textContent = '-';
        document.getElementById('fat').textContent = '-';
    }

    // 返回情境選擇頁面
    returnToScenarioSelection() {
        console.log('🔙 快速返回情境選擇');
        this.resetSelection();
        this.goToStep(0);
        this.showNotification('已回到情境選擇，可以開始新的選擇流程');
    }

    // 重置選擇狀態的方法
    resetSelection() {
        this.currentSelection = {
            type: null,
            category: null,
            fullType: null,
            scenario: 'all'
        };
        
        // 重置情境管理器
        this.scenarioManager.setScenario('all');
        this.scenarioManager.currentCustomList = null;
        
        // 重置 UI 狀態
        this.resetUIState();
    }

    // 重置 UI 狀態
    resetUIState() {
        console.log('🔄 重置 UI 狀態');
        
        // 重置情境選擇
        document.querySelectorAll('.scenario-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 重置類型選擇
        document.querySelectorAll('.type-selection .btn-outline').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 重置選項卡片
        document.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 隱藏自訂清單容器
        const customContainer = document.getElementById('custom-lists-container');
        if (customContainer) customContainer.style.display = 'none';
        
        // 禁用所有下一步按鈕
        const next0 = document.getElementById('next0');
        const next1 = document.getElementById('next1');
        const next2 = document.getElementById('next2');
        
        if (next0) {
            next0.disabled = true;
            next0.style.cursor = 'not-allowed';
        }
        if (next1) {
            next1.disabled = true;
            next1.style.cursor = 'not-allowed';
        }
        if (next2) {
            next2.disabled = true;
            next2.style.cursor = 'not-allowed';
        }
    }

    // 開始抽獎
    async startLottery() {
        console.log('🎰 開始抽獎流程');
        
        const spinner = document.getElementById('spinner');
        const result = document.getElementById('result');
        const progress = document.getElementById('progress');
        
        // 顯示抽獎元素
        if (spinner) spinner.style.display = 'block';
        if (result) result.style.display = 'none';
        if (progress) progress.style.width = '0%';
        
        try {
            // 獲取並過濾食物
            let foods = await this.foodDB.getFoodsByType(this.currentSelection.fullType);
            this.currentFoods = this.scenarioManager.filterFoods(foods);
            
            console.log(`🎯 過濾後食物數量: ${this.currentFoods.length}`);
            
            if (this.currentFoods.length === 0) {
                this.showNoResults();
                return;
            }
            
            // 進度條動畫
            let progressValue = 0;
            const progressInterval = setInterval(() => {
                progressValue += Math.random() * 25 + 10;
                if (progress) {
                    progress.style.width = `${Math.min(progressValue, 100)}%`;
                }
                
                if (progressValue >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => this.showResult(), 300);
                }
            }, 150);
            
        } catch (error) {
            console.error('❌ 抽獎過程出錯:', error);
            this.showNotification('抽獎過程出錯，請重試', 'error');
            this.showNoResults();
        }
    }

    // 顯示無結果
    showNoResults() {
        const spinner = document.getElementById('spinner');
        const result = document.getElementById('result');
        
        if (spinner) spinner.style.display = 'none';
        if (result) {
            result.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>沒有符合條件的食物</p>
                    <p style="font-size: 14px; margin-top: 10px;">請調整情境設定或切換模式</p>
                </div>
            `;
            result.style.display = 'block';
        }
    }

    // 重新初始化資料庫（包含預設食物）
    async reinitializeDatabase() {
        if (!confirm('確定要重新初始化資料庫嗎？這會刪除所有自訂食物並恢復預設食物清單。')) {
            return;
        }
        
        try {
            this.showNotification('重新初始化資料庫中...', 'warning');
            
            const success = await this.foodDB.reinitializeWithDefaultFoods();
            
            if (success) {
                await this.loadFoods();
                this.showNotification('資料庫重新初始化完成！');
            } else {
                this.showNotification('重新初始化失敗', 'error');
            }
        } catch (error) {
            console.error('❌ 重新初始化失敗:', error);
            this.showNotification('重新初始化失敗', 'error');
        }
    }
    // 顯示結果
    async showResult() {
        const spinner = document.getElementById('spinner');
        const result = document.getElementById('result');
        
        if (spinner) spinner.style.display = 'none';
        if (result) result.style.display = 'block';
        
        try {
            const selectedFoods = this.getRandomFoodsFromCurrent();
            
            // 顯示主要結果
            document.getElementById('final-result').textContent = selectedFoods[0].name;
            document.getElementById('option1').textContent = selectedFoods[1].name;
            document.getElementById('option2').textContent = selectedFoods[2].name;
            
            // 顯示營養資訊
            this.displayNutritionInfo(selectedFoods[0]);
            
            // 更新互動按鈕狀態
            this.updateActionButtons(selectedFoods[0].name);
            
        } catch (error) {
            console.error('❌ 顯示結果失敗:', error);
            document.getElementById('final-result').textContent = '獲取失敗';
            document.getElementById('option1').textContent = '請檢查網路';
            document.getElementById('option2').textContent = '或重新整理';
        }
    }

    // 從當前食物中隨機選擇
    getRandomFoodsFromCurrent() {
        if (this.currentFoods.length === 0) {
            return [
                { name: '暫無選項', calories: 0, protein: 0, carbs: 0, fat: 0 },
                { name: '請新增食物', calories: 0, protein: 0, carbs: 0, fat: 0 },
                { name: '到管理頁面', calories: 0, protein: 0, carbs: 0, fat: 0 }
            ];
        }
        
        if (this.currentFoods.length === 1) {
            return [
                this.currentFoods[0],
                { name: '暫無其他選項', calories: 0, protein: 0, carbs: 0, fat: 0 },
                { name: '請新增更多食物', calories: 0, protein: 0, carbs: 0, fat: 0 }
            ];
        }
        
        if (this.currentFoods.length === 2) {
            return [
                this.currentFoods[0],
                this.currentFoods[1],
                { name: '暫無其他選項', calories: 0, protein: 0, carbs: 0, fat: 0 }
            ];
        }
        
        const shuffled = [...this.currentFoods].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    // 顯示營養資訊
    displayNutritionInfo(food) {
        if (food.calories) {
            document.getElementById('calories').textContent = `${food.calories} kcal`;
        }
        if (food.protein) {
            document.getElementById('protein').textContent = `${food.protein}g`;
        }
        if (food.carbs) {
            document.getElementById('carbs').textContent = `${food.carbs}g`;
        }
        if (food.fat) {
            document.getElementById('fat').textContent = `${food.fat}g`;
        }
    }

    // 更新互動按鈕狀態
    updateActionButtons(foodName) {
        const favoriteBtn = document.getElementById('favorite-btn');
        const excludeBtn = document.getElementById('exclude-btn');
        
        if (favoriteBtn) {
            const isFavorite = this.scenarioManager.isFavorite(foodName);
            favoriteBtn.innerHTML = isFavorite ? 
                '<i class="fas fa-heart"></i> 移除最愛' : 
                '<i class="far fa-heart"></i> 加入最愛';
            favoriteBtn.classList.toggle('active', isFavorite);
            favoriteBtn.style.cursor = 'pointer';
        }
        
        if (excludeBtn) {
            const isBlacklisted = this.scenarioManager.isBlacklisted(foodName);
            excludeBtn.style.display = isBlacklisted ? 'none' : 'flex';
            if (excludeBtn.style.display !== 'none') {
                excludeBtn.style.cursor = 'pointer';
            }
        }
    }

    // 切換最愛
    toggleFavorite() {
        const currentFood = document.getElementById('final-result').textContent;
        
        if (this.scenarioManager.isFavorite(currentFood)) {
            this.scenarioManager.removeFavorite(currentFood);
            this.showNotification(`已從最愛移除: ${currentFood}`);
        } else {
            this.scenarioManager.addFavorite(currentFood);
            this.showNotification(`已加入最愛: ${currentFood}`);
        }
        
        this.updateActionButtons(currentFood);
    }

    // 切換排除
    toggleExclude() {
        const currentFood = document.getElementById('final-result').textContent;
        this.scenarioManager.addToBlacklist(currentFood);
        this.showNotification(`已排除: ${currentFood}`, 'warning');
        
        // 重新抽獎
        setTimeout(() => {
            this.startLottery();
        }, 1000);
    }

    // 載入偏好設定UI
    loadPreferencesUI() {
        this.loadFavoritesList();
        this.loadBlacklist();
        this.loadCustomLists();
        this.loadSettingsUI();
    }

    // 載入最愛清單
    loadFavoritesList() {
        const container = document.getElementById('favorites-list');
        if (!container) return;
        
        const favorites = [...this.scenarioManager.preferences.favorites];
        
        if (favorites.length === 0) {
            container.innerHTML = '<p class="empty-state">尚未添加任何最愛食物</p>';
        } else {
            container.innerHTML = favorites.map(food => `
                <div class="preference-item">
                    <span class="food-name">${food}</span>
                    <button class="btn-remove" data-food="${food}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            // 添加移除事件
            container.querySelectorAll('.btn-remove').forEach(btn => {
                btn.onclick = null;
                btn.addEventListener('click', (e) => {
                    const foodName = btn.dataset.food;
                    this.scenarioManager.removeFavorite(foodName);
                    this.loadFavoritesList();
                    this.showNotification(`已從最愛移除: ${foodName}`);
                });
                btn.style.cursor = 'pointer';
            });
        }
    }

    // 載入黑名單
    loadBlacklist() {
        const container = document.getElementById('blacklist-list');
        if (!container) return;
        
        const blacklist = [...this.scenarioManager.preferences.blacklist];
        
        if (blacklist.length === 0) {
            container.innerHTML = '<p class="empty-state">尚未排除任何食物</p>';
        } else {
            container.innerHTML = blacklist.map(food => `
                <div class="preference-item">
                    <span class="food-name">${food}</span>
                    <button class="btn-remove" data-food="${food}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
            
            container.querySelectorAll('.btn-remove').forEach(btn => {
                btn.onclick = null;
                btn.addEventListener('click', (e) => {
                    const foodName = btn.dataset.food;
                    this.scenarioManager.removeFromBlacklist(foodName);
                    this.loadBlacklist();
                    this.showNotification(`已從黑名單移除: ${foodName}`);
                });
                btn.style.cursor = 'pointer';
            });
        }
    }

    // 載入自訂清單
    loadCustomLists() {
        const container = document.getElementById('user-custom-lists');
        if (!container) return;
        
        const customLists = this.scenarioManager.preferences.customLists;
        
        if (Object.keys(customLists).length === 0) {
            container.innerHTML = '<p class="empty-state">尚未創建任何自訂清單</p>';
        } else {
            container.innerHTML = Object.keys(customLists).map(listName => `
                <div class="custom-list-item">
                    <div class="list-header">
                        <div class="list-name">${listName}</div>
                        <div class="list-actions">
                            <button class="btn-edit" data-list="${listName}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" data-list="${listName}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="list-foods">
                        ${customLists[listName].map(food => `
                            <span class="list-food">${food}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            
            // 添加事件
            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.onclick = null;
                btn.addEventListener('click', (e) => {
                    const listName = btn.dataset.list;
                    if (confirm(`確定要刪除清單「${listName}」嗎？`)) {
                        delete this.scenarioManager.preferences.customLists[listName];
                        this.scenarioManager.savePreferences();
                        this.loadCustomLists();
                        this.showNotification(`已刪除清單: ${listName}`);
                    }
                });
                btn.style.cursor = 'pointer';
            });
        }
    }

    // 載入設定UI
    loadSettingsUI() {
        const calorieLimit = document.getElementById('calorie-limit');
        const priceLimit = document.getElementById('price-limit');
        const timeLimit = document.getElementById('time-limit');
        
        if (calorieLimit) calorieLimit.value = this.scenarioManager.settings.calorieLimit;
        if (priceLimit) priceLimit.value = this.scenarioManager.settings.priceLimit;
        if (timeLimit) timeLimit.value = this.scenarioManager.settings.timeLimit;
    }

    // 創建自訂清單
    createCustomList() {
        const input = document.getElementById('new-list-name');
        const listName = input?.value.trim();
        
        if (!listName) {
            this.showNotification('請輸入清單名稱', 'error');
            return;
        }
        
        if (this.scenarioManager.preferences.customLists[listName]) {
            this.showNotification('清單名稱已存在', 'error');
            return;
        }
        
        this.scenarioManager.createCustomList(listName, []);
        if (input) input.value = '';
        this.loadCustomLists();
        this.showNotification(`已創建清單: ${listName}`);
    }

    // 載入食物列表
    // 載入食物列表
    async loadFoods() {
    try {
        console.log('📝 開始載入食物列表...');
        
        // 簡化資料庫檢查
        if (!this.foodDB) {
            console.error('❌ 資料庫未初始化');
            this.showNotification('資料庫未就緒', 'error');
            return;
        }
        
        // 直接嘗試獲取食物，讓資料庫自己處理連線
        const foods = await this.foodDB.getAllFoods();
        console.log('✅ 獲取到食物資料，數量:', foods.length);
        
        this.renderFoodList(foods);
        
        } catch (error) {
        console.error('❌ 載入食物列表失敗:', error);
        this.showNotification('載入食物列表失敗', 'error');
        }
    }

    // 渲染食物列表
    renderFoodList(foods) {
        const foodList = document.getElementById('food-list');
        if (!foodList) {
            console.warn('❌ 找不到食物列表容器');
            return;
        }
        
        console.log('📝 渲染食物列表，數量:', foods.length);
        
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
                // 確保所有數值都有預設值
                const calories = food.calories || 0;
                const protein = food.protein || 0;
                const carbs = food.carbs || 0;
                const fat = food.fat || 0;
                const price = food.price || 0;
                const prepTime = food.prepTime || 10;
                
                const nutritionInfo = `
                    <div class="food-nutrition">
                        ${calories} kcal | $${price} | ${protein}P ${carbs}C ${fat}F | ${prepTime}分鐘
                    </div>
                `;
                
                html += `
                    <div class="food-item" data-id="${food.id}">
                        <div class="food-info">
                            <span class="food-name">${food.name}</span>
                            ${nutritionInfo}
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
        const deleteButtons = foodList.querySelectorAll('.action-btn.delete');
        console.log('🗑️ 綁定刪除按鈕，數量:', deleteButtons.length);
        
        deleteButtons.forEach(btn => {
            btn.onclick = null;
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                console.log('🗑️ 刪除食物，ID:', id);
                await this.deleteFood(id);
            });
            btn.style.cursor = 'pointer';
        });
        
        console.log('✅ 食物列表渲染完成');
    }

    // 新增食物 - 加強驗證
    async addFood() {
        console.log('🍽️ 開始新增食物...');
        
        // 檢查資料庫是否可用
        if (!this.foodDB) {
            console.error('❌ 資料庫未初始化');
            this.showNotification('資料庫未就緒，請重新整理頁面', 'error');
            return;
        }
        
        // 獲取所有表單輸入
        const nameInput = document.getElementById('food-name');
        const typeSelect = document.getElementById('food-type');
        const caloriesInput = document.getElementById('food-calories');
        const priceInput = document.getElementById('food-price');
        const proteinInput = document.getElementById('food-protein');
        const carbsInput = document.getElementById('food-carbs');
        const fatInput = document.getElementById('food-fat');
        const prepTimeInput = document.getElementById('food-prepTime');
        
        // 檢查元素是否存在
        if (!nameInput || !typeSelect) {
            console.error('❌ 找不到必要的表單元素');
            this.showNotification('表單載入異常，請重新整理頁面', 'error');
            return;
        }
        
        const name = nameInput.value.trim();
        const type = typeSelect.value;
        const calories = parseInt(caloriesInput?.value) || 0;
        const price = parseInt(priceInput?.value) || 0;
        const protein = parseFloat(proteinInput?.value) || 0;
        const carbs = parseFloat(carbsInput?.value) || 0;
        const fat = parseFloat(fatInput?.value) || 0;
        const prepTime = parseInt(prepTimeInput?.value) || 10;
        
        console.log('📋 表單資料:', {
            name, type, calories, price, protein, carbs, fat, prepTime
        });
        
        // 加強表單驗證
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
        
        if (calories < 0) {
            this.showNotification('熱量不能為負數', 'error');
            caloriesInput?.focus();
            return;
        }
        
        if (price < 0) {
            this.showNotification('價格不能為負數', 'error');
            priceInput?.focus();
            return;
        }
        
        if (prepTime < 1 || prepTime > 120) {
            this.showNotification('準備時間請輸入 1-120 分鐘', 'error');
            prepTimeInput?.focus();
            return;
        }
        
        try {
            // 創建食物物件
            const foodData = { 
                name, 
                type,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat,
                price: price,
                prepTime: prepTime
            };
            
            console.log('💾 儲存食物資料:', foodData);
            
            // 新增到資料庫
            const foodId = await this.foodDB.addFood(foodData);
            
            console.log('✅ 食物新增成功，ID:', foodId);
            
            // 清空表單
            this.resetFoodForm();
            
            // 重新載入列表
            await this.loadFoods();
            
            this.showNotification(`「${name}」新增成功！`);
            
        } catch (error) {
            console.error('❌ 新增食物失敗:', error);
            this.showNotification('新增失敗，請重試', 'error');
        }
    }

    // 重置食物表單
    resetFoodForm() {
        const nameInput = document.getElementById('food-name');
        const typeSelect = document.getElementById('food-type');
        const caloriesInput = document.getElementById('food-calories');
        const priceInput = document.getElementById('food-price');
        const proteinInput = document.getElementById('food-protein');
        const carbsInput = document.getElementById('food-carbs');
        const fatInput = document.getElementById('food-fat');
        const prepTimeInput = document.getElementById('food-prepTime');
        
        if (nameInput) nameInput.value = '';
        if (typeSelect) typeSelect.value = '';
        if (caloriesInput) caloriesInput.value = '0';
        if (priceInput) priceInput.value = '0';
        if (proteinInput) proteinInput.value = '0';
        if (carbsInput) carbsInput.value = '0';
        if (fatInput) fatInput.value = '0';
        if (prepTimeInput) prepTimeInput.value = '10';
        
        // 焦點回到名稱輸入框
        if (nameInput) nameInput.focus();
        
        console.log('🔄 食物表單已重置');
    }

    // 刪除食物
    async deleteFood(id) {
        if (!confirm('確定要刪除這個食物嗎？')) {
            return;
        }
        
        try {
            await this.foodDB.deleteFood(id);
            await this.loadFoods();
            this.showNotification('食物刪除成功');
        } catch (error) {
            console.error('❌ 刪除食物失敗:', error);
            this.showNotification('刪除失敗，請重試', 'error');
        }
    }

    // 快速填寫模板
    fillTemplate(templateType) {
        console.log('📋 載入模板:', templateType);
        
        const templates = {
            healthy: {
                calories: 350,
                price: 80,
                protein: 25,
                carbs: 40,
                fat: 8,
                prepTime: 15
            },
            budget: {
                calories: 450,
                price: 50,
                protein: 15,
                carbs: 60,
                fat: 12,
                prepTime: 10
            },
            quick: {
                calories: 300,
                price: 60,
                protein: 12,
                carbs: 35,
                fat: 6,
                prepTime: 5
            },
            snack: {
                calories: 200,
                price: 40,
                protein: 5,
                carbs: 25,
                fat: 8,
                prepTime: 2
            }
        };
        
        const template = templates[templateType];
        if (template) {
            const caloriesInput = document.getElementById('food-calories');
            const priceInput = document.getElementById('food-price');
            const proteinInput = document.getElementById('food-protein');
            const carbsInput = document.getElementById('food-carbs');
            const fatInput = document.getElementById('food-fat');
            const prepTimeInput = document.getElementById('food-prepTime');
            
            if (caloriesInput) caloriesInput.value = template.calories;
            if (priceInput) priceInput.value = template.price;
            if (proteinInput) proteinInput.value = template.protein;
            if (carbsInput) carbsInput.value = template.carbs;
            if (fatInput) fatInput.value = template.fat;
            if (prepTimeInput) prepTimeInput.value = template.prepTime;
            
            console.log('✅ 模板載入完成:', template);
            this.showNotification(`已載入 ${templateType} 模板`);
        } else {
            console.warn('❌ 找不到模板:', templateType);
            this.showNotification('模板載入失敗', 'error');
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
            
            // 更新安裝按鈕顯示
            this.updateInstallButton();
        });
        
        // 檢測應用安裝狀態
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA 已安裝');
            this.deferredPrompt = null;
            this.updateInstallButton();
        });
    }

    // 更新安裝按鈕顯示
    updateInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (!installBtn) return;
        
        const platform = this.detectPlatform();
        
        if (this.deferredPrompt && !platform.isIOS) {
            installBtn.style.display = 'flex';
            installBtn.style.cursor = 'pointer';
        } else {
            installBtn.style.display = 'none';
        }
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
            this.deferredPrompt = null;
            this.updateInstallButton();
        } else {
            this.showNotification('安裝已取消', 'warning');
        }
    }

    // 分享連結
    shareLink() {
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: '今天吃什麼？ - 智慧美食決策助手',
                text: '試試這個智慧情境化的美食選擇器！',
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
        
        // 使用可靠的 QR Code 在線生成服務
        const encodedUrl = encodeURIComponent(url);
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodedUrl}&color=8B5FBF&bgcolor=ffffff&margin=10&format=png`;
        
        // 顯示載入狀態
        container.innerHTML = `
            <div class="qrcode-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>載入 QR Code...</span>
            </div>
        `;
        
        const img = new Image();
        img.src = qrCodeImageUrl;
        img.alt = '掃描安裝今天吃什麼 App';
        
        img.onload = () => {
            container.innerHTML = '';
            container.appendChild(img);
            
            const instruction = document.createElement('div');
            instruction.className = 'qrcode-instruction';
            instruction.innerHTML = '<i class="fas fa-mobile-alt"></i><span>用手機相機掃描安裝</span>';
            container.appendChild(instruction);
        };
        
        img.onerror = () => {
            this.generateFallbackQRCode();
        };
        
        setTimeout(() => {
            if (!img.complete) {
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
            <div class="qrcode-fallback">
                <div class="fallback-icon">🍴</div>
                <div class="fallback-title">今天吃什麼？</div>
                <div class="fallback-url">${shortUrl}</div>
            </div>
            <div class="qrcode-instruction">
                <i class="fas fa-link"></i>
                <span>請手動複製網址</span>
            </div>
        `;
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

    // 檢測裝置平台
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        // 改進的 iOS 檢測
        const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
                      (/mac/.test(platform) && navigator.maxTouchPoints > 1);
        
        // 改進的 Android 檢測
        const isAndroid = /android/.test(userAgent) && !/windows/.test(userAgent);
        
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
        
        console.log('📱 檢測到平台:', platform);
        
        // 重置顯示狀態
        if (iosGuide) iosGuide.style.display = 'none';
        if (androidGuide) androidGuide.style.display = 'none';
        
        // 根據平台顯示指引
        if (platform.isIOS) {
            if (iosGuide) {
                iosGuide.style.display = 'block';
                iosGuide.classList.add('ios-guide');
            }
        } else if (platform.isAndroid) {
            if (androidGuide) {
                androidGuide.style.display = 'block';
                androidGuide.classList.add('android-guide');
            }
        } else {
            // 其他平台顯示兩個指引
            if (iosGuide) {
                iosGuide.style.display = 'block';
                iosGuide.classList.add('ios-guide');
            }
            if (androidGuide) {
                androidGuide.style.display = 'block';
                androidGuide.classList.add('android-guide');
            }
        }
        
        // 更新安裝按鈕
        this.updateInstallButton();
        
        // 顯示平台提示
        this.showPlatformHint(platform);
    }

    // 顯示平台提示
    showPlatformHint(platform) {
        console.log('📱 顯示平台提示:', platform);
        
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
                <i class="fab fa-apple"></i>
                <strong>檢測到 iOS 設備：</strong>請使用 Safari 的「加入主畫面」功能安裝
            `;
        } else if (platform.isAndroid) {
            hint.className = 'platform-hint android';
            hint.innerHTML = `
                <i class="fab fa-android"></i>
                <strong>檢測到 Android 設備：</strong>點擊「安裝App」按鈕或使用瀏覽器安裝功能
            `;
        } else {
            hint.className = 'platform-hint other';
            hint.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <strong>提示：</strong>請用手機瀏覽器訪問此頁面以安裝App
            `;
        }
        
        // 安全地插入到第一個卡片之前
        const firstCard = sharePage.querySelector('.share-card');
        if (firstCard) {
            sharePage.insertBefore(hint, firstCard);
            console.log('✅ 平台提示插入成功');
        } else {
            // 如果找不到第一個卡片，添加到開頭
            sharePage.insertBefore(hint, sharePage.firstChild);
            console.log('✅ 平台提示添加到開頭');
        }
    }
}

// 應用啟動
function initApp() {
    console.log('🔧 開始初始化應用...');
    
    const requiredElements = [
        'notification', 'notification-text', 'next0', 'next1',
        'picker-page', 'manage-page', 'preferences-page', 'share-page'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.warn('❌ 缺少必要元素:', missingElements);
        // 重試初始化
        setTimeout(initApp, 100);
        return;
    }
    
    console.log('✅ 所有必要元素已載入，啟動應用...');
    
    try {
        window.foodPickerApp = new FoodPickerApp();
    } catch (error) {
        console.error('❌ 應用啟動失敗:', error);
        // 顯示錯誤訊息給用戶
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        if (notification && notificationText) {
            notificationText.textContent = '應用啟動失敗，請重新整理頁面';
            notification.className = 'notification error show';
        }
    }
}

// 改進的啟動邏輯
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM 已經就緒
    setTimeout(initApp, 100);
}