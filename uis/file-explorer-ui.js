export let uiFileExplorer = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    RefreshFiles,
    ExportFiles,
    PickFolder,
    HandleClickListFiles,
  };
  
  function handleClickActions(action, data) {
    switch (action) {
      case 'edit': taskEditFile(data); break;
      case 'move': taskMoveFile(data); break;
      case 'rename': taskRenameFile(data); break;
      case 'delete': taskDeleteFile(data); break;
      case 'changeDir': taskChangeDir(data); break;
    }
  }
  
  function HandleClickListFiles(evt) {
    let targetEl = evt.target;
    if (!targetEl.closest('[data-kind="item"]')) return;
    if (!targetEl.closest('[data-action]')) return;
    
    let itemEl = targetEl.closest('[data-kind="item"]');
    if (!itemEl) return;
    
    let actionEl = targetEl.closest('[data-action]');
    let action = actionEl?.dataset.action;
    if (!actionEl) return;
    
    let data = {
      fileName: itemEl.dataset.fileName,
      fileType: itemEl.dataset.fileType,
    };
    
    handleClickActions(action, data);
  }
  
  async function PickFolder() {
    const dirHandle = await window.showDirectoryPicker();
    await compoFile.TaskImportToFS(dirHandle);
    
    RefreshFiles();
    uiGit.ReloadGitFileStatus();
    uiGit.TaskRefreshCommits();
    uiGit.CheckGitPath();
  }
  
  async function taskEditFile(data) {
    let fileContent = await compoFile.TaskReadFileContent(data.fileName);
    let content = window.prompt('File content', fileContent);
    if (content === null) return;
    
    await compoFile.TaskUpdateFile(data.fileName, content);
    
    uiGit.ReloadGitFileStatus();
  }
  
  async function taskMoveFile(data) {
    let {fileName, fileType} = data;
    let currentPath = compoFile.GetCurrentPath();
    let userVal = window.prompt('Target path', currentPath);
    
    if (userVal === null || currentPath == userVal) return;

    if (fileType == 'folder') {
      await compoFile.TaskMoveDir(fileName, userVal);
    } else {
      await compoFile.TaskMoveFile(fileName, userVal);
    }
    
    RefreshFiles();
    uiGit.ReloadGitFileStatus();
  }
  
  async function taskRenameFile(data) {
    let userVal = window.prompt('File name', data.fileName);
    if (!userVal) return;
    
    await  compoFile.TaskRenameFile(data.fileName, userVal);

    uiFileExplorer.RefreshFiles();
    uiGit.ReloadGitFileStatus();
  }
  
  async function taskDeleteFile(data) {
    let isConfirm = window.confirm('Are you sure?');
    if (!isConfirm) return;
    
    await compoFile.TaskRemoveFile(data.fileName);
    
    uiFileExplorer.RefreshFiles();
    uiGit.ReloadGitFileStatus();
  }
  
  
  async function taskChangeDir(data) {
    compoFile.SetCurrentPath(data.fileName);
    uiFileExplorer.RefreshFiles();
  }
  
  async function ExportFiles() {
    const dirHandle = await window.showDirectoryPicker();
    await compoFile.TaskExportToFileSytemAccess(dirHandle);
  }
  
  async function RefreshFiles() {
    let items = await compoFile.task.listDirWithType();
    
    let container = $('#list-files');
    container.innerHTML = '';
    let docFrag = document.createDocumentFragment();
    
    for (let item of items) {
      let el = window.templateSlot.fill({
        data: {
          fileName: item.fileName,
          type: item.type,
        }, 
        template: document.querySelector('#tmp-list-files').content.cloneNode(true), 
      });
      
      let itemEl = el.querySelector('[data-kind="item"]');
      
      DOMUtils.SetData(itemEl, 'fileName', item.fileName);
      DOMUtils.SetData(itemEl, 'fileType', item.type);
      
      if (item.type == 'file') {
        viewStateUtil.Add('fileItem', ['isFile'], itemEl);
      } else {
        viewStateUtil.Add('fileItem', ['isFolder'], itemEl);
      }
      
      docFrag.append(el);
    }
    
    container.append(docFrag);
    
    reloadCurrentDir();
  }
  
  function reloadCurrentDir() {
    let path = compoFile.GetCurrentPath();
    DOMUtils.SetHTML($('._label-current-dir'), path);
  }
  
  return SELF;
  
})();