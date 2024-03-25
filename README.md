# plain-js-git
Minimal git client for the web using [isomorphic-git](https://isomorphic-git.org/), with [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) functionality. Remote actions are not included (e.g. clone, push, pull).

Useful for quickly managing local git repository where git client is not installed or loading IDE with integrated git client takes time (e.g. VSCode on low-end laptops and Chromebooks).

# How To

## Get StatusMatrix
```
await compoGit.TaskGetStatusMatrix()
```

# Development

## Updating the Page
I use [divless HTML](https://github.com/tmpmachine/divless-html) format. If possible, edit the `.divless/index.html` file instead of editing `index.html` directly. You'll need to install the [Divless HTML VS Code extension](https://marketplace.visualstudio.com/items?itemName=PacoLemon.divlesshtml) to convert the format automatically upon saving.
