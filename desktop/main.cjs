const {
  app,
  BrowserWindow,
  Menu,
  protocol,
  net,
  session,
  dialog,
  screen,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  resolveLocalPath,
  CONTENT_SECURITY_POLICY,
} = require("./local-content.cjs");

app.setName("Reinos de Acero");
const profile = app.commandLine.getSwitchValue("profile-dir");
const userData =
  profile && path.isAbsolute(profile)
    ? profile
    : path.join(app.getPath("appData"), "Reinos de Acero");
fs.mkdirSync(userData, { recursive: true });
app.setPath("userData", userData);
app.commandLine.appendSwitch("disable-background-networking");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "reinos",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
let mainWindow;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app
    .whenReady()
    .then(async () => {
      const root = path.join(app.getAppPath(), "dist");
      if (!fs.existsSync(path.join(root, "index.html")))
        throw new Error(
          "Faltan los archivos del juego. Genera la compilación antes de iniciar la aplicación.",
        );
      protocol.handle("reinos", async (request) => {
        const file = resolveLocalPath(request.url, root);
        if (request.method !== "GET" || !file)
          return new Response("Solicitud no permitida", { status: 403 });
        try {
          if (!fs.statSync(file).isFile())
            return new Response("Archivo no encontrado", { status: 404 });
          const result = await net.fetch(pathToFileURL(file).href);
          const headers = new Headers(result.headers);
          headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
          headers.set("X-Content-Type-Options", "nosniff");
          headers.set("Cache-Control", "no-cache");
          return new Response(result.body, { status: result.status, headers });
        } catch {
          return new Response("Archivo no encontrado", { status: 404 });
        }
      });
      session.defaultSession.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      session.defaultSession.webRequest.onBeforeRequest(
        { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
        (_details, callback) => callback({ cancel: true }),
      );
      const available = screen.getPrimaryDisplay().workAreaSize;
      mainWindow = new BrowserWindow({
        width: Math.min(1500, available.width),
        height: Math.min(1040, available.height),
        minWidth: 960,
        minHeight: 700,
        title: "Reinos de Acero",
        backgroundColor: "#101716",
        show: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, "resources", "icon.png"),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          spellcheck: false,
        },
      });
      mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      mainWindow.webContents.on("will-navigate", (event, destination) => {
        const target =
          typeof destination === "string" ? destination : destination.url;
        if (!resolveLocalPath(target, root)) event.preventDefault();
      });
      mainWindow.webContents.on("will-attach-webview", (event) =>
        event.preventDefault(),
      );
      mainWindow.once("ready-to-show", () => mainWindow.show());
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([
          {
            label: "Juego",
            submenu: [
              {
                label: "Pantalla completa",
                role: "togglefullscreen",
                accelerator: "F11",
              },
              { type: "separator" },
              { label: "Salir", role: "quit", accelerator: "CmdOrCtrl+Q" },
            ],
          },
          {
            label: "Ver",
            submenu: [
              { label: "Tamaño original", role: "resetZoom" },
              { label: "Acercar", role: "zoomIn" },
              { label: "Alejar", role: "zoomOut" },
            ],
          },
        ]),
      );
      await mainWindow.loadURL("reinos://app/index.html");
    })
    .catch((error) => {
      dialog.showErrorBox("No se pudo abrir Reinos de Acero", error.message);
      app.quit();
    });
  app.on("window-all-closed", () => app.quit());
}
