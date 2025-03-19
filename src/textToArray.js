const fs = require("fs");
const path = require("path");

// Source and destination directories
const sourceDir = "../output/wordlist";
const destDir = "../output/JS";

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Get all txt files from the source directory
const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".txt"));

files.forEach((file) => {
  // Read file content
  const filePath = path.join(sourceDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  // Split content by newlines and filter out empty lines
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  // Create JavaScript array string with proper formatting
  const arrayString = JSON.stringify(lines, null, 2);

  // Get uppercase letter for variable name (e.g., 'a.txt' becomes 'A')
  const varName = path.basename(file, ".txt").toUpperCase();

  // Create JavaScript export content
  const jsContent = `export const ${varName} = ${arrayString};`;

  // Determine output filename (e.g., 'a.txt' becomes 'A.js')
  const outputFile = `${varName}.js`;
  const outputPath = path.join(destDir, outputFile);

  // Write the JavaScript file
  fs.writeFileSync(outputPath, jsContent);

  console.log(`Converted ${file} to ${outputFile}`);
});

console.log("All files have been converted successfully!");
