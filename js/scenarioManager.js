// 情境管理器 - 完整修復版
class ScenarioManager {
    constructor() {
        this.currentScenario = 'all';
        this.currentCustomList = null;
        this.settings = this.loadSettings();
        this.preferences = this.loadPreferences();
        console.log('✅ 情境管理器初始化完成');
    }

    // 載入設定
    loadSettings() {
        const defaultSettings = {
            calorieLimit: 500,
            priceLimit: 100,
            timeLimit: 15
        };
        
        try {
            const savedSettings = JSON.parse(localStorage.getItem('scenarioSettings') || '{}');
            
            return {
                calorieLimit: parseInt(localStorage.getItem('calorieLimit')) || savedSettings.calorieLimit || defaultSettings.calorieLimit,
                priceLimit: parseInt(localStorage.getItem('priceLimit')) || savedSettings.priceLimit || defaultSettings.priceLimit,
                timeLimit: parseInt(localStorage.getItem('timeLimit')) || savedSettings.timeLimit || defaultSettings.timeLimit
            };
        } catch (error) {
            console.error('❌ 載入設定失敗，使用預設值:', error);
            return defaultSettings;
        }
    }

    // 載入偏好設定
    loadPreferences() {
        const defaultPreferences = {
            favorites: new Set(),
            blacklist: new Set(),
            customLists: {}
        };
        
        try {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const blacklist = JSON.parse(localStorage.getItem('blacklist') || '[]');
            const customLists = JSON.parse(localStorage.getItem('customLists') || '{}');
            
            return {
                favorites: new Set(favorites),
                blacklist: new Set(blacklist),
                customLists: customLists
            };
        } catch (error) {
            console.error('❌ 載入偏好設定失敗，使用預設值:', error);
            return defaultPreferences;
        }
    }

    // 儲存設定
    saveSettings() {
        try {
            localStorage.setItem('calorieLimit', this.settings.calorieLimit.toString());
            localStorage.setItem('priceLimit', this.settings.priceLimit.toString());
            localStorage.setItem('timeLimit', this.settings.timeLimit.toString());
            localStorage.setItem('scenarioSettings', JSON.stringify(this.settings));
            console.log('💾 設定已保存:', this.settings);
        } catch (error) {
            console.error('❌ 儲存設定失敗:', error);
        }
    }

    // 儲存偏好
    savePreferences() {
        try {
            localStorage.setItem('favorites', JSON.stringify([...this.preferences.favorites]));
            localStorage.setItem('blacklist', JSON.stringify([...this.preferences.blacklist]));
            localStorage.setItem('customLists', JSON.stringify(this.preferences.customLists));
            console.log('💾 偏好設定已保存');
        } catch (error) {
            console.error('❌ 儲存偏好設定失敗:', error);
        }
    }

    // 設定情境
    setScenario(scenario, customList = null) {
        const validScenarios = ['all', 'favorites', 'healthy', 'budget', 'quick', 'custom'];
        
        if (!validScenarios.includes(scenario)) {
            console.warn('⚠️ 無效的情境:', scenario, '使用預設情境: all');
            scenario = 'all';
        }
        
        this.currentScenario = scenario;
        this.currentCustomList = customList;
        
        console.log(`🎯 設定情境: ${scenario}`, customList ? `自訂清單: ${customList}` : '');
    }

    // 添加到最愛
    addFavorite(foodName) {
        if (!foodName || !foodName.trim()) {
            console.warn('⚠️ 無效的食物名稱');
            return false;
        }
        
        const name = foodName.trim();
        this.preferences.favorites.add(name);
        this.savePreferences();
        console.log('❤️ 加入最愛:', name);
        return true;
    }

    // 移除最愛
    removeFavorite(foodName) {
        if (!foodName) return false;
        
        const removed = this.preferences.favorites.delete(foodName);
        if (removed) {
            this.savePreferences();
            console.log('💔 移除最愛:', foodName);
        }
        return removed;
    }

    // 添加到黑名單
    addToBlacklist(foodName) {
        if (!foodName || !foodName.trim()) {
            console.warn('⚠️ 無效的食物名稱');
            return false;
        }
        
        const name = foodName.trim();
        this.preferences.blacklist.add(name);
        this.savePreferences();
        console.log('🚫 加入黑名單:', name);
        return true;
    }

    // 從黑名單移除
    removeFromBlacklist(foodName) {
        if (!foodName) return false;
        
        const removed = this.preferences.blacklist.delete(foodName);
        if (removed) {
            this.savePreferences();
            console.log('✅ 從黑名單移除:', foodName);
        }
        return removed;
    }

    // 創建自訂清單
    createCustomList(listName, foods = []) {
        if (!listName || !listName.trim()) {
            console.warn('⚠️ 無效的清單名稱');
            return false;
        }
        
        const name = listName.trim();
        
        if (this.preferences.customLists[name]) {
            console.warn('⚠️ 清單名稱已存在:', name);
            return false;
        }
        
        this.preferences.customLists[name] = Array.isArray(foods) ? foods : [];
        this.savePreferences();
        console.log('📝 創建自訂清單:', name, '項目數:', foods.length);
        return true;
    }

    // 添加到自訂清單
    addToCustomList(listName, foodName) {
        if (!listName || !foodName || !foodName.trim()) {
            console.warn('⚠️ 無效的清單名稱或食物名稱');
            return false;
        }
        
        const name = foodName.trim();
        
        if (!this.preferences.customLists[listName]) {
            this.preferences.customLists[listName] = [];
        }
        
        if (!this.preferences.customLists[listName].includes(name)) {
            this.preferences.customLists[listName].push(name);
            this.savePreferences();
            console.log(`📝 添加到清單 ${listName}:`, name);
            return true;
        }
        
        return false;
    }

    // 從自訂清單移除
    removeFromCustomList(listName, foodName) {
        if (!listName || !foodName) return false;
        
        if (this.preferences.customLists[listName]) {
            const originalLength = this.preferences.customLists[listName].length;
            this.preferences.customLists[listName] = this.preferences.customLists[listName].filter(f => f !== foodName);
            
            if (this.preferences.customLists[listName].length !== originalLength) {
                this.savePreferences();
                console.log(`📝 從清單 ${listName} 移除:`, foodName);
                return true;
            }
        }
        
        return false;
    }

    // 過濾食物基於當前情境 - 修復版
    filterFoods(foods) {
        if (!Array.isArray(foods)) {
            console.warn('⚠️ 過濾的食物資料不是陣列');
            return [];
        }
        
        let filtered = [...foods];
        
        console.log(`🎯 開始情境過濾: ${this.currentScenario}, 原始數量: ${filtered.length}`);

        // 先移除黑名單食物
        if (this.preferences.blacklist.size > 0) {
            filtered = filtered.filter(food => {
                const isBlacklisted = this.preferences.blacklist.has(food.name);
                if (isBlacklisted) {
                    console.log(`🚫 過濾黑名單食物: ${food.name}`);
                }
                return !isBlacklisted;
            });
            console.log(`🔹 黑名單過濾後: ${filtered.length} 項`);
        }

        // 根據情境進一步過濾
        switch (this.currentScenario) {
            case 'favorites':
                if (this.preferences.favorites.size > 0) {
                    filtered = filtered.filter(food => {
                        const isFavorite = this.preferences.favorites.has(food.name);
                        if (!isFavorite) {
                            console.log(`💔 過濾非最愛食物: ${food.name}`);
                        }
                        return isFavorite;
                    });
                }
                break;
                
            case 'healthy':
                filtered = filtered.filter(food => {
                    const calories = food.calories || 0;
                    const isValid = calories <= this.settings.calorieLimit;
                    if (!isValid) {
                        console.log(`🥗 過濾高熱量食物: ${food.name} (${calories} > ${this.settings.calorieLimit})`);
                    }
                    return isValid;
                });
                break;
                
            case 'budget':
                // 修復省錢模式：確保 price 屬性存在且為數字
                filtered = filtered.filter(food => {
                    const price = food.price || 0;
                    const isValid = price <= this.settings.priceLimit;
                    if (!isValid) {
                        console.log(`💰 過濾高價食物: ${food.name} (${price} > ${this.settings.priceLimit})`);
                    }
                    return isValid;
                });
                break;
                
            case 'quick':
                filtered = filtered.filter(food => {
                    const prepTime = food.prepTime || 0;
                    const isValid = prepTime <= this.settings.timeLimit;
                    if (!isValid) {
                        console.log(`⚡ 過濾長時間食物: ${food.name} (${prepTime} > ${this.settings.timeLimit})`);
                    }
                    return isValid;
                });
                break;
                
            case 'custom':
                if (this.currentCustomList && this.preferences.customLists[this.currentCustomList]) {
                    const listFoods = this.preferences.customLists[this.currentCustomList];
                    const listFoodSet = new Set(listFoods);
                    
                    filtered = filtered.filter(food => {
                        const isInList = listFoodSet.has(food.name);
                        if (!isInList) {
                            console.log(`📝 過濾非清單食物: ${food.name}`);
                        }
                        return isInList;
                    });
                }
                break;
                
            case 'all':
            default:
                // 不過濾，保持所有食物
                console.log('🎲 全部隨機模式，不過濾食物');
                break;
        }

        console.log(`✅ 情境過濾完成: ${this.currentScenario}, 最終數量: ${filtered.length}`);
        return filtered;
    }

    // 取得情境顯示名稱
    getScenarioDisplayName() {
        const names = {
            'all': '🎲 全部隨機',
            'favorites': '❤️ 我的最愛',
            'healthy': '🥗 健康模式',
            'budget': '💰 省錢模式',
            'quick': '⚡ 快速模式',
            'custom': `📝 自訂清單: ${this.currentCustomList || '未選擇'}`
        };
        return names[this.currentScenario] || '❓ 未知模式';
    }

    // 檢查食物是否在最愛中
    isFavorite(foodName) {
        return this.preferences.favorites.has(foodName);
    }

    // 檢查食物是否在黑名單中
    isBlacklisted(foodName) {
        return this.preferences.blacklist.has(foodName);
    }

    // 獲取情境統計資訊
    getScenarioStats() {
        return {
            favoritesCount: this.preferences.favorites.size,
            blacklistCount: this.preferences.blacklist.size,
            customListsCount: Object.keys(this.preferences.customLists).length,
            currentScenario: this.currentScenario,
            settings: { ...this.settings }
        };
    }

    // 重置所有偏好設定
    resetAllPreferences() {
        this.preferences = {
            favorites: new Set(),
            blacklist: new Set(),
            customLists: {}
        };
        this.savePreferences();
        console.log('🔄 所有偏好設定已重置');
    }

    // 重置設定為預設值
    resetSettings() {
        this.settings = {
            calorieLimit: 500,
            priceLimit: 100,
            timeLimit: 15
        };
        this.saveSettings();
        console.log('🔄 設定已重置為預設值');
    }
}