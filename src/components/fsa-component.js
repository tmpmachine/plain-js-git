export let compoFSA = (function() {
  
  let SELF = {
    SetDirHandle,
    CreateFile,
    DeleteFile,
    RenameFile,
    RenameFolder,
    EnsureCreatedDir,
    GetDirHandle,
    CreateDir,
    DeleteDir,
  };
  
  let local = {
    dirHandle: null,
  };
  
  async function RenameFile(oldFilepath, newFilepath) {
    if (!local.dirHandle) return;
    
    let fileHandle = await taskGetFileHandleFromPath(oldFilepath);
    let newFileName = getEntryNameFromPath(newFilepath);
    
    if (!fileHandle) return;
    
    await fileHandle.move(newFileName);
  }
  
  async function RenameFolder(oldFilepath, newFilepath) {
    if (!local.dirHandle) return;
    
    let oldDirHandle = await taskGetDirHandleByPath(oldFilepath);
    let newDirHandle = await CreateDir(newFilepath);
    
    if (!(oldDirHandle && newDirHandle)) return;
    
    await MoveSubEntries(oldDirHandle, newDirHandle);
    await DeleteDir(oldFilepath);
  }
  
  async function MoveSubEntries(oldDirHandle, newDirHandle) {
    let entries = oldDirHandle.values();
    
    for await (const entry of entries) {
      
      if (entry.kind == 'file') {
        
        await entry.move(newDirHandle);
        
      } else if (entry.kind == 'directory') {
        // clone sub directories
        
        let newSubDirHandle = await newDirHandle.getDirectoryHandle(entry.name, {
          create: true,
        });
        
        await MoveSubEntries(entry, newSubDirHandle);
      }
      
    }
  }
  
  async function taskGetFileHandleFromPath(filePath) {
    let paths = folderNames(filePath);
    let fileName = paths.pop();
    let dirHandle = await taskGetDirHandleByPath(paths.join('/'));
    
    if (!dirHandle) return null;
    
    return await dirHandle.getFileHandle(fileName);
  }
  
  function getEntryNameFromPath(filePath) {
    let paths = folderNames(filePath);
    let entryName = paths.pop();
    return entryName;
  }
  
  async function DeleteFile(filePath) {
    if (!local.dirHandle) return;
    
    let paths = folderNames(filePath);
    let fileName = paths.pop();
    let dirHandle = await taskGetDirHandleByPath(paths.join('/'));
    
    if (!dirHandle) return;
    
    await dirHandle.removeEntry(fileName);
  }
  
  async function DeleteDir(filePath) {
    if (!local.dirHandle) return;
    
    let paths = folderNames(filePath);
    let dirName = paths.pop();
    let dirHandle = await taskGetDirHandleByPath(paths.join('/'));
    
    if (!dirHandle) return;
    
    await dirHandle.removeEntry(dirName, { recursive: true });
  }
  
  async function CreateFile(filePath, data) {
    if (!local.dirHandle) return;
    
    let paths = folderNames(filePath);
    let fileName = paths.pop();
    let dirHandle = await EnsureCreatedDir(paths.join('/'));
    
    if (!dirHandle) return;
    
    // create the file
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    
    // write to file
    const writable = await fileHandle.createWritable();
    let fileRef = await fileHandle.getFile();
    if (fileRef) {
      await writable.write(data);
      await writable.close();
    }
  }  
  
  function GetDirHandle() {
    return local.dirHandle;
  }
  
  function SetDirHandle(dirHandle) {
    local.dirHandle = dirHandle;
  }
  
  function folderNames(path) {
    // Split the path string using '/'
    let folders = path.split('/');
    
    // Filter out any empty strings resulting from consecutive slashes
    folders = folders.filter(folder => folder.length > 0);
    
    return folders;
  }
  
  async function taskGetDirHandleByPath(path, isCreate = false) {
    // Example usage:
    let folderArray = folderNames(path);
    // console.log(folderArray);
    
    let dirHandle = local.dirHandle;
    while (folderArray) {
      let dirName = folderArray.shift();
      if (!dirName) break;
      
      const newDirectoryHandle = await dirHandle.getDirectoryHandle(dirName, {
        create: isCreate,
      });
      
      if (!newDirectoryHandle) return null;
      
      dirHandle = newDirectoryHandle;
    }
    
    return dirHandle; // last directory handle
  }
  
  async function EnsureCreatedDir(path) {
    let isCreate = true;
    let dirHandle = await taskGetDirHandleByPath(path, isCreate);
    return dirHandle;
  }
  
  async function CreateDir(path) {
    if (!local.dirHandle) return;
    
    return await EnsureCreatedDir(path);
  }
  
  return SELF;
  
})();