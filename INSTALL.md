# Installing Gemini Folders Extension

Since this extension is not in the store, you need to install it manually in Developer Mode.

1. **Verify Files**
   Ensure you have the `manifest.json` and `src/` folder in `C:\Users\kyler\Workspace\taurus-app`.

2. **Open Extensions Management**
   - **Chrome:** Go to `chrome://extensions`
   - **Edge:** Go to `edge://extensions`

3. **Enable Developer Mode**
   Toggle the "Developer mode" switch (usually in the top right or left sidebar).

4. **Load Unpacked**
   - Click the "Load unpacked" button.
   - Select the directory: `C:\Users\kyler\Workspace\taurus-app`.

5. **Verify**
   - Open [Gemini](https://gemini.google.com/app).
   - Reload the page.
   - You should see the "Folders" section above your chats list.

## Troubleshooting
- **No Folders UI?** Check the console (F12) for "Gemini Folders: Content Script Loaded" or errors.
- **Changes not showing?** Click the "Reload" icon on the extension card in the extensions page, then reload Gemini.
