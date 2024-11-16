export let uiGit = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    Commit,
    ReloadGitFileStatus: RefreshGitFileStatus,
    TaskRefreshCommits,
    HandleClickListGitFiles,
    CheckGitPath,
    DiscardAllChanges,
  };
  
  function handleClickActions(action, data) {
    switch (action) {
      case 'git-add': taskGitAddFile(data); break;
      case 'git-unstage': taskGitRemoveFile(data); break;
      case 'git-discard-changes': taskGitDiscardChanges(data); break;
      case 'git-diff': taskDiff(data); break;
    }
  }
  
  async function taskDiff(data) {
    await uiEditor.TaskInitEditor();

    let originalContent = '';
    let modifiedContent = '';
    
    if (data.gitState == compoGit.statusMatrix.MODIFIED_UNSTAGED) {
      let fileContents = await compoGit.GetStagedFileContents('/', [data.filePath]);
      let decoder = new TextDecoder('utf-8');
      let content = decoder.decode(fileContents[0].contents);

      originalContent = content.toString('utf-8');
      modifiedContent = await compoFile.TaskReadFileContent(data.filePath);
    } else {
      console.log('Git file state not recognized for diffing: ', data.gitState);
    }
    
    uiEditor.Diff(originalContent, modifiedContent);
  }
  
  async function DiscardAllChanges() {
    
    let isConfirm = window.confirm('Are you sure?');
    if (!isConfirm) return;
    
    let stagedChangesStates = [
      compoGit.statusMatrix.ADDED_STAGED,
      compoGit.statusMatrix.MODIFIED_STAGED,
      compoGit.statusMatrix.DELETED_STAGED,
    ];
    
    let items = await taskGetGitFiles();    
    items = items.filter(item => !stagedChangesStates.includes(item.status));
    
    for (let item of items) {
      await taskDiscardChanges({
        filePath: item.filePath,
        gitState: item.status,
      });
    }

    uiFileExplorer.RefreshFiles();
    RefreshGitFileStatus();    
  }
  
  async function CheckGitPath() {
    viewStateUtil.Remove('features', ['git']);
    
    let rootPath = await compoGit.TaskFindRoot();
    if (rootPath) {
      viewStateUtil.Add('features', ['git']);
    }
  }
  
  function HandleClickListGitFiles(evt) {
    let targetEl = evt.target;
    if (!targetEl.closest('[data-kind="item"]')) return;
    if (!targetEl.closest('[data-action]')) return;
    
    let itemEl = targetEl.closest('[data-kind="item"]');
    if (!itemEl) return;
    
    let actionEl = targetEl.closest('[data-action]');
    if (!actionEl) return;
    
    let id = itemEl.dataset.id;
    let action = actionEl.dataset.action;
    
    let data = {
      filePath: itemEl.dataset.filePath,
      fileStatus: itemEl.dataset.fileStatus,
      gitState: itemEl.dataset.gitState,
    };
    
    handleClickActions(action, data);
  }
  
  async function taskGitAddFile(data) {
    let {filePath, gitState} = data;
    let allowedGitState = [
      compoGit.statusMatrix.UNTRACKED,
      compoGit.statusMatrix.MODIFIED_UNSTAGED,
      compoGit.statusMatrix.DELETED_MODIFIED,
      compoGit.statusMatrix.MODIFIED_STAGED_CHANGES,
      compoGit.statusMatrix.ADDED_STAGED_CHANGES,
      compoGit.statusMatrix.DELETED_UNTRACKED,
    ];
    
    
    if (gitState == compoGit.statusMatrix.DELETED || gitState == compoGit.statusMatrix.MODIFIED_DELETED || gitState == compoGit.statusMatrix.ADDED_DELETED) { // hack: add deleted file (see reference #1)
      
      let createdDirs = [];
      
      createdDirs = await compoFile.TaskAddFileAtPath(filePath, {
        recursive: true,
      });
      await compoGit.TaskRemove(data.filePath);
      
      if (createdDirs.length > 0) {
        let topMostCreatedDirName = createdDirs[0];
        await compoFile.TaskRemoveDir('/' + topMostCreatedDirName);
      } else {
        await compoFile.TaskUnlinkFileAtPath('/' + filePath);
      }
      
    } else if (allowedGitState.includes(gitState)) {
      await compoGit.TaskAdd(filePath);
    } else {
      console.log('File status not recognized: ', gitState);
      return;
    }
    
    RefreshGitFileStatus();
  }
  
  async function taskGitRemoveFile(data) {
    let {filePath, gitState} = data;
    let allowedGitState = [
      compoGit.statusMatrix.MODIFIED_STAGED,
      compoGit.statusMatrix.ADDED_STAGED,
      compoGit.statusMatrix.DELETED_STAGED,
      compoGit.statusMatrix.MODIFIED_STAGED_CHANGES,
    ];
    
    if (data.gitState == compoGit.statusMatrix.DELETED_STAGED) { // hack: unstage deleted file (see reference #1)
    
      let createdDirs = [];
      
      createdDirs = await compoFile.TaskAddFileAtPath(filePath, {
        recursive: true,
      });
      await compoGit.TaskAdd(data.filePath);
      
      if (createdDirs.length > 0) {
        let topMostCreatedDirName = createdDirs[0];
        await compoFile.TaskRemoveDir('/' + topMostCreatedDirName);
      } else {
        await compoFile.TaskUnlinkFileAtPath('/' + filePath);
      }
      
    } else if (allowedGitState.includes(data.gitState)) {
      await compoGit.TaskRemove(data.filePath);
    } else {
      console.log('File status not recognized');      
      return;
    }
    
    RefreshGitFileStatus();
  }
  
  async function taskGitDiscardChanges(data) {
    let isConfirm = window.confirm('Are you sure?');
    if (!isConfirm) return;
    
    await taskDiscardChanges(data);
    
    uiFileExplorer.RefreshFiles();
    RefreshGitFileStatus();
  }
  
  async function taskDiscardChanges(data) {
    let {filePath, gitState} = data;
    
    if (gitState == compoGit.statusMatrix.UNTRACKED) { // remove untracked file
      await compoFile.TaskUnlinkFileAtPath('/' + filePath);
    } else if (gitState == compoGit.statusMatrix.MODIFIED_STAGED_CHANGES || gitState == compoGit.statusMatrix.ADDED_STAGED_CHANGES || gitState == compoGit.statusMatrix.ADDED_DELETED || gitState == compoGit.statusMatrix.MODIFIED_MODIFIED) { // restore content from from index
      await compoGit.TaskCheckoutFromIndex(filePath);
    } else {
      await compoGit.TaskDiscardChanges(filePath);
    }
  }
  
  async function Commit() {
    let authorName = $('._inAuthorName')?.value;
    let authorEmail = $('._inAuthorEmail')?.value;
    let commitMessage = $('._inCommitMsg')?.value;
    
    if (!commitMessage || !authorName || !authorEmail) {
      alert('Author name/email, message is empty');
      return;
    }
    
    await compoGit.TaskCommit(authorName, authorEmail, commitMessage);
    RefreshGitFileStatus();
    uiGit.TaskRefreshCommits();
  }
  
  async function TaskRefreshCommits() {
    
    let container = $('._listGitCommits');
    let docFrag = document.createDocumentFragment();
    let items = await compoGit.TaskLogs();

    dom.innerHTML(container, '');
    
    for (let item of items) {
      
      let {message} = item;
      
      let el = window.templateSlot.fill({
        data: {
          message,
        }, 
        template: document.querySelector('#tmp-list-git-commit').content.cloneNode(true), 
      });
      docFrag.append(el);
    }
    
    container?.append(docFrag);
    
  }
  
  async function RefreshGitFileStatus() {
    
    let container = $('._listGitFiles');
    let containerChanges = $('._listGitFilesChanges');
    let docFrag = document.createDocumentFragment();
    let docFragChanges = document.createDocumentFragment();
    let items = await taskGetGitFiles();    
    let stagedChangesStates = [
      compoGit.statusMatrix.ADDED_STAGED,
      compoGit.statusMatrix.MODIFIED_STAGED,
      compoGit.statusMatrix.DELETED_STAGED,
    ];
    
    dom.innerHTML(container);
    dom.innerHTML(containerChanges);

    for (let item of items) {
      
      let {filePath, statusLabel, status} = item;
      
      let el = window.templateSlot.fill({
        data: {
          filePath,
          status: statusLabel,
        }, 
        template: document.querySelector('#tmp-list-git-files').content.cloneNode(true), 
      });
      
      let itemEl = el.querySelector('[data-kind="item"]');
      
      DOMUtils.SetData(itemEl, 'filePath', filePath);
      DOMUtils.SetData(itemEl, 'fileStatus', statusLabel);
      DOMUtils.SetData(itemEl, 'gitState', status);
      
      
      if (status == compoGit.statusMatrix.MODIFIED_STAGED_CHANGES || status == compoGit.statusMatrix.ADDED_STAGED_CHANGES || status == compoGit.statusMatrix.ADDED_DELETED || status == compoGit.statusMatrix.DELETED_UNTRACKED || status == compoGit.statusMatrix.MODIFIED_MODIFIED) {
      
        docFrag.append(el.cloneNode(true));
        docFragChanges.append(el.cloneNode(true));
        
      } else {
        
        if (stagedChangesStates.includes(status)) {
          docFrag.append(el);
        } else {
          docFragChanges.append(el);
        }
        
      }
      
    }
    
    container?.append(docFrag);
    containerChanges?.append(docFragChanges);
    
    // reloadCurrentDir();
  }
  
  async function taskGetGitFiles() {
    
    let items = [];
    
    let statusMatrix = await compoGit.TaskGetStatusMatrix();
    if (!statusMatrix) return items;
    
    for (let item of statusMatrix) {
      let gitFileState = compoGit.GetGitStatusMatrixState(item[1], item[2], item[3]);
      let statusLabel = compoGit.GetGitStatusMatrixLabel(gitFileState);

      if (gitFileState == compoGit.statusMatrix.UNMODIFIED) {
        continue;
      }
      
      items.push({
        statusLabel,
        filePath: item[0],
        status: gitFileState,
      });
    }
    
    return items;
  }
  
  
  return SELF;
  
})();