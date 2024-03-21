export let DOMEvents = (function() {
    
  let eventsMap = {
    onclick: {
      'discard-all-changes': () => uiGit.DiscardAllChanges(),
      'refresh-dir': () => uiFileExplorer.RefreshFiles(),
      'export-files': () => uiFileExplorer.ExportFiles(),
      'clear-file-system': () => ui.ClearFileSystem(),
      'create-dir': () => ui.CreateDir(),
      'pick-folder': () => uiFileExplorer.PickFolder(),
      'git-init': () => ui.SetupGitRepository(),
      'get-file': () => ui.TaskReadFile(),
      'get-diff': () => ui.GetDiff(),
      'update-file': () => ui.UpdateFile(),
      'create-file': () => ui.CreateFile(),
      'navigate-previous-dir': () => ui.NavigatePreviousDir(),
      'handle-click-list-files': (evt) => uiFileExplorer.HandleClickListFiles(evt),
      'handle-click-list-git-files': (evt) => uiGit.HandleClickListGitFiles(evt),
      // 'list-dir': () => compoFile.task.listDir(),
      'get-active-branch': () => ui.GetActiveBranch(),
    	'list-branch': () => ui.ListBranch(),
    	'checkout': () => ui.CheckoutBranch(),
    	'create-branch': () => ui.CreateBranch(),
    	
    	'git-reload-status': () => uiGit.ReloadGitFileStatus(),
      'git-add': () => ui.GitAdd(),
      'git-commit': () => ui.GitCommit(),
    	'git-status': () => ui.GitStatus(),
    	'reload-git-logs': () => uiGit.TaskRefreshCommits(),
    // 	'git-logs': () => compoGit.TaskLogs('/tutorial', 'master'),
    },
  };
  
  function notImplementedCallback(evt) {
    throw {
      error: 'event callback not implemented',
      target: evt.target,
    };
  }
  
  let listening = function(selector, dataKey, eventType, callbacks) {
    let elements = document.querySelectorAll(selector);
    for (let el of elements) {
      let callbackFunc = callbacks[el.dataset[dataKey]];
      if (callbackFunc === undefined) {
        callbackFunc = notImplementedCallback;
      }
      el.addEventListener(eventType, callbackFunc);
    }
  };
  
  function Init() {
    listening('[data-onclick]', 'onclick', 'click', eventsMap.onclick);
  }
  
  return {
    Init,
  };

})();
