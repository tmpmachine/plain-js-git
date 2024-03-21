import http from 'https://unpkg.com/isomorphic-git@beta/http/web/index.js';

export let compoGit = (function() {
  
  let SELF = {
    TaskGetStatusMatrix,
    TaskInit,
    TaskAdd,
    TaskRemove,
    TaskStatus,
    TaskGetActiveBranch,
    TaskCheckout,
    TaskCreateBranch,
    TaskDiscardChanges,
    TaskCommit,
    TaskListBranch,
    SetPlugins,
    TaskReadFileContent,
    TaskLogs,
    TaskFindRoot,
    GetGitStatusMatrixLabel,
    GetGitStatusMatrixState,
    TaskCheckoutFromIndex,
    GetStagedFileContents,
  };
  
  let fs = null;
  
  let statusMatrix = {
    UNTRACKED: 's1',
    ADDED_STAGED: 's2',
    UNMODIFIED: 's3',
    MODIFIED_UNSTAGED: 's4',
    ADDED_STAGED_CHANGES: 's5',
    MODIFIED_STAGED: 's6',
    MODIFIED_DELETED: 's7',
    DELETED_MODIFIED: 's8',
    DELETED: 's9',
    DELETED_STAGED: 's10',
    MODIFIED_STAGED_CHANGES: 's11',
    ADDED_DELETED: 's12',
    DELETED_UNTRACKED: 's13',
  };
  
  Object.defineProperty(SELF, 'statusMatrix', {
    get: () => statusMatrix,
  });
  
  async function TaskFindRoot() {
    try {
      let gitroot = await git.findRoot({
        fs: fs,
        filepath: compoFile.GetCurrentPath(),
      });
      return gitroot;
    } catch (e) {}
    
    return null;
  }
  
  function getFS() {
    return compoFile.GetFS();
  }
  
  function SetPlugins(plugins) {
    fs = plugins.fs;
  }
  
  async function TaskReadFileContent(ref, dir, filePath) {
    let fs = getFS();
    
    // Get the contents of 'README.md' in the main branch.
    let commitOid = await git.resolveRef({ fs, dir, ref });
    let { blob } = await git.readBlob({
      fs,
      dir,
      oid: commitOid,
      filepath: filePath
    });
    
    // Convert Uint8Array to string using TextDecoder
    let decoder = new TextDecoder('utf-8');
    let content = decoder.decode(blob);
    
    return content.toString('utf-8');
  }
  
  async function TaskInit() {
    let fs = getFS();
    let currentPath = compoFile.GetCurrentPath();
    await git.init({ fs, dir: currentPath });
  }
    
  async function TaskListIndexFiles() {
    // All the files in the previous commit
    let files = await git.listFiles({ fs, dir: '/tutorial', ref: 'HEAD' });
    console.log(files);
    
    // All the files in the current staging area
    files = await git.listFiles({ fs, dir: '/tutorial' });
    console.log(files);
  
  }
  
  async function TaskGetStatusMatrix() {
    let gitRepoPath = await TaskFindRoot();
    if (!gitRepoPath) return null;
    
    let items = [];
    try {
      items = await git.statusMatrix({
        fs,
        dir: gitRepoPath,
        // filter: f => f.startsWith('src/')
      });
    } catch (e) {}
    
    return items;
  }
  
  function GetGitStatusMatrixLabel(gitFileState) {
    switch (gitFileState) {
      case statusMatrix.MODIFIED_DELETED:
      case statusMatrix.DELETED:
      case statusMatrix.DELETED_STAGED:
      case statusMatrix.ADDED_DELETED:
        return 'D';
      case statusMatrix.MODIFIED_STAGED:
      case statusMatrix.MODIFIED_UNSTAGED:
      case statusMatrix.DELETED_MODIFIED:
      case statusMatrix.MODIFIED_STAGED_CHANGES:
      case statusMatrix.ADDED_STAGED_CHANGES:
        return 'M';
      case statusMatrix.ADDED_STAGED:
        return 'A';
      case statusMatrix.UNTRACKED:
      case statusMatrix.DELETED_UNTRACKED:
        return 'U';
      case statusMatrix.UNMODIFIED:
        return '';
      default:
        console.log('git file state not recognized: ', gitFileState);
        return '?';
    }
  }
  
  function GetGitStatusMatrixState(m1, m2, m3) {
    
    let x = [
      [0, 0, 3, statusMatrix.ADDED_DELETED],
      [0, 2, 0, statusMatrix.UNTRACKED],
      [0, 2, 2, statusMatrix.ADDED_STAGED],
      [0, 2, 3, statusMatrix.ADDED_STAGED_CHANGES],
      [1, 0, 0, statusMatrix.DELETED_STAGED],
      [1, 0, 1, statusMatrix.DELETED],
      [1, 0, 3, statusMatrix.MODIFIED_DELETED],
      [1, 1, 0, statusMatrix.DELETED_UNTRACKED],
      [1, 1, 1, statusMatrix.UNMODIFIED],
      [1, 2, 0, statusMatrix.DELETED_MODIFIED],
      [1, 2, 1, statusMatrix.MODIFIED_UNSTAGED],
      [1, 2, 2, statusMatrix.MODIFIED_STAGED],
      [1, 2, 3, statusMatrix.MODIFIED_STAGED_CHANGES],
    ];
    
    for (let i = 0; i < x.length; i++) {
      let [m1Val, m2Val, m3Val, status] = x[i];
      if (m1 == m1Val && m2 == m2Val && m3 == m3Val) {
        return status;
      }
    }
    
    console.log('git file status not recognized: ', m1, m2, m3);
    return '??';
  }
  
  async function TaskLogs(depth = 5) {
    let items = [];
    let gitRepoPath = await TaskFindRoot();
    
    if (!gitRepoPath) return items;
    
    try {
      let commits = await git.log({
        fs,
        dir: gitRepoPath,
        depth,
        // ref,
      });
      items = commits.map(x => { return { commit: x.oid,message: x.commit.message }; });
    } catch (e) {}
    
    return items;
  }
  
  async function TaskCheckout(dir, ref) {
    // switch to the main branch
    console.log(dir,ref)
    await git.checkout({
      fs,
      dir,
      ref,
    })
    console.log('done')
    
    // await TaskReset();
  }
  
  async function TaskListBranch(dir) {
    let branches = await git.listBranches({ fs, dir })
    console.log(branches)
    // let remoteBranches = await git.listBranches({ fs, dir, remote: 'origin' })
    // console.log(remoteBranches)
  }
  
  async function TaskReset() {
    // restore the 'docs' and 'src/docs' folders to the way they were, overwriting any changes
    await git.checkout({
      fs,
      dir: '/tutorial',
      force: true,
      filepaths: ['docs', 'src/docs']
    });
    console.log('done');
  }
  
  async function TaskGetActiveBranch(dir) {
    let branch = await git.currentBranch({
      fs,
      dir,
      fullname: false
    });
    return branch;
  }
  
  async function TaskCreateBranch(dir, ref) {
    await git.branch({ fs, dir, ref });
    console.log('done');
  }

  async function TaskStatus(dir, filePath = '.') {
    let status = await git.status({ fs, dir, filepath: filePath });
    console.log(status);
  }
  
  async function TaskDiscardChanges(filePath) {
    let gitRepoPath = await TaskFindRoot();
    await git.checkout({
      fs,
      dir: gitRepoPath,
      force: true,
      filepaths: [filePath]
    });
  }
  
  async function TaskAdd(filePath) {
    let gitRepoPath = await TaskFindRoot();
    await git.add({ fs, dir: gitRepoPath, filepath: filePath });
  }
  
  async function TaskRemove(filePath) {
    let gitRepoPath = await TaskFindRoot();
    await git.remove({ fs, dir: gitRepoPath, filepath: filePath });
  }
  
  async function TaskCommit(message = '') {
    
    let files = await TaskGetStatusMatrix();
    let allowedFileStateToCommit = [
      statusMatrix.ADDED_STAGED,
      statusMatrix.MODIFIED_STAGED,
      statusMatrix.DELETED_STAGED,
    ];
    
    let hasFileToCommit = files.some(x => allowedFileStateToCommit.includes(GetGitStatusMatrixState(x[1], x[2], x[3])) );
    if (!hasFileToCommit) {
      console.log('No changes to commit.');
      return;
    }
    
    let gitRepoPath = await TaskFindRoot();
    let sha = await git.commit({
      fs,
      message,
      dir: gitRepoPath,
      author: {
        name: 'Mr. Test',
        email: 'mrtest@example.com',
      },
    });
  }
  
  async function readContentsFromHash(hash, gitDir, filePath = null) {
    let config = {
      fs,
      dir: gitDir,
      oid: hash,
    };
  
    if (filePath) {
      config = {
        ...config,
        filepath: filePath,
      };
    }
  
    const { blob } = await git.readBlob(config);
  
    return blob;
  }
  
  async function GetStagedFileContents(gitDir, stagedFilePaths) {
    const map = async (filePath, [A]) => {
      if (stagedFilePaths.includes(filePath)) {
        const contents = await readContentsFromHash(await A.oid(), gitDir);
  
        return {
          filePath: `/${filePath}`,
          contents,
        };
      }
    };
  
    return await git.walk({
      fs,
      dir: gitDir,
      trees: [git.STAGE()],
      map,
    });
  }
  
  async function TaskCheckoutFromIndex(filePath) {
    let gitRepoPath = await TaskFindRoot();
    let items = await GetStagedFileContents(gitRepoPath, [filePath]);
    let stagedFileContent = items[0]?.contents;
    
    if (!stagedFileContent) return;

    await compoFile.TaskUpdateFileAtPath('/' + filePath, stagedFileContent);
  }

  return SELF;
  
})();