
// Mock Chrome API
global.chrome = {
    runtime: {
        getURL: (path) => path // Just return the path as string
    }
};

// Mock document.body if needed (JSDOM handles this, but good to ensure)
if (!global.document) {
    throw new Error("JSDOM not loaded");
}
