// 資料庫管理 - 修復版
class FoodDB {
    constructor() {
        this.DB_NAME = 'FoodPickerPro';
        this.DB_VERSION = 8; // 再次增加版本號
        this.STORE_NAME = 'foods';
        this.db = null;
        this.isInitialized = false;
        this.connectionPromise = null;
    }

    
    
// 修復連線狀態檢查方法
    isConnected() {
    // 簡化檢查，只要 db 存在就認為是連線的
    return this.db !== null;
}
    // 修復初始化方法
    async init() {
        // 如果已經在初始化中，返回同一個 Promise
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            // 如果已經連線，直接返回
            if (this.isConnected()) {
                console.log('✅ 資料庫已經連線');
                resolve(this.db);
                return;
            }
            
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = (event) => {
                console.error('❌ 資料庫開啟失敗:', request.error);
                this.connectionPromise = null;
                reject(request.error);
            };
            
            request.onsuccess = (event) => {
                this.db = request.result;
                this.isInitialized = true;
                
                // 添加資料庫事件監聽
                this.db.onerror = (dbError) => {
                    console.error('❌ 資料庫錯誤:', dbError);
                };
                
                this.db.onversionchange = () => {
                    console.log('🔄 資料庫版本變更，建議重新載入頁面');
                    this.db.close();
                };
                
                console.log('✅ 資料庫開啟成功，狀態:', this.getDBState());
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;
                console.log('🔄 資料庫升級，版本:', oldVersion, '→', this.DB_VERSION);
                
                // 檢查是否需要創建新的物件儲存庫
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    console.log('📦 創建新的物件儲存庫');
                    const store = db.createObjectStore(this.STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // 創建索引
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('calories', 'calories', { unique: false });
                    store.createIndex('price', 'price', { unique: false });
                    store.createIndex('prepTime', 'prepTime', { unique: false });
                    
                    console.log('✅ 物件儲存庫建立完成');
                    
                    // 只在首次創建時添加預設食物
                    this.addDefaultFoods(store);
                } else {
                    console.log('✅ 物件儲存庫已存在，保留現有資料');
                    
                    // 版本升級時只添加新索引，不刪除資料
                    const transaction = event.target.transaction;
                    const store = transaction.objectStore(this.STORE_NAME);
                    
                    // 檢查並添加可能缺少的索引
                    this.upgradeDatabaseIndexes(store, oldVersion);
                }
            };
            
            request.onblocked = () => {
                console.warn('⚠️ 資料庫升級被阻擋，請關閉其他標籤頁');
                this.connectionPromise = null;
            };
        });

        return this.connectionPromise;
    }

    // 獲取資料庫狀態文字
    getDBState() {
        if (!this.db) return '未連線';
        switch(this.db.readyState) {
            case 'open': return '已連線';
            case 'closed': return '已關閉';
            case 'opening': return '連線中';
            case 'closing': return '關閉中';
            default: return '未知狀態';
        }
    }

    // 升級資料庫索引（不刪除資料）
    upgradeDatabaseIndexes(store, oldVersion) {
        console.log('🔧 升級資料庫索引，舊版本:', oldVersion);
        
        try {
            // 檢查並添加 prepTime 索引（如果從舊版本升級）
            if (oldVersion < 5) {
                try {
                    store.createIndex('prepTime', 'prepTime', { unique: false });
                    console.log('✅ 新增 prepTime 索引');
                } catch (e) {
                    console.log('ℹ️ prepTime 索引已存在');
                }
            }
            
            // 檢查現有資料數量
            const countRequest = store.count();
            countRequest.onsuccess = () => {
                console.log(`📊 當前資料庫中有 ${countRequest.result} 筆食物資料`);
                
                // 如果資料庫是空的，添加預設食物
                if (countRequest.result === 0) {
                    console.log('📝 資料庫為空，添加預設食物');
                    this.addDefaultFoods(store);
                } else {
                    console.log('✅ 保留現有食物資料');
                }
            };
            
        } catch (error) {
            console.error('❌ 升級資料庫索引失敗:', error);
        }
    }

    // 添加預設食物資料（只在空資料庫時執行）
    addDefaultFoods(store) {
        const defaultFoods = [
            // 正餐 - 飯類
            { name: '雞肉飯', type: 'meal-rice', calories: 450, protein: 25, carbs: 55, fat: 12, price: 60, prepTime: 10 },
            { name: '滷肉飯', type: 'meal-rice', calories: 550, protein: 15, carbs: 65, fat: 25, price: 45, prepTime: 5 },
            { name: '咖哩飯', type: 'meal-rice', calories: 600, protein: 20, carbs: 75, fat: 18, price: 80, prepTime: 12 },
            { name: '炒飯', type: 'meal-rice', calories: 650, protein: 18, carbs: 85, fat: 20, price: 70, prepTime: 8 },
            
            // 正餐 - 麵類
            { name: '牛肉麵', type: 'meal-noodle', calories: 700, protein: 35, carbs: 80, fat: 22, price: 120, prepTime: 15 },
            { name: '榨菜肉絲麵', type: 'meal-noodle', calories: 480, protein: 22, carbs: 65, fat: 15, price: 65, prepTime: 8 },
            { name: '義大利麵', type: 'meal-noodle', calories: 520, protein: 20, carbs: 70, fat: 16, price: 90, prepTime: 12 },
            { name: '乾麵', type: 'meal-noodle', calories: 420, protein: 15, carbs: 60, fat: 14, price: 45, prepTime: 5 },
            
            // 正餐 - 其他
            { name: '水餃', type: 'meal-other', calories: 350, protein: 18, carbs: 40, fat: 12, price: 60, prepTime: 10 },
            { name: '漢堡', type: 'meal-other', calories: 550, protein: 25, carbs: 45, fat: 28, price: 85, prepTime: 8 },
            { name: '披薩', type: 'meal-other', calories: 280, protein: 12, carbs: 35, fat: 10, price: 70, prepTime: 15 },
            { name: '壽司', type: 'meal-other', calories: 320, protein: 20, carbs: 50, fat: 5, price: 150, prepTime: 5 },
            
            // 點心 - 甜食
            { name: '蛋糕', type: 'snack-sweet', calories: 350, protein: 5, carbs: 45, fat: 16, price: 65, prepTime: 2 },
            { name: '冰淇淋', type: 'snack-sweet', calories: 200, protein: 4, carbs: 25, fat: 10, price: 45, prepTime: 1 },
            { name: '甜甜圈', type: 'snack-sweet', calories: 250, protein: 3, carbs: 30, fat: 12, price: 35, prepTime: 2 },
            
            // 點心 - 鹹食
            { name: '鹹酥雞', type: 'snack-salty', calories: 450, protein: 25, carbs: 20, fat: 30, price: 65, prepTime: 8 },
            { name: '薯條', type: 'snack-salty', calories: 320, protein: 4, carbs: 35, fat: 16, price: 45, prepTime: 6 },
            { name: '雞排', type: 'snack-salty', calories: 550, protein: 35, carbs: 25, fat: 35, price: 75, prepTime: 10 },
            
            // 點心 - 飲品
            { name: '珍珠奶茶', type: 'snack-drink', calories: 350, protein: 2, carbs: 65, fat: 8, price: 55, prepTime: 5 },
            { name: '果汁', type: 'snack-drink', calories: 120, protein: 1, carbs: 28, fat: 0, price: 40, prepTime: 3 },
            { name: '咖啡', type: 'snack-drink', calories: 5, protein: 0, carbs: 1, fat: 0, price: 50, prepTime: 4 },
            { name: '氣泡飲', type: 'snack-drink', calories: 150, protein: 0, carbs: 38, fat: 0, price: 35, prepTime: 1 }
        ];

        console.log('📝 開始添加預設食物資料...');
        let addedCount = 0;
        
        defaultFoods.forEach(food => {
            const request = store.add(food);
            request.onsuccess = () => {
                addedCount++;
                if (addedCount === defaultFoods.length) {
                    console.log(`✅ 預設食物資料添加完成，共 ${addedCount} 項`);
                }
            };
            request.onerror = (e) => {
                console.warn('⚠️ 添加食物失敗:', food.name, e.target.error);
            };
        });
    }

    // 修復獲取所有食物方法
    async getAllFoods() {
        // 確保資料庫已連線
        if (!this.isConnected()) {
            console.log('🔄 資料庫未連線，重新初始化...');
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    console.log(`✅ 獲取所有食物成功，共 ${request.result.length} 項`);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('❌ 獲取所有食物失敗:', request.error);
                    reject(request.error);
                };
                
                transaction.onerror = () => {
                    console.error('❌ 交易失敗:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                console.error('❌ 獲取食物時發生錯誤:', error);
                reject(error);
            }
        });
    }

    // 修復其他資料庫操作方法
    async getFoodsByType(type) {
        if (!this.isConnected()) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('type');
                const request = index.getAll(type);
                
                request.onsuccess = () => {
                    console.log(`✅ 根據類型獲取食物成功: ${type}, 共 ${request.result.length} 項`);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('❌ 根據類型獲取食物失敗:', request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error('❌ 根據類型獲取食物時發生錯誤:', error);
                reject(error);
            }
        });
    }

    // 修復新增食物方法
    async addFood(food) {
        if (!this.isConnected()) {
            await this.init();
        }
        
        // 資料驗證
        if (!food.name || !food.name.trim()) {
            throw new Error('食物名稱不能為空');
        }
        
        if (!food.type) {
            throw new Error('食物類型不能為空');
        }
        
        // 確保數值型欄位有預設值
        const foodData = {
            name: food.name.trim(),
            type: food.type,
            calories: parseInt(food.calories) || 0,
            protein: parseFloat(food.protein) || 0,
            carbs: parseFloat(food.carbs) || 0,
            fat: parseFloat(food.fat) || 0,
            price: parseInt(food.price) || 0,
            prepTime: parseInt(food.prepTime) || 10
        };
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.add(foodData);
                
                request.onsuccess = () => {
                    console.log('✅ 新增食物成功，ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('❌ 新增食物失敗:', request.error);
                    reject(request.error);
                };
                
                transaction.oncomplete = () => {
                    console.log('💾 食物資料已保存');
                };
            } catch (error) {
                console.error('❌ 新增食物時發生錯誤:', error);
                reject(error);
            }
        });
    }

    // 修復刪除食物方法
    async deleteFood(id) {
        if (!this.isConnected()) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.delete(id);
                
                request.onsuccess = () => {
                    console.log('✅ 刪除食物成功，ID:', id);
                    resolve();
                };
                
                request.onerror = () => {
                    console.error('❌ 刪除食物失敗:', request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error('❌ 刪除食物時發生錯誤:', error);
                reject(error);
            }
        });
    }

    // 重新初始化資料庫（包含預設食物）
    async reinitializeWithDefaultFoods() {
        console.log('🔄 重新初始化資料庫並添加預設食物...');
        
        try {
            // 先關閉現有連線
            if (this.db) {
                this.db.close();
                this.db = null;
                this.isInitialized = false;
                this.connectionPromise = null;
            }
            
            // 刪除現有資料庫
            await new Promise((resolve, reject) => {
                const deleteRequest = indexedDB.deleteDatabase(this.DB_NAME);
                deleteRequest.onsuccess = () => {
                    console.log('✅ 舊資料庫刪除成功');
                    resolve();
                };
                deleteRequest.onerror = () => {
                    console.error('❌ 刪除舊資料庫失敗');
                    reject();
                };
                deleteRequest.onblocked = () => {
                    console.log('⚠️ 資料庫刪除被阻擋，請關閉其他標籤頁');
                    resolve(); // 仍然繼續
                };
            });
            
            // 等待一下確保刪除完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 重新初始化
            await this.init();
            
            console.log('✅ 資料庫重新初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 重新初始化資料庫失敗:', error);
            return false;
        }
    }
    // 添加缺少的 getFoodByName 方法
    async getFoodByName(name) {
        if (!this.isConnected()) {
            await this.init();
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('name');
                const request = index.get(name);
                
                request.onsuccess = () => {
                    console.log(`✅ 根據名稱獲取食物: ${name}`, request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('❌ 根據名稱獲取食物失敗:', request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error('❌ 根據名稱獲取食物時發生錯誤:', error);
                reject(error);
            }
        });
    }
    // 其他方法保持不變...
    async updateFood(food) {
        if (!this.isConnected()) {
            await this.init();
        }
        
        if (!food.id) {
            throw new Error('食物 ID 不能為空');
        }
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.put(food);
                
                request.onsuccess = () => {
                    console.log('✅ 更新食物成功，ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('❌ 更新食物失敗:', request.error);
                    reject(request.error);
                };
            } catch (error) {
                console.error('❌ 更新食物時發生錯誤:', error);
                reject(error);
            }
        });
    }

    // 關閉資料庫連線
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            this.connectionPromise = null;
            console.log('✅ 資料庫連線已關閉');
        }
    }
}