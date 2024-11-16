export let DOMUtils = (function() {

  let SELF = {
    innerHTML: SetHTML,
    dataset: SetData,
    SetHTML,
    SetData,
  };
  
  function SetHTML(el, string = '') {
    el?.replaceChildren(html(string))
    if (!el) {
      logError();
    }
  }
  
  function SetData(el, key, value) {
    if (!el) {
      logError()
      return 
    }
    
    try {
      el.dataset[key] = value;
    } catch (error) {
      logError(error)
    }
  }
  
  function html(string) {
    let renderer = document.createElement('template');
    renderer.innerHTML = string;
    return renderer.content;
  }
  
  function logError(error = new Error('Target element not found.')) {
    const stackLines = error.stack.split('\n');
    const callerLine = stackLines[2]; // 2 is the index of the caller line
    console.error(stackLines[0], callerLine.trim());
  }
  
  return SELF;
    
})();