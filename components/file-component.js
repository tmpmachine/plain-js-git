export let compoFile = (function() {
  
  let SELF = {
    Init,
    GetFS,
    ClearFileSystem,
    TaskImportToFS,
    TaskAddFile,
    TaskAddFileAtPath,
    TaskRemoveFile,
    TaskCreateDir,
    TaskUpdateFile,
    TaskUpdateFileAtPath,
    TaskReadFileContent,
    TaskRenameFile,
    MigrateToFileSystem,
    TaskExportToFileSytemAccess,
    GetCurrentPath,
    SetCurrentPath,
    GoBack,
    TaskUnlinkFileAtPath,
    TaskRemoveDir,
    TaskMoveFile,
    TaskMoveDir,
    TaskListDirWithType,
    TaskFindAndReadGitFiles,
    task: {
      listDirWithType: TaskListDirWithType,
      listDir: TaskListDir,
    }
  };
  
  let fs = null;
  
  let data = {
    items: [],
  };
  
  let local = {
    currentPath: [''],
    fs: null,
  };
  
  function SetCurrentPath(dirName) {
    local.currentPath.push(dirName);
  }
  
  function GoBack() {
    if (local.currentPath.length == 1) return;
    
    local.currentPath.pop();
  }
  
  async function TaskImportToFS(dirHandle, dir = '/') {
    
    // do not create file/folder using File System Access API
    let fsOptions = {
      isFSAccessReadOnly: true,
    };
    
    // non .git files
    for await (const entry of dirHandle.values()) {
      
      if (entry.kind == 'file') {
        const file = await entry.getFile();
        const fileContent = await file.arrayBuffer();
        await fs.promises.writeFile(dir + entry.name, fileContent, fsOptions);
      } else if (entry.kind == 'directory') {
        let dirPath = dir + entry.name + '/';
        await fs.promises.mkdir(dirPath, fsOptions);
        await TaskImportToFS(entry, dirPath);
      }
    }
    
  }
  
  async function TaskFindAndReadGitFiles(dirHandle, dir = '/') {
    
    // do not create file/folder using File System Access API
    let fsOptions = {
      isFSAccessReadOnly: true,
    };
    
    // non .git files
    for await (const entry of dirHandle.values()) {
      if (entry.kind == 'directory') {
        if (entry.name == '.git') {
          let dirPath = dir + entry.name + '/';
          await fs.promises.mkdir(dirPath, fsOptions);
          await TaskImportToFS(entry, dirPath);
        }
      }
    }
    
  }
  
  async function TaskUpdateFile(fileName, newContent) {
    let filePath = getFilePath(fileName);
    await fs.promises.writeFile(filePath, newContent);
  }
  
  async function TaskRenameFile(oldFileName, newFileName) {
    let oldFilePath = getFilePath(oldFileName);
    let newFilePath = getFilePath(newFileName);
    await fs.promises.rename(oldFilePath, newFilePath);
  }
  
  async function ensureDirectoryExists(dirPath) {
    let createdDirs = [];
    
    const parts = dirPath.split('/');
    let currentPath = '';
    for (const part of parts) {
      currentPath += '/' + part;
      try {
        await fs.promises.stat(currentPath);
      } catch (error) {
        if (error.code === 'ENOENT') {
          createdDirs.push(part);
          await fs.promises.mkdir(currentPath);
        } else {
          throw error;
        }
      }
    }
    
    return createdDirs;
  }
  
  function GetCurrentPath() {
    return getFilePath();
  }

  function getFilePath(fileName = '') {
    return `${local.currentPath.join('/')}/${fileName}`;
  }

  async function TaskReadFileContent(fileName, isBlob = false) {
    let filePath = getFilePath(fileName);
    
    if (isBlob) {
      return await fs.promises.readFile(filePath);
    } else {
      return await fs.promises.readFile(filePath, 'utf8');
    }
  }

  async function TaskCreateDir(fileName) {
    let filePath = getFilePath(fileName);
    await fs.promises.mkdir(filePath);
  }

  async function TaskAddFile(fileName, content) {
    let filePath = getFilePath(fileName);
    await fs.promises.writeFile(filePath, `${content}`);
  }
  
  async function TaskAddFileAtPath(filePath, options = null, content = '') {
    let createdDirs = [];
    
    if (options?.recursive) {
      let dirPath = getDirectoryPath(filePath);
      createdDirs = await ensureDirectoryExists(dirPath, createdDirs);
    }
    await fs.promises.writeFile('/' + filePath, content);
    
    return createdDirs;
  }
  
  async function TaskUpdateFileAtPath(filePath, content) {
    if (!content) return;
    
    await fs.promises.writeFile(filePath, content);
  }
  
  function getDirectoryPath(filePath) {
    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      return filePath.substring(0, lastSlashIndex);
    } else {
      return '';
    }
  }

  async function TaskRemoveFile(fileName) {
    let filePath = getFilePath(fileName);
    await local.fs.promises.unlink(filePath);
  }
  
  async function TaskUnlinkFileAtPath(filePath) {
    await local.fs.promises.unlink(filePath);
  }
  
  async function ClearFileSystem() {
    await TaskRemoveDir('/');
    resetCurrentPath();
  }
  
  function resetCurrentPath() {
    local.currentPath.length = 0;
    local.currentPath.push('');
  }
  
  async function TaskRemoveDir(directoryPath) {
    const entries = await local.fs.promises.readdir(directoryPath, { withFileTypes: true });
  
    for (const entry of entries) {
      const entryPath = directoryPath + '/' + entry; // Concatenate directory paths
      const stats = await local.fs.promises.stat(entryPath);
      if (stats.isDirectory()) {
        await TaskRemoveDir(entryPath);
      } else {
        try {
          await local.fs.promises.unlink(entryPath); // Delete file
        } catch (e) { console.error(e); }
      }
    }
    
    try {
      if (directoryPath != '/') {
        await local.fs.promises.rmdir(directoryPath); // Delete the empty dir itself
      }
    } catch (e) { console.error(e); }
  }
  
  async function MigrateToFileSystem(dirHandle, directoryPath = '/tutorial') {
    
    const entries = await local.fs.promises.readdir(directoryPath, { withFileTypes: true });
  
    for (const entry of entries) {
      const entryPath = directoryPath + '/' + entry; // Concatenate directory paths
      const stats = await local.fs.promises.stat(entryPath);
      if (stats.isDirectory()) {
        // In an existing directory, create a new directory named "My Documents".
        const newDirectoryHandle = await dirHandle.getDirectoryHandle(entry, {
          create: true,
        });
        MigrateToFileSystem(newDirectoryHandle, entryPath);
      } else {
        // In this new directory, create a file named "My Notes.txt".
        const newFileHandle = await dirHandle.getFileHandle(entry, { create: true });
        let isBlob = true;
        let blob = await TaskReadFileContent(entryPath, isBlob);
        writeFile(newFileHandle, blob);
      }
      
    }
  
  }
  
  async function TaskExportToFileSytemAccess(dirHandle, directoryPath = '/') {
    
    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
  
    for (const entry of entries) {
      const entryPath = directoryPath + entry; // Concatenate directory paths
      const stats = await fs.promises.stat(entryPath);
      if (stats.isDirectory()) {
        // In an existing directory, create a new directory named "My Documents".
        const newDirectoryHandle = await dirHandle.getDirectoryHandle(entry, {
          create: true,
        });
        TaskExportToFileSytemAccess(newDirectoryHandle, entryPath + '/')
      } else {
        // In this new directory, create a file named "My Notes.txt".
        const newFileHandle = await dirHandle.getFileHandle(entry, { create: true });
        let isBlob = true;
        let blob = await TaskReadFileContent(entryPath, isBlob);
        writeFile(newFileHandle, blob)
      }
      
    }
  
  }
  
  // fileHandle is an instance of FileSystemFileHandle..
  async function writeFile(fileHandle, blob) {
    // Create a FileSystemWritableFileStream to write to.
    const writable = await fileHandle.createWritable();
    // Write the contents of the file to the stream.
    await writable.write(blob);
    // Close the file and write the contents to disk.
    await writable.close();
  }
  
  async function TaskListDir(dirPath = '/') {
    let directories = await local.fs.promises.readdir(dirPath, { withFileTypes: true });
    return directories;
  }
  
  async function TaskListDirWithType() {
    let currentPath = GetCurrentPath();
    const entries = await local.fs.promises.readdir(currentPath, { withFileTypes: true });
    let items = [];
    
    for (const entry of entries) {
      
      // skip .git folder
      if (entry == '.git') continue;
      
      const entryPath = getFilePath(entry);
      const stats = await local.fs.promises.stat(entryPath);
      let type = stats.isDirectory() ? 'folder' : 'file';
      items.push({
        type,
        fileName: entry,
        filePath: getFilePath(entry),
      });
    }
    
    return items;
  }
    
  function Init() {
    let lfs = new LightningFS('fs', {
      wipe: true, // start with an empty filesystem on each page load
    });
    
    let lfsHybrid = {
      ...lfs,
      promises: {
        ...lfs.promises,
        writeFile: null,
      },
    };
    
    // fs method overwrite
    {
      let verbose = false;
      
      lfsHybrid.promises.writeFile = async (filepath, data, opts) => {
        if (verbose) console.log('writeFile');
        
        await lfs.promises.writeFile(filepath, data, opts);
        if (!opts?.isFSAccessReadOnly) {
          await compoFSA.CreateFile(filepath, data);
        }
      };
      lfsHybrid.promises.unlink = async (filepath, opts) => {
        if (verbose) console.log('unlink');
        
        await lfs.promises.unlink(filepath, opts);
        await compoFSA.DeleteFile(filepath);
      };
      lfsHybrid.promises.mkdir = async (filepath, opts) => {
        if (verbose) console.log('make dir');
        
        await lfs.promises.mkdir(filepath, opts);
        if (!opts?.isFSAccessReadOnly) {
          await compoFSA.CreateDir(filepath);
        }
      };
      lfsHybrid.promises.rmdir = async (filepath, opts) => {
        if (verbose) console.log('remove dir');
        
        await lfs.promises.rmdir(filepath, opts);
        await compoFSA.DeleteDir(filepath);
      };
      lfsHybrid.promises.rename = async (oldEntryPath, newEntryPath) => {
        if (verbose) console.log('rename');
        
        let entryStat = await fs.promises.stat(oldEntryPath);
        
        await lfs.promises.rename(oldEntryPath, newEntryPath);
  
        if (entryStat.type == 'dir') {
          await compoFSA.RenameFolder(oldEntryPath, newEntryPath);
        } else {
          await compoFSA.RenameFile(oldEntryPath, newEntryPath);
        }
        
      };
    }
    
    local.fs = lfsHybrid;
    fs = lfsHybrid;
    
  }
  
  function GetFS() {
    return local.fs;
  }
  
  async function copyFile(sourcePath, destinationPath) {
    const fileData = await fs.promises.readFile(sourcePath);
    await fs.promises.writeFile(destinationPath, fileData);
  }
  
  async function TaskMoveFile(fileName, targetDirPath) {
    try {
      let sourcePath = GetCurrentPath() + fileName;
      let destinationPath = targetDirPath + fileName;
      await copyFile(sourcePath, destinationPath);
      await fs.promises.unlink(sourcePath);
    } catch (e) {
      console.error(e);
    }
  }
  
  async function TaskMoveDir(entryName, targetDirPath) {
    let sourcePath = GetCurrentPath() + entryName;
    let destinationPath = targetDirPath + entryName;
    
    try {
      await copyDirectory(sourcePath, destinationPath);
      await TaskRemoveDir(sourcePath);
    } catch (e) {
      console.error(e);
    }
  }
  
  async function copyDirectory(sourcePath, destinationPath) {
    // Create destination directory if it doesn't exist
    try {
      await fs.promises.mkdir(destinationPath);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  
    const files = await fs.promises.readdir(sourcePath);
    
    for (const file of files) {
      const srcFilePath = `${sourcePath}/${file}`;
      const destFilePath = `${destinationPath}/${file}`;
  
      const stats = await fs.promises.stat(srcFilePath);
      if (stats.isDirectory()) {
        // Recursively copy subdirectories
        await copyDirectory(srcFilePath, destFilePath);
      } else {
        // Copy file
        await copyFile(srcFilePath, destFilePath);
      }
    }
  }
  
  return SELF;
  
})();