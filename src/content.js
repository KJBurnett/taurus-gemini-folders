(async () => {
    const { Selectors, waitForElement } = await import(chrome.runtime.getURL('src/utils/dom.js'));
    const { Storage } = await import(chrome.runtime.getURL('src/utils/storage.js'));

    console.log('Gemini Folders: Content Script Loaded');

    // SVGs for Icons (Inline to avoid font issues)
    const Icons = {
        folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
        folderOpen: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>',
        add: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
        close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
        more: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
        edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
        move: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
        check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
        create_new: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z"/></svg>',
        download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
        upload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>',
        to_cloud: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>',
        cloud_done: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17 15.18 9l1.41 1.41L10 17z"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    };

    class GeminiFoldersApp {
        constructor() {
            this.folders = [];
            this.currentChatId = null;
            this.currentChatTitle = null;
            this.expandedFolders = new Set();
        }

        async init() {
            console.log('Gemini Folders: Initializing...');
            await this.loadData();
            await this.injectSidebar();
            this.startHeaderObserver();
            this.startUrlObserver();
            this.setupStorageListeners();

            setInterval(() => this.checkInjectSanity(), 5000);
        }

        setupStorageListeners() {
            window.addEventListener('gemini-storage-saving', () => this.updateSyncStatus('saving'));
            window.addEventListener('gemini-storage-saved', () => this.updateSyncStatus('saved'));
            window.addEventListener('gemini-storage-error', (e) => this.updateSyncStatus('error', e.detail));

            // Real-time sync update
            window.addEventListener('gemini-storage-updated', (e) => {
                console.log('Gemini Folders: Received sync update', e.detail);
                if (e.detail && e.detail.folders) {
                    this.folders = e.detail.folders;
                    this.renderFolders();
                }
            });
        }

        updateSyncStatus(state, detail = null) {
            const indicator = document.querySelector('.sync-status-indicator');
            if (!indicator) return;

            indicator.className = 'sync-status-indicator'; // Reset classes

            if (state === 'saving') {
                indicator.classList.add('syncing');
                indicator.innerHTML = Icons.to_cloud;
                indicator.title = "Cloud sync in progress...";
            } else if (state === 'saved') {
                indicator.classList.add('saved');
                indicator.innerHTML = Icons.cloud_done;

                const timestamp = detail && detail.lastSynced ? new Date(detail.lastSynced).toLocaleTimeString() : 'Just now';
                indicator.title = `Folders are synced (Last: ${timestamp})`;
            } else if (state === 'error') {
                indicator.classList.add('error');
                indicator.innerHTML = Icons.warning;
                indicator.title = `Sync failed: ${detail || 'Unknown error'}`;
            }
        }

        checkInjectSanity() {
            if (!document.querySelector('.gemini-folders-container')) {
                this.injectSidebar();
            }
        }

        async loadData() {
            const data = await Storage.get();
            this.folders = data.folders || [];

            // Update sync indicator with last timestamp if available
            if (data.lastSynced) {
                this.updateSyncStatus('saved', { lastSynced: data.lastSynced });
            }

            this.renderFolders();
        }

        async injectSidebar() {
            try {
                const listContainer = await waitForElement(Selectors.sidebarListContainer);
                const titleContainer = listContainer.querySelector(Selectors.sidebarTitleContainer);

                if (!titleContainer) return;
                if (document.querySelector('.gemini-folders-container')) return;

                const foldersContainer = document.createElement('div');
                foldersContainer.className = 'gemini-folders-container';
                foldersContainer.innerHTML = `
                    <div class="gemini-folders-header">
                        <span class="gemini-folders-title">Folders</span>
                        <div class="gemini-folders-actions">
                            <button class="gemini-header-btn folder-add-btn" title="Create Folder">
                                 ${Icons.add}
                            </button>
                            <button class="gemini-header-btn folder-storage-btn" title="Backup & Restore">
                                 ${Icons.more}
                            </button>
                        </div>
                    </div>
                    <div class="gemini-folder-list">
                        <!-- Folders go here -->
                    </div>
                `;

                titleContainer.parentNode.insertBefore(foldersContainer, titleContainer);

                foldersContainer.querySelector('.folder-add-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleCreateFolder();
                });

                const storageBtn = foldersContainer.querySelector('.folder-storage-btn');
                storageBtn.addEventListener('click', (e) => {
                    console.log('Gemini Folders: Header Storage button clicked');
                    e.stopPropagation();
                    this.showStorageOptions(storageBtn);
                });

                this.renderFolders();

            } catch (e) {
                console.error('Gemini Folders: Injection failed', e);
            }
        }

        startHeaderObserver() {
            const observer = new MutationObserver((mutations) => {
                const rightSection = document.querySelector(Selectors.headerRightSection);
                if (rightSection && !rightSection.querySelector('.move-to-folder-btn')) {
                    this.injectMoveButton();
                    this.updateCurrentChatTitle();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        startUrlObserver() {
            this.checkUrl();
            const originalPushState = history.pushState;
            history.pushState = function () {
                originalPushState.apply(this, arguments);
                window.dispatchEvent(new Event('locationchange'));
            };
            window.addEventListener('popstate', () => this.checkUrl());
            window.addEventListener('locationchange', () => this.checkUrl());
        }

        checkUrl() {
            const match = window.location.pathname.match(/\/app\/([a-f0-9]+)/);
            // Always reset title when URL changes to prevent stale legacy titles
            this.currentChatTitle = null;

            if (match) {
                this.currentChatId = match[1];
                this.updateCurrentChatTitle(); // Try to get it immediately if possible
                this.renderFolders();
            } else {
                this.currentChatId = null;
            }
        }

        updateCurrentChatTitle() {
            const titleEl = document.querySelector(Selectors.chatTitle);
            if (titleEl) {
                const text = titleEl.textContent.trim();
                this.currentChatTitle = text || 'Untitled';
            }
        }

        injectMoveButton() {
            const rightSection = document.querySelector(Selectors.headerRightSection);
            if (!rightSection) return;

            const btn = document.createElement('button');
            btn.className = 'move-to-folder-btn';
            btn.innerHTML = `${Icons.move} Move to`;
            btn.style.zIndex = '9999';

            btn.addEventListener('click', (e) => {
                console.log('Gemini Folders: Move button clicked');
                e.preventDefault();
                e.stopPropagation();
                this.showFolderDropdown(btn);
            });

            // Create Sync Indicator
            const syncIndicator = document.createElement('div');
            syncIndicator.className = 'sync-status-indicator saved'; // Default to saved initially
            syncIndicator.innerHTML = Icons.cloud_done;
            syncIndicator.title = "Folders are synced";

            // Insert Indicator first, then button (since we insertBefore firstChild, later ones appear to the left?)
            // rightSection.insertBefore(btn, firstChild) -> btn is first.
            // if we want [Indicator] [MoveBtn] [ShareBtn]...
            // We should insert MoveBtn, then insert Indicator before MoveBtn?
            // Actually CSS flex-row-reverse might affect this, but usually header right section is flex. 
            // Let's assume standard flex row.

            // Insert Indicator first (it becomes the first child)
            // Then insert Button before the Indicator (so Button is first, Indicator is second)
            rightSection.insertBefore(syncIndicator, rightSection.firstChild);
            rightSection.insertBefore(btn, syncIndicator);
        }

        async showFolderDropdown(button) {
            console.log('Gemini Folders: Show Dropdown called');
            const existing = document.querySelector('.folder-dropdown');
            if (existing) {
                existing.remove();
                return;
            }

            this.checkUrl();
            this.updateCurrentChatTitle();

            if (!this.currentChatId) {
                const match = window.location.pathname.match(/\/app\/([a-f0-9]+)/);
                if (match) this.currentChatId = match[1];

                if (!this.currentChatId) {
                    alert("Could not detect active chat ID. Please reload the page.");
                    return;
                }
            }

            const dropdown = document.createElement('div');
            dropdown.className = 'folder-dropdown show';

            const header = document.createElement('div');
            header.className = 'folder-dropdown-header';
            header.innerText = 'Move to Folder...';
            dropdown.appendChild(header);

            if (this.folders.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'folder-dropdown-item';
                empty.innerText = 'No folders created';
                dropdown.appendChild(empty);
            } else {
                this.folders.forEach(folder => {
                    const item = document.createElement('div');
                    item.className = 'folder-dropdown-item';
                    const isIn = folder.chats.some(c => c.id === this.currentChatId);
                    item.innerHTML = `
                       ${isIn ? Icons.check : '<span style="width:16px; display:inline-block"></span>'} 
                       ${folder.name}
                    `;
                    item.addEventListener('click', () => {
                        this.moveChatToFolder(folder.id);
                        dropdown.remove();
                    });
                    dropdown.appendChild(item);
                });
            }

            const div1 = document.createElement('div'); div1.className = 'folder-dropdown-divider';
            dropdown.appendChild(div1);

            const removeBtn = document.createElement('div');
            removeBtn.className = 'folder-dropdown-item';
            removeBtn.innerHTML = `<span style="width:16px; text-align:center">-</span> Remove from folders`;
            removeBtn.addEventListener('click', () => {
                this.moveChatToFolder('remove_from_folders');
                dropdown.remove();
            });
            dropdown.appendChild(removeBtn);

            const div2 = document.createElement('div'); div2.className = 'folder-dropdown-divider';
            dropdown.appendChild(div2);

            const createBtn = document.createElement('div');
            createBtn.className = 'folder-dropdown-item';
            createBtn.innerHTML = `${Icons.create_new} Create new folder`;
            createBtn.addEventListener('click', () => {
                this.handleCreateFolder();
                dropdown.remove();
            });
            dropdown.appendChild(createBtn);

            button.parentNode.appendChild(dropdown);

            const closeHandler = (e) => {
                if (!dropdown.contains(e.target) && e.target !== button && !button.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        }

        async moveChatToFolder(folderId) {
            if (!this.currentChatId) return;

            // Check for title one last time
            this.updateCurrentChatTitle();
            const safeTitle = this.currentChatTitle || (document.title.includes('Gemini') ? 'Untitled Chat' : document.title) || 'Untitled';

            const chatObj = {
                id: this.currentChatId,
                title: safeTitle,
                url: window.location.href
            };

            await Storage.addChatToFolder(chatObj, folderId);
            this.loadData();
        }

        handleCreateFolder() {
            const name = prompt('Folder Name:');
            if (name) {
                Storage.addFolder(name).then(() => this.loadData());
            }
        }

        handleRenameFolder(folderId, currentName) {
            const name = prompt('Rename Folder:', currentName);
            if (name && name !== currentName) {
                Storage.renameFolder(folderId, name).then(() => this.loadData());
            }
        }

        handleRenameChat(folderId, chatId, currentName) {
            const name = prompt('Rename Chat (Alias):', currentName);
            if (name && name !== currentName) {
                Storage.renameChat(folderId, chatId, name).then(() => this.loadData());
            }
        }

        showStorageOptions(btn) {
            const existing = document.querySelector('.folder-options-menu');
            if (existing) existing.remove();

            const menu = document.createElement('div');
            menu.className = 'folder-options-menu show';
            // Adjust position slightly for the header button
            menu.style.top = '100%';
            menu.style.right = '0';

            // Export
            const exportItem = document.createElement('div');
            exportItem.className = 'folder-option-item';
            exportItem.innerHTML = `${Icons.download} Export Data (JSON)`;
            exportItem.addEventListener('click', () => {
                this.handleExport();
                menu.remove();
            });
            menu.appendChild(exportItem);

            // Import
            const importItem = document.createElement('div');
            importItem.className = 'folder-option-item';
            importItem.innerHTML = `${Icons.upload} Import Data (JSON)`;
            importItem.addEventListener('click', () => {
                this.handleImport();
                menu.remove();
            });
            menu.appendChild(importItem);

            btn.parentNode.appendChild(menu);

            const closeHandler = (e) => {
                if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        }

        async handleExport() {
            try {
                const data = await Storage.get();
                const jsonStr = JSON.stringify(data.folders, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
                a.download = `gemini-folders-backup-${timestamp}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Export failed:', e);
                alert('Export failed. Check console for details.');
            }
        }

        async handleImport() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const importedFolders = JSON.parse(event.target.result);
                        if (!Array.isArray(importedFolders)) {
                            throw new Error('Invalid format: Root must be an array of folders');
                        }

                        await this.mergeImportedData(importedFolders);
                        alert('Import successful!');
                    } catch (err) {
                        console.error('Import error:', err);
                        alert('Import failed: ' + err.message);
                    }
                };
                reader.readAsText(file);
            };

            input.click();
        }

        async mergeImportedData(importedFolders) {
            const currentData = await Storage.get();
            let addedFolders = 0;
            let addedChats = 0;

            for (const impFolder of importedFolders) {
                // Validate folder structure
                if (!impFolder.name || !Array.isArray(impFolder.chats)) continue;

                // Find existing folder by NAME
                let targetFolder = currentData.folders.find(f => f.name === impFolder.name);

                if (!targetFolder) {
                    // Create new folder
                    targetFolder = {
                        id: 'folder_' + Date.now() + Math.random().toString(36).substr(2, 9),
                        name: impFolder.name,
                        chats: []
                    };
                    currentData.folders.push(targetFolder);
                    addedFolders++;
                }

                // Merge chats
                for (const impChat of impFolder.chats) {
                    if (!impChat.id || !impChat.url) continue; // Basic validation

                    // Check if chat exists in this folder
                    const existingChat = targetFolder.chats.find(c => c.id === impChat.id);
                    if (!existingChat) {
                        targetFolder.chats.push(impChat);
                        addedChats++;
                    } else {
                        // Optional: Update title/alias if imported one is "better"? 
                        // For now we'll skip duplicates to preserve current state.
                        // Or we can overwrite aliases. The prompt says "Import logic should be able to understand if a folder/guid structure already exists, don't add it again".
                    }
                }
            }

            await Storage.set(currentData);
            await this.loadData();
            console.log(`Imported merged: ${addedFolders} new folders, ${addedChats} new chats.`);
        }

        renderFolders() {
            const container = document.querySelector('.gemini-folder-list');
            if (!container) return;

            container.innerHTML = '';
            this.folders.forEach(folder => {
                const folderEl = document.createElement('div');
                folderEl.style.position = 'relative';

                const headerEl = document.createElement('div');
                headerEl.className = 'gemini-folder-item';
                const expanded = this.expandedFolders.has(folder.id);

                headerEl.innerHTML = `
                    <div class="gemini-folder-info">
                         ${expanded ? Icons.folderOpen : Icons.folder}
                         <span>${folder.name} <span class="gemini-folder-count">(${folder.chats.length})</span></span>
                    </div>
                    <div class="gemini-folder-actions">
                        <button class="gemini-icon-btn folder-options-btn" title="Options">
                            ${Icons.more}
                        </button>
                    </div>
                `;

                headerEl.addEventListener('click', (e) => {
                    if (!e.target.closest('.gemini-icon-btn')) {
                        this.toggleFolderExpand(folder.id);
                    }
                });

                const optsBtn = headerEl.querySelector('.folder-options-btn');
                optsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showFolderOptions(folder, optsBtn);
                });

                folderEl.appendChild(headerEl);

                const listEl = document.createElement('div');
                listEl.className = `gemini-folder-chats ${expanded ? 'expanded' : ''}`;

                folder.chats.forEach(chat => {
                    const chatEl = document.createElement('div'); // Div container so we can have buttons
                    chatEl.className = 'gemini-folder-chat-item';
                    if (chat.id === this.currentChatId) chatEl.classList.add('active');

                    chatEl.innerHTML = `
                        <span class="gemini-folder-chat-title" title="${chat.title}">${chat.title}</span>
                        <div class="gemini-folder-actions">
                            <button class="gemini-icon-btn chat-options-btn" title="Options">${Icons.more}</button>
                        </div>
                    `;

                    // Click title to nav
                    chatEl.querySelector('.gemini-folder-chat-title').addEventListener('click', () => {
                        window.location.href = chat.url;
                    });
                    // Click 'options'
                    const chatOptsBtn = chatEl.querySelector('.chat-options-btn');
                    chatOptsBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showChatOptions(chat, folder.id, chatOptsBtn);
                    });

                    listEl.appendChild(chatEl);
                });

                folderEl.appendChild(listEl);
                container.appendChild(folderEl);
            });
        }

        showFolderOptions(folder, btn) {
            const existing = document.querySelector('.folder-options-menu');
            if (existing) existing.remove();

            const menu = document.createElement('div');
            menu.className = 'folder-options-menu show';

            // Rename
            const renameItem = document.createElement('div');
            renameItem.className = 'folder-option-item';
            renameItem.innerHTML = `${Icons.edit} Rename`;
            renameItem.addEventListener('click', () => {
                this.handleRenameFolder(folder.id, folder.name);
                menu.remove();
            });
            menu.appendChild(renameItem);

            // Delete
            const deleteItem = document.createElement('div');
            deleteItem.className = 'folder-option-item';
            deleteItem.innerHTML = `${Icons.close} Delete`;
            deleteItem.addEventListener('click', () => {
                if (confirm(`Delete folder "${folder.name}"?\n(Chats will NOT be deleted, just this folder)`)) {
                    Storage.removeFolder(folder.id).then(() => this.loadData());
                }
                menu.remove();
            });
            menu.appendChild(deleteItem);

            btn.parentNode.appendChild(menu);

            const closeHandler = (e) => {
                if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        }

        showChatOptions(chat, folderId, btn) {
            const existing = document.querySelector('.folder-options-menu');
            if (existing) existing.remove();

            const menu = document.createElement('div');
            menu.className = 'folder-options-menu show';

            // Rename (Alias)
            const renameItem = document.createElement('div');
            renameItem.className = 'folder-option-item';
            renameItem.innerHTML = `${Icons.edit} Rename`;
            renameItem.addEventListener('click', () => {
                this.handleRenameChat(folderId, chat.id, chat.title);
                menu.remove();
            });
            menu.appendChild(renameItem);

            // Remove from Folder
            const removeItem = document.createElement('div');
            removeItem.className = 'folder-option-item';
            removeItem.innerHTML = `${Icons.close} Remove`;
            removeItem.addEventListener('click', () => {
                // We can reuse addChatToFolder with 'remove_from_folders' logic, 
                // but that removes from ALL folders. 
                // If we want to remove just from THIS folder?
                // The storage logic currently is 1:1 (move-to). So remove_from_folders is practically the same as removing from this folder.
                this.moveChatToFolder('remove_from_folders');
                menu.remove();
            });
            menu.appendChild(removeItem);

            btn.parentNode.appendChild(menu);

            const closeHandler = (e) => {
                if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 10);
        }

        toggleFolderExpand(folderId) {
            if (this.expandedFolders.has(folderId)) {
                this.expandedFolders.delete(folderId);
            } else {
                this.expandedFolders.add(folderId);
            }
            this.renderFolders();
        }
    }

    const app = new GeminiFoldersApp();
    app.init();
})();
