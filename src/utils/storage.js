/**
 * Storage Utility for Gemini Folders
 * Wrapper around chrome.storage.sync (Cloud Sync)
 */

const STORAGE_KEY = 'gemini_folders_data';
// We use sync storage for cloud backup
const STORAGE_AREA = chrome.storage.sync;
// Fallback/Legacy storage
const LOCAL_STORAGE = chrome.storage.local;

// Helper to normalized URL storage (save space)
const APP_URL_PREFIX = 'https://gemini.google.com/app/';

// Listen for Cloud Changes (Cross-device sync)
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[STORAGE_KEY]) {
        console.log('Gemini Folders: Cloud data changed', changes[STORAGE_KEY]);
        const newData = changes[STORAGE_KEY].newValue;
        if (newData) {
            // Hydrate URLs before dispatching
            if (newData.folders) {
                newData.folders.forEach(folder => {
                    if (folder.chats) {
                        folder.chats.forEach(chat => {
                            if (!chat.url && chat.id) {
                                chat.url = APP_URL_PREFIX + chat.id;
                            }
                        });
                    }
                });
            }
            // Dispatch event so content.js can re-render
            window.dispatchEvent(new CustomEvent('gemini-storage-updated', { detail: newData }));
        }
    }
});

export const Storage = {
    /**
     * Dispatch events for UI updates
     */
    notify: (type, detail = null) => {
        window.dispatchEvent(new CustomEvent(`gemini-storage-${type}`, { detail }));
    },

    /**
     * Get all data: { folders: [], lastSynced: <timestamp> }
     * Folder structure: { id, name, chats: [{id, title}] } - URLs are reconstructed
     */
    get: async () => {
        return new Promise((resolve) => {
            STORAGE_AREA.get([STORAGE_KEY], async (result) => {
                let data = result[STORAGE_KEY];

                // --- MIGRATION LOGIC ---
                if (!data) {
                    // Check local storage for migration
                    const localData = await new Promise(res => LOCAL_STORAGE.get([STORAGE_KEY], r => res(r[STORAGE_KEY])));
                    if (localData && localData.folders && localData.folders.length > 0) {
                        console.log('Gemini Folders: Migrating from Local to Sync...');
                        localData.lastSynced = Date.now(); // Add timestamp
                        await Storage.set(localData); // logic inside set() helps normalize
                        data = localData;
                    } else {
                        data = { folders: [], lastSynced: null };
                    }
                }
                // -----------------------

                // Reconstruct URLs (Hydration)
                if (data && data.folders) {
                    data.folders.forEach(folder => {
                        if (folder.chats) {
                            folder.chats.forEach(chat => {
                                if (!chat.url && chat.id) {
                                    chat.url = APP_URL_PREFIX + chat.id;
                                }
                            });
                        }
                    });
                }

                resolve(data || { folders: [] });
            });
        });
    },

    /**
     * Save data
     * Includes Normalization (Stripping URLs)
     */
    set: async (data) => {
        Storage.notify('saving');

        // Deep copy to facilitate modification without affecting UI state object immediately
        const dataToSave = JSON.parse(JSON.stringify(data));

        // Update Timestamp
        dataToSave.lastSynced = Date.now();

        // Normalize: Strip URLs to save space
        if (dataToSave.folders) {
            dataToSave.folders.forEach(folder => {
                if (folder.chats) {
                    folder.chats.forEach(chat => {
                        // If it's a standard gemini URL, strip it
                        if (chat.url && chat.url.startsWith(APP_URL_PREFIX)) {
                            delete chat.url;
                        }
                    });
                }
            });
        }

        return new Promise((resolve, reject) => {
            STORAGE_AREA.set({ [STORAGE_KEY]: dataToSave }, () => {
                if (chrome.runtime.lastError) {
                    const errMsg = chrome.runtime.lastError.message;
                    console.error('Gemini Folders Sync Error:', errMsg);

                    let userFriendlyError = errMsg;
                    if (errMsg.includes('QUOTA_BYTES')) {
                        userFriendlyError = 'Cloud storage exceeded. Please delete some chats/folders.';
                    }

                    Storage.notify('error', userFriendlyError);
                    resolve(); // Resolve anyway so app doesn't crash, but UI shows error
                } else {
                    Storage.notify('saved', { lastSynced: dataToSave.lastSynced });
                    // Optional: Clear local storage after successful sync to clean up?
                    // LOCAL_STORAGE.remove(STORAGE_KEY); 
                    resolve();
                }
            });
        });
    },

    /**
     * Add a new folder
     */
    addFolder: async (name) => {
        const data = await Storage.get();
        const newFolder = {
            id: 'folder_' + Date.now(),
            name: name,
            chats: []
        };
        data.folders.push(newFolder);
        await Storage.set(data);
        return data;
    },

    /**
     * Remove a folder
     */
    removeFolder: async (folderId) => {
        const data = await Storage.get();
        data.folders = data.folders.filter(f => f.id !== folderId);
        await Storage.set(data);
        return data;
    },

    /**
     * Rename folder
     */
    renameFolder: async (folderId, newName) => {
        const data = await Storage.get();
        const folder = data.folders.find(f => f.id === folderId);
        if (folder) {
            folder.name = newName;
        }
        await Storage.set(data);
        return data;
    },

    /**
    * Rename chat (Alias)
    */
    renameChat: async (folderId, chatId, newName) => {
        const data = await Storage.get();
        const folder = data.folders.find(f => f.id === folderId);
        if (folder) {
            const chat = folder.chats.find(c => c.id === chatId);
            if (chat) {
                chat.title = newName;
            }
        }
        await Storage.set(data);
        return data;
    },

    /**
     * Add chat to folder (Move logic)
       * @param {Object} chatObj - { id, title, url }
       * @param {String} folderId
       */
    addChatToFolder: async (chatObj, folderId) => {
        const data = await Storage.get();

        // Remove chat from all folders first (Move logic)
        data.folders.forEach(f => {
            f.chats = f.chats.filter(c => c.id !== chatObj.id);
        });

        if (folderId === 'remove_from_folders') {
            await Storage.set(data);
            return data;
        }

        // Add to target folder
        const folder = data.folders.find(f => f.id === folderId);
        if (folder) {
            // Ensure specific chat object isn't duplicated
            if (!folder.chats.find(c => c.id === chatObj.id)) {
                // Ensure we save the URL temporarily so it renders, 
                // but .set() will strip it if it matches prefix
                folder.chats.push(chatObj);
            }
        }
        await Storage.set(data);
        return data;
    }
};
