#!/usr/bin/env node
import finder from "find-package-json";
import { readdirSync, writeFile } from "fs";
import * as path from "path";
const packageInfo = finder().next().value;
console.log(packageInfo);
console.log(packageInfo["css-root-path"]);
const newLine = "\n";
const extensions = new Set(["css", "scss", "sass"]);
/**
 * css import 문을 가지고 있는 index.js 라는 파일을 생성한다.
 *
 * css root directory 위치는 package.json 파일의 "css-root-path" 를 통해 지정할 수 있다.
 * index.js 파일은 css root directory 에 위치한다.
 */
const cssRootDirectory = process.env.npm_package_css_root_path;
let content = "";
const makeEmptyLine = () => {
    return newLine;
};
const makeImport = ({ relativePath }) => {
    return `import './${relativePath}'${newLine}`;
};
const makeComment = ({ comment }) => {
    return `// ${comment}${newLine}`;
};
const generateImport = ({ root, currentDirectory }) => {
    const dirents = readdirSync(currentDirectory, { withFileTypes: true });
    const directories = dirents.filter((dirent) => dirent.isDirectory());
    const files = dirents.filter((dirent) => dirent.isFile());
    // comment directory
    if (content.length > 0)
        content += makeEmptyLine();
    content += makeComment({ comment: `in directory ${path.relative(root, currentDirectory)}` });
    // files
    files.forEach((file) => {
        const extension = file.name.split(".").pop();
        if (extension && extensions.has(extension)) {
            content += makeImport({ relativePath: path.join(path.relative(root, currentDirectory), file.name) });
        }
    });
    // call for sub-directories
    directories.forEach((directory) => {
        generateImport({
            root,
            currentDirectory: path.resolve(currentDirectory, directory.name),
        });
    });
};
if (cssRootDirectory) {
    generateImport({ root: cssRootDirectory, currentDirectory: cssRootDirectory });
    writeFile(path.resolve(cssRootDirectory, "index.js"), content, (err) => {
        if (err) {
            console.error(err);
        }
    });
}
