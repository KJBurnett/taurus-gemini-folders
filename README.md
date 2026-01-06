# Taurus - Gemini Folders

A browser extension that adds folder organization to Google Gemini. Categorize your AI conversations by project, topic, or workflow.

## Features

- **Folder Organization** - Create custom folders to group related Gemini conversations
- **Cloud Sync** - Folder structure syncs across devices via your browser account
- **Chat Aliases** - Rename conversations with custom labels for easier identification
- **Import/Export** - Backup and restore your folder structure as JSON
- **Quick Actions** - One-click "Move to" button in the chat header

## Installation

### Download

1. Go to the [Releases](https://github.com/KJBurnett/taurus/releases) page
2. Download the latest `taurus-gemini-folders.zip` file
3. Extract the zip to a folder on your computer

### Load in Browser

**Chrome:**
1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extracted folder

**Edge:**
1. Navigate to `edge://extensions`
2. Enable **Developer mode** (toggle in left sidebar)
3. Click **Load unpacked**
4. Select the extracted folder

### Verify Installation

1. Go to [gemini.google.com](https://gemini.google.com)
2. Look for the **Folders** section in the left sidebar
3. You should see a "Move to" button in the chat header

## Usage

### Creating Folders

Click the **+** button next to "Folders" in the sidebar and enter a name.

### Organizing Chats

1. Open any Gemini conversation
2. Click **Move to** in the top-right header
3. Select a folder from the dropdown

### Folder Management

- Click a folder to expand/collapse its contents
- Use the **⋮** menu on folders or chats for rename and delete options
- "Delete" removes the folder only—chats remain in Gemini

### Backup & Restore

Use the **⋮** menu next to the Folders header to export or import your folder structure as JSON.

## Cloud Sync

Folders sync automatically when signed into your browser account. The sync indicator next to "Move to" shows:

- **Green cloud** - Synced
- **Spinning icon** - Sync in progress  
- **Warning icon** - Error (hover for details)

## Development

```bash
git clone https://github.com/KJBurnett/taurus.git
cd taurus
# Load unpacked in browser - no build step required
```

## Privacy

- All data stored locally in browser sync storage
- No external servers or analytics
- No data collection

## License

GNU GENERAL PUBLIC LICENSE License - see [LICENSE](LICENSE) for details.
