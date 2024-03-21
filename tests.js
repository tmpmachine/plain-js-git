let tests = (function() {
  
  let SELF = {
    Init,
    appendGitTree,
    addFolderToTree,
  };
  
  let email = 'bill.sangbyte@gmail.com'
  let username = 'sb7cmp';
  let repoName = 'practice'
  let branch = 'master';
  let sha1 = '';
  let sha2 = '';
  let sha3 = '';
  let gitTree = [];
  
  function Init() {
    step1();
  }
  
  // get branch info
  function step1() {
    fetch('https://api.github.com/repos/'+username+'/'+repoName+'/branches/'+branch, {
      method:'GET',
      headers:{
        'Authorization':'token '+token
      }
    })
    .then(r => r.json())
    .then(r => {
      sha1 = r.commit.sha;
      step2();
    });
  }

  // create a tree
  function step2() {
    let tree_sha = sha1;
    let input = {
      base_tree: tree_sha,
      tree: gitTree,
    };
    
    fetch('https://api.github.com/repos/'+username+'/'+repoName+'/git/trees', {
      method:'POST',
      headers:{
        'Authorization':'token '+token
      },
      body:JSON.stringify(input)
    })
    .then(r => r.json())
    .then(r => {
      sha2 = r.sha;
      step3();
    });
  }
  
  

  function appendGitTree(path, content) {
    gitTree.push({
      mode: "100644",
      path,
      content: content,
      type: "blob"
    });
  }

  
  function addFolderToTree(folderPath) {
    gitTree.push({
      mode: "040000", // Mode for a directory
      path: folderPath,
      type: "tree"
    });
  }

  // commits the tree
  const step3 = function() {
    let input = {
      message: window.prompt('message'),
      tree: sha2,
      committer: {
        'name':username,
        'email':email
      },
      parents: [sha1]
    }

    fetch('https://api.github.com/repos/'+username+'/'+repoName+'/git/commits', {
      method:'POST',
      headers:{
        'Authorization':'token '+token
      },
      body:JSON.stringify(input)
    }).then(r => r.json()).then(r => {
      sha3 = r.sha
      step4()
    })
  }

  const step4 = function() {
    let input = {
      sha: sha3
    }
    fetch('https://api.github.com/repos/'+username+'/'+repoName+'/git/refs/heads/'+branch, {
      method:'PATCH',
      headers:{
        'Authorization':'token '+token
      },
      body:JSON.stringify(input)
    }).then(r => r.json()).then(r => {
      // L(r);
      console.log(r)
    })
  }


  return SELF;
  
})();

window.tests = tests;