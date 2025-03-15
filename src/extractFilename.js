const fs = require("fs");
const path = require("path");

// Function to read all filenames and write to a text file
function exportFilenames(letter) {
  const directoryPath = `../data_1.0.0/${letter}`;

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    // Extract filenames without extensions
    const filenamesWithoutExt = files.map((file) => {
      return path.parse(file).name;
    });

    // Create a string with all filenames (without extensions)
    const fileList = filenamesWithoutExt.join("\n");

    // Write the list to a text file
    fs.writeFile(`../output/wordlist/${letter}.txt`, fileList, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return;
      }
      console.log(
        "Successfully exported filenames (without extensions) to filenames.txt"
      );
    });
  });
}

// Call the function
for (let i = "a".charCodeAt(0); i <= "z".charCodeAt(0); i++) {
  const char = String.fromCharCode(i);
  exportFilenames(char);
}
