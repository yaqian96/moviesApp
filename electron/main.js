const { app, BrowserWindow } = require('electron')
const path = require('path')

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
    },
  })

  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    const devPort = process.env.VITE_DEV_PORT || process.env.UNI_DEV_PORT || '8080'
    win.loadURL(`http://localhost:${devPort}`)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/build/h5/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
