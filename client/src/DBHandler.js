import { get, set, del } from 'idb-keyval';

export const DB_KEYS = {
    PROFILE: 'dechat_profile',
    SETTINGS: 'dechat_settings',
    CHAT_HISTORY: 'dechat_history_cache'
};

export const DBHandler = {
    // Save a keyval pair to DB
    async put(key, value){
        try {
            await set(key, value);
            console.log(`DB: Saved [${key}]`);
            return true;
        } catch (error) {
            console.error(`DB ERROR: Failed to save [${key}]`, error);
            return false;
        }
    },

    // Retrive a keyval pair from DB
    async get(key) {
        try {
            const data = await get(key);
            return data !== undefined ? data : null;
        } catch (error) {
            console.error(`DB ERROR: Failed to retrive [${key}]`, error);
            return null;
        }
    },

    // Remove a keyval pair from DB
    async rem(key) {
        try {
            await del(key);
            console.log(`DB: Deleted [${key}]`);
            return true;
        } catch (error) {
            console.error(`DB ERROR: Failed to remove [${key}]`, error);
            return false;
        }
    },

    async has(key) {
        const data = await this.get(key);
        return data !== null;
    }
}