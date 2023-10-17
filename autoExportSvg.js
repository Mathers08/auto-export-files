import fs from 'fs';
import path from 'path';

const assetsFolderPath = './assets';

// Convert to camel case
function toCamelCase(fileName) {
  return fileName
    .split(/-|_/g)
    .map((name, index) => index > 0 ? name.charAt(0).toUpperCase() + name.slice(1) : name)
    .join('');
}

function generateExportStatements(folderPath, files) {
  const relativePath = path.relative(assetsFolderPath, folderPath).replace(/\\/g, '/');
  const folderComment = `// Exporting from: ${relativePath || '.'}`;
  const fileExports = files.map(file => {
    const relativeFilePath = path.relative(assetsFolderPath, file).replace(/\\/g, '/');
    return `export { default as ${path.basename(toCamelCase(file), path.extname(file))} } from './${relativeFilePath}';`;
  });

  return [folderComment, ...fileExports].join('\n') + '\n';
}

function updateIndexFile(indexFilePath, exportStatements) {
  const content = exportStatements.join('\n');
  fs.writeFileSync(indexFilePath, content, 'utf-8');
}

function getAllFiles(folderPath) {
  const files = fs.readdirSync(folderPath);
  return files.map(file => path.join(folderPath, file));
}

function exportImages(folderPath) {
  const allFiles = getAllFiles(folderPath);

  const imageFiles = allFiles.filter(file => /\.(svg|png|jpg|jpeg)$/i.test(file));
  if (imageFiles.length > 0) {
    return generateExportStatements(folderPath, imageFiles);
  }

  const nestedExports = allFiles
    .filter(file => fs.statSync(file).isDirectory())
    .map(subfolder => exportImages(subfolder))
    .flat();

  return nestedExports;
}

// Run the script
const exportStatements = exportImages(assetsFolderPath);
const indexFilePath = path.join(assetsFolderPath, 'index.js');
updateIndexFile(indexFilePath, exportStatements);
