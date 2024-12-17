const fs = require('fs');
const path = require('path');
const sloc = require('sloc');

// Function to recursively fetch all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);

        // Skip ignored files or directories
        if (fullPath.includes('node_modules') || 
            fullPath.endsWith('package.json') || 
            fullPath.endsWith('lucide.js') ||
            fullPath.endsWith('package-lock.json')) {
            return;
        }

        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (/\.(js|html|json)$/i.test(fullPath)) { // Include .js, .html, and .json files
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

// Function to count SLOC in all files
function countLines(files) {
    let totalLines = 0;
    files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf8');
        const fileType = path.extname(file).slice(1); // Get the file extension without the dot

        // Use SLOC for .js and .html, but count lines directly for .json
        if (fileType === 'json') {
            totalLines += content.split(/\r?\n/).length;
        } else {
            const stats = sloc(content, fileType);
            totalLines += stats.total;
        }
    });
    return totalLines;
}

// Directory to scan
const projectDir = path.resolve(__dirname); // Adjust this as needed
const files = getAllFiles(projectDir);
const totalLines = countLines(files);

console.log(`Total lines of code: ${totalLines}`);
