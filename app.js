const {
  BrowserWindow,
  Menu,
  app,
  dialog,
  TouchBar,
  shell,
  ipcMain
} = require('electron')
const {
  TouchBarLabel,
  TouchBarButton,
  TouchBarSpacer
} = TouchBar
const path = require('path')
const url = require('url')
const pjson = require('./package.json')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
global.__basedir = __dirname;
let filePath = "";
let win;
let isDev = false;
let template = [{
  label: 'File',
  submenu: [{
    label: 'About Mercury'
  }, {
    type: 'separator'
  }, {
    label: 'Settings',
    accelerator: 'CmdOrCtrl+,',
    click() {
      exports.openSettingWindow()
    }
  }, {
    type: 'separator'
  }, {
    label: 'New file',
    accelerator: 'CmdOrCtrl+N',
    click() { newfile() }
  }, {
    label: 'Open',
    accelerator: 'CmdOrCtrl+O',
    click() { openfile(() => {}) }
  }, {
    label: 'Save',
    accelerator: "CmdOrCtrl+S",
    click() {
      if(filePath === "") {
        saveAs();
      } else {
        console.log('Saving in '+filePath);
        win.webContents.send('saved-file', filePath)
      }
    }
  }, {
    label: 'Save As',
    accelerator: 'CmdOrCtrl+Shift+S',
    click() { saveAs()}
  }, {
    type: 'separator'
  }, {
    label: 'Quit',
    role: 'quit'
  }]
}, {
  label: 'About',
  submenu: [{
    label: 'Version ' + pjson.version,
    type: 'checkbox',
    checked: true,
    enabled: false
  }, {
    label: 'ChartJS',
    submenu: [{
      label: 'Samples',
      click() {
        shell.openExternal("http://www.chartjs.org/samples/latest/")
      }
    }, {
      label: 'Doc',
      click() {
        shell.openExternal("http://www.chartjs.org/docs/latest/")
      }
    }]
  }, {
    label: 'Bulma',
    submenu: [{
      label: 'Doc',
      click() {
        shell.openExternal("http://bulma.io/documentation/overview/start/")
      }
    }]
  }, {
    label: 'Font Awesome',
    submenu: [{
      label: 'Icons',
      click() {
        shell.openExternal("http://fontawesome.io/icons/")
      }
    }]
  }, {
    type: 'separator'
  }, {
    label: 'Enable DevTools',
    type: 'checkbox',
    checked: isDev,
    role: 'toggledevtools',
    click() {
      isDev = !isDev
    }
  }]
} ,{
  label: 'Windows',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: 'Close',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }]
}]

const touchBar = new TouchBar([
  new TouchBarButton({
    backgroundColor: '#00d1b2',
    label: 'Add account',
    click() {
      win.webContents.send('add-account')
    }
  })
])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1270,
    icon: path.join(__dirname, '/icons/png/64x64.png'),
    backgroundColor: '#282c34',
    titleBarStyle: 'hidden-inset',
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'html/index.html'),
    protocol: 'file:',
    title: 'Mercury',
    slashes: true
  }))
  win.setTouchBar(touchBar)

  win.once('ready-to-show', () => {
    win.show();
  })
  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
    if (typeof swin != 'undefined') {
      swin.close()
      swin = null
    }
    menu = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

exports.openSettingWindow = function() {
  let swin = new BrowserWindow({
    background: true,
    frame: false,
    width: 825,
    minWidth: 300,
    height: 600,
    backgroundColor: '#282c34',
    icon: path.join(__dirname, '/icons/png/64x64.png')
  })
  swin.loadURL(`file://${__dirname}/html/settings.html`)
}

ipcMain.on('open-file', (event) => {
  openfile((file) => {
    console.log('--- File selected ');
    console.log(file);
    event.returnValue = file;
  });
})

ipcMain.on('delete-warning', (event,args) => {
  const options = {
    type: 'warning',
    title: 'Warning !',
    message: `You are about to delete the account \"${args}\" \n\nAre you sure?`,
    buttons: ['Continue', 'Cancel']
  }
  dialog.showMessageBox(win, options, function (index) {
    event.returnValue = index;
  })
})

ipcMain.on('file-to-save', (event, args) => {
  filePath = args;
})

ipcMain.on('delete-op-warning',(event)=> {
  const options = {
    type: 'warning',
    title: 'Warning !',
    message: `You are about to delete an operation.\n\nAre you sure?`,
    buttons: ['Continue', 'Cancel']
  }
  dialog.showMessageBox(win, options, function (index) {
    event.returnValue = index;
  })
})

function newfile() {
  filePath = "";
  win.webContents.send('open-new-file');
}

function openfile(callback) {
  dialog.showOpenDialog(win, {
    filters: [{name : 'Mercury Files', extensions: ['mcy']}],
    properties: ['openFile'],
    message : 'Choose your Mercury file'
  }, function(files) {
    if (files) {
      win.webContents.send('selected-file', files[0]);
      filePath = files[0];
      callback(files[0]);
    }
  })
}

function saveAs() {
  const options = {
    title: 'Save your data',
    filters: [
      { name: 'Mercury Files', extensions: ['mcy'] }
    ]
  };
  dialog.showSaveDialog(win, options, function (filename) {
    win.webContents.send('saved-file', filename)
    filePath = filename;
  })
}