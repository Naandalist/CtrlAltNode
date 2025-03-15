const fs = require("fs");
const path = require("path");

const directoryPath = "../output/wordlist";
// Output file name
const outputFileName = "a-z.txt";

// Function to merge text files
async function mergeTextFiles() {
  try {
    // Read all files in the directory
    const files = await fs.promises.readdir(directoryPath);

    // Filter for .txt files only and sort them alphabetically
    const txtFiles = files
      .filter((file) => path.extname(file).toLowerCase() === ".txt")
      .sort();

    console.log(`Found ${txtFiles.length} .txt files to merge`);

    // Create a write stream for the output file
    const outputStream = fs.createWriteStream(
      path.join(directoryPath, outputFileName)
    );

    // Process each file sequentially
    for (const file of txtFiles) {
      // Skip the output file if it already exists in the directory
      if (file === outputFileName) continue;

      console.log(`Processing: ${file}`);

      // Read the content of the current file
      const content = await fs.promises.readFile(
        path.join(directoryPath, file),
        "utf8"
      );

      // Write the content to the output file
      outputStream.write(content);

      // Add a newline between files (optional)
      outputStream.write("\n");
    }

    // Close the write stream
    outputStream.end();
    console.log(`All files merged into ${outputFileName} successfully!`);
  } catch (err) {
    console.error("Error merging files:", err);
  }
}

// Run the function
mergeTextFiles();
