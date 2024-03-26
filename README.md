# plain-js-git
Minimal git client for the web using [isomorphic-git](https://isomorphic-git.org/), with [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) functionality. Remote actions are not included (e.g. clone, push, pull).

Useful for quickly managing local git repository where git client is not installed or loading IDE with integrated git client takes time (e.g. VSCode on low-end laptops and Chromebooks).

# Limitations
- Slow repository read-write due to having to communicate back and forth between File System Access (FSA) API and lightning-fs. FSA in still a WIP in lightning-fs.
- Can't set commit author, yet.
- No remote actions (clone, push, pull, etc.).

# Troubleshooting
## Line Break Issue
When working on Windows OS, cloned repository files will likely to have a different line break type (CLRF `\r\n`, LF `\n`) from the remote. This causing the files to be marked as modified.

I haven't found any solid solution but you can try to configure git and setup a `.gitattributes` file. **It's required to have git installed on your system**.

```bash
git config --global core.autocrlf input
git rm --cached -r .
git reset --hard
```
References:
- https://stackoverflow.com/a/29888735
- https://www.aleksandrhovhannisyan.com/blog/crlf-vs-lf-normalizing-line-endings-in-git/#a-simple-gitattributes-config


# How To

## Get StatusMatrix
```
await compoGit.TaskGetStatusMatrix()
```

# Development

## Updating the Page
I use [divless HTML](https://github.com/tmpmachine/divless-html) format. If possible, edit the `.divless/index.html` file instead of editing `index.html` directly. You'll need to install the [Divless HTML VS Code extension](https://marketplace.visualstudio.com/items?itemName=PacoLemon.divlesshtml) to convert the format automatically upon saving.
