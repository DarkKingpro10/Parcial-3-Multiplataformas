// Electron main process (CommonJS)
require("dotenv").config();
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { fileURLToPath } = require("url");

// Resolver __filename y __dirname de forma compatible (CJS/ESM)
let __filenameResolved = typeof __filename !== 'undefined' ? __filename : undefined;
let __dirnameResolved = typeof __dirname !== 'undefined' ? __dirname : undefined;
try {
	if (!__filenameResolved || !__dirnameResolved) {
		// Evitar error de sintaxis en CJS al referenciar import.meta directamente
		const metaUrl = (0, eval)("import.meta && import.meta.url ? import.meta.url : undefined");
		if (metaUrl) {
			__filenameResolved = fileURLToPath(metaUrl);
			__dirnameResolved = path.dirname(__filenameResolved);
		}
	}
} catch (_) {
	// Ignorar si no está disponible; en CJS ya existen __filename/__dirname
	__filenameResolved = __filenameResolved || __filename;
	__dirnameResolved = __dirnameResolved || __dirname;
}

// Detectar si estamos en desarrollo
const isDev = !app.isPackaged || process.env.NODE_ENV === "development";

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false,
		minWidth: 360,
		minHeight: 480,
		autoHideMenuBar: true, // ocultar barra de menú
		webPreferences: {
			preload: path.join(__dirnameResolved, "preload.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
      allowRunningInsecureContent: isDev,
      webSecurity: false,
		},
	});

	win.once("ready-to-show", () => {
		win.show();
    win.maximize();
	});

	if (isDev) {
		win.loadURL("http://127.0.0.1:5175");
	} else {
		win.loadFile(path.join(__dirnameResolved, "..", "dist", "index.html"));
	}

	// Bloquear navegación fuera de la app (file://) y abrir https externamente
	// Solo en producción - en desarrollo permitir navegación para HMR
	if (!isDev) {
		win.webContents.on("will-navigate", (event, url) => {
			const isLocal = url.startsWith("file://");
			if (!isLocal) {
				event.preventDefault();
				if (/^https:\/\//i.test(url)) shell.openExternal(url);
			}
		});
	}

	return win;
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
