import { ui } from './ui.js';
import { uiGit } from './uis/git-ui.js';
import { uiFileExplorer } from './uis/file-explorer-ui.js';

import { compoGit } from './components/git-component.js';
import { compoFile } from './components/file-component.js';
import { compoFSA } from './components/fsa-component.js';

import { DOMUtils } from './utils/dom-utils.js';
import { viewStateUtil } from './utils/view-state-utils.js';

import http from 'https://unpkg.com/isomorphic-git/http/web/index.js';

window.token = '';

window.ui = ui;
window.uiGit = uiGit;
window.uiFileExplorer = uiFileExplorer;

// components
window.compoFile = compoFile;
window.compoGit = compoGit;
window.compoFSA = compoFSA;

window.http = http;

window.dom = DOMUtils;
window.DOMUtils = DOMUtils;
window.viewStateUtil = viewStateUtil;

compoFile.Init();
compoGit.SetPlugins({
  fs: compoFile.GetFS(),
});
window.fs = compoFile.GetFS();

ui.Init();

/*
compoFile.TaskAddFile('/tutorial/readme.md', 'someha')

compoGit.TaskStatus('/tutorial')
*/