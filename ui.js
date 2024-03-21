import { DOMEvents } from './dom-events.js';
import { viewStatesMap } from './view-states.js';
import { uiGit } from './uis/git-ui.js';

export let ui = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    Init,
    TaskReadFile,
    TaskUpdateFile,
    TaskGetStagingFile,
    GetActiveBranch,
    ListBranch,
    CheckoutBranch,
    CreateBranch,
    GitStatus,
    GitAdd,
    GitCommit,
    CreateFile,
    GetDiff,
    CreateDir, 
    ClearFileSystem,
    NavigatePreviousDir,
    SetupGitRepository,
  };
  
  let local = {
    dir: '/tutorial',
  };
  
  function NavigatePreviousDir() {
    compoFile.GoBack();
    uiGit.CheckGitPath();
    uiFileExplorer.RefreshFiles();
  }
  
  async function SetupGitRepository() {
    await compoGit.TaskInit();
    await uiGit.CheckGitPath();
  }
  
  async function ClearFileSystem() {
    let isConfirm = window.confirm('Are you sure?');
    if (!isConfirm) return;
    
    await compoFile.ClearFileSystem();
    
    uiGit.CheckGitPath();
    uiFileExplorer.RefreshFiles();
    uiGit.ReloadGitFileStatus();
  }
  
  async function CreateDir() {
    let userVal = window.prompt('Dir name');
    if (!userVal) return;
    
    await compoFile.TaskCreateDir(userVal);
    uiFileExplorer.RefreshFiles();
    console.log('Directory created successfully');
  }
  
  function Init() {
    viewStateUtil.Init(viewStatesMap); 
    DOMEvents.Init();
    uiGit.CheckGitPath();
    uiGit.ReloadGitFileStatus();
    uiGit.TaskRefreshCommits();
    uiFileExplorer.RefreshFiles();
  }
  
  function CreateBranch() {
    let userVal = window.prompt('Create new branch');
    if (!userVal) return;
    
    let ref = userVal;
    compoGit.TaskCreateBranch(local.dir, ref);
  }
  
  function GitStatus() {
    compoGit.TaskStatus(local.dir);
  }
  
  function CheckoutBranch() {
    let userVal = window.prompt('Branch name');
    if (!userVal) return;
    
    let ref = userVal;
    compoGit.TaskCheckout(local.dir, ref);
  }
  
  function GitAdd() {
    let filePath = window.prompt('File path');
    if (!filePath) return;
    
    compoGit.TaskAdd(local.dir, filePath);
  }
  
  async function GitCommit() {
    await uiGit.Commit();
  }
  
  async function CreateFile() {
    let filePath = window.prompt('File name');
    if (!filePath) return;
    
    await compoFile.TaskAddFile(filePath, '');
    
    uiFileExplorer.RefreshFiles();
    uiGit.ReloadGitFileStatus();
  }
  
  /*function UpdateFile() {
    let filePath = window.prompt('File path');
    if (!filePath) return;
    
    let content = window.prompt('File content');
    if (!content) return;
    
    compoFile.TaskUpdateFile(filePath, content);
  }*/
  
  function GetActiveBranch() {
    compoGit.TaskGetActiveBranch(local.dir).then(item => {
      console.log(item);
    })
  }
  
  function ListBranch() {
    compoGit.TaskListBranch(local.dir).then(items => {
      console.log(items);
    })
    
  }
  
  async function GetDiff() {
    let ref = window.prompt('Ref');
    if (!ref) return;
    
    let dir = window.prompt('Dir');
    if (!dir) return;
    
    let filePath = window.prompt('File path');
    if (!filePath) return;
    
    TaskGetStagingFile(ref, dir, filePath)
  }
  
  async function TaskGetStagingFile(ref, dir, filePath) {
    return await compoGit.TaskReadFileContent(ref, dir, filePath);
  }
  
  async function TaskReadFile() {
    let userVal = window.prompt('File path');
    if (!userVal) return;

    return await compoFile.TaskReadFileContent(userVal)
  }
  
  async function TaskUpdateFile(content) {
    await compoFile.TaskUpdateFile('/tutorial/readme.md', `${content}`)
  }
  
  function getActiveBranch() {
    compoGit.TaskGetActiveBranch('/tutorial')
  }
  
  function todo() {
    
  }
  
  return SELF;
  
})();