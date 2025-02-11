#!/usr/bin/env node
import finder from 'find-package-json';
import { readdirSync, writeFile } from 'fs';
import * as path from 'path/posix';
import { exit } from 'process';
const packageInfo = finder().next().value;
if (packageInfo === undefined) {
    console.error('Failed to get package information. Are you in project directory root-path?');
    exit();
}
const config = packageInfo['css-import-generator'];
if (config === undefined) {
    console.error('Please provide value for "css-import-generator" in package.json field');
    exit();
}
const cssRoot = config['css-root'];
if (cssRoot === undefined) {
    console.error('Please provide value for "css-root" under "css-import-generator" field of "package.json". It\'s necessary');
    exit();
}
const destination = config['destination'] ?? path.resolve(cssRoot, 'index.js');
if (config['destination'] === undefined) {
    console.log(destination);
    console.warn(`"destination" field is missing. It's okay but we will generate output js file at ${destination}\nyou can override this behavior by providing value for "destination" under "css-import-generator" field of "package.json"`);
}
const newLine = '\n';
const extensions = new Set(['css', 'scss', 'sass']);
/**
 * content to write into {destination}
 */
let content = '';
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
    const destinationDirectory = path.dirname(destination);
    const directories = dirents.filter((dirent) => dirent.isDirectory());
    const files = dirents.filter((dirent) => dirent.isFile());
    let hasCssFiles = false;
    let currentDirectoryImportContent = '';
    // files
    files.forEach((file) => {
        const extension = file.name.split('.').pop();
        if (extension && extensions.has(extension)) {
            hasCssFiles = true;
            currentDirectoryImportContent += makeImport({
                relativePath: path.join(path.relative(destinationDirectory, currentDirectory), file.name),
            });
        }
    });
    // comment directory
    if (currentDirectoryImportContent.length > 0 && hasCssFiles) {
        console.log(hasCssFiles);
        currentDirectoryImportContent =
            makeEmptyLine() +
                makeComment({
                    comment: `in directory ${path.relative(destinationDirectory, currentDirectory)}`,
                }) +
                currentDirectoryImportContent;
    }
    content += currentDirectoryImportContent;
    // call for sub-directories
    directories.forEach((directory) => {
        generateImport({
            root,
            currentDirectory: path.resolve(currentDirectory, directory.name),
        });
    });
};
// main-logic
generateImport({ root: cssRoot, currentDirectory: cssRoot });
writeFile(destination, content, (err) => {
    if (err) {
        console.error(err);
    }
});
console.log('\n');
console.log(`successfully generated "${destination}"`);
