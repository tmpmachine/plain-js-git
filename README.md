# isomorphic-git-example
A put together project example for isomorphic-git without remote actions (clone, push, pull, ...). Supports File System Access API for reading and exporting project directory.

# How To
## Update the Page
I use [divless HTML](https://github.com/tmpmachine/divless-html) format. If possible, edit the `.divless/index.html` file instead of editing `index.html` directly. You'll need to install the [Divless HTML VS Code extension](https://marketplace.visualstudio.com/items?itemName=PacoLemon.divlesshtml) to convert the format automatically upon saving.

## Get StatusMatrix
```
await compoGit.TaskGetStatusMatrix()
```
