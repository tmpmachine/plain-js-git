export let uiEditor = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    TaskInitEditor,
    Diff,
  };
  
  let local = {
    diffEditor: null,
  };
  
  async function TaskInitEditor() {
    return new Promise(resolve => {
      
      if (local.diffEditor) {
        resolve();
        return;
      }
      
      require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' }});
      require(["vs/editor/editor.main"], function () {
        local.diffEditor = monaco.editor.createDiffEditor($('._editorContainer'));
        resolve();
      });
      
    });
  }
  
  function Diff(originalTxt, modifiedTxt) {
		local.diffEditor.setModel({
			original: monaco.editor.createModel(originalTxt, 'javascript'),
			modified: monaco.editor.createModel(modifiedTxt, 'javascript')
		});
  }
  
  return SELF;
  
})();