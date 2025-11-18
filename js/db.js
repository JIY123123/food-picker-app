// 資料庫管理
class FoodDB {
    constructor() {
        this.DB_NAME = 'FoodPickerDB';
        this.DB_VERSION = 2;
        this.STORE_NAME = 'foods';
        this.db = null;
    }

    // 初始化資料庫
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('資料庫開啟失敗:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('資料庫開啟成功');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('資料庫升級，版本:', event.oldVersion, '→', event.newVersion);
                
                // 刪除舊的物件儲存庫（如果存在）
                if (db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.deleteObjectStore(this.STORE_NAME);
                }
                
                // 建立新的物件儲存庫
                const store = db.createObjectStore(this.STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // 建立索引
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('name', 'name', { unique: false });
                
                console.log('物件儲存庫建立完成');
                
                // 添加預設資料
                this.addDefaultFoods(store);
            };
        });
    }

    // 添加預設食物
    addDefaultFoods(store) {
        const defaultFoods = [
            // 正餐 - 飯類
            { name: '滷肉飯', type: 'meal-rice' },
            { name: '雞肉飯', type: 'meal-rice' },
            { name: '炒飯', type: 'meal-rice' },
            { name: '燴飯', type: 'meal-rice' },
            { name: '咖哩飯', type: 'meal-rice' },
            
            // 正餐 - 麵類
            { name: '牛肉麵', type: 'meal-noodle' },
            { name: '榨菜肉絲麵', type: 'meal-noodle' },
            { name: '義大利麵', type: 'meal-noodle' },
            { name: '拉麵', type: 'meal-noodle' },
            { name: '炒麵', type: 'meal-noodle' },
            
            // 正餐 - 其他
            { name: '水餃', type: 'meal-other' },
            { name: '漢堡', type: 'meal-other' },
            { name: '披薩', type: 'meal-other' },
            { name: '壽司', type: 'meal-other' },
            { name: '小火鍋', type: 'meal-other' },
            
            // 點心 - 甜食
            { name: '蛋糕', type: 'snack-sweet' },
            { name: '冰淇淋', type: 'snack-sweet' },
            { name: '甜甜圈', type: 'snack-sweet' },
            { name: '布丁', type: 'snack-sweet' },
            { name: '餅乾', type: 'snack-sweet' },
            
            // 點心 - 鹹食
            { name: '鹹酥雞', type: 'snack-salty' },
            { name: '薯條', type: 'snack-salty' },
            { name: '洋芋片', type: 'snack-salty' },
            { name: '爆米花', type: 'snack-salty' },
            { name: '雞排', type: 'snack-salty' },
            
            // 點心 - 飲品
            { name: '珍珠奶茶', type: 'snack-drink' },
            { name: '果汁', type: 'snack-drink' },
            { name: '咖啡', type: 'snack-drink' },
            { name: '氣泡飲', type: 'snack-drink' },
            { name: '冰沙', type: 'snack-drink' }
        ];

        defaultFoods.forEach(food => {
            store.add(food);
        });
        
        console.log('預設食物資料已添加');
    }

    // 獲取所有食物
    async getAllFoods() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 根據類型獲取食物
    async getFoodsByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const index = store.index('type');
            const request = index.getAll(type);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 新增食物
    async addFood(food) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.add(food);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 刪除食物
    async deleteFood(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 更新食物
    async updateFood(food) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put(food);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// 創建全局資料庫實例
const foodDB = new FoodDB();