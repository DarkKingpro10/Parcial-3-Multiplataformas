// Preload script (limited, secure bridge if needed)
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('env', {
  NODE_ENV: process.env.NODE_ENV,
});
