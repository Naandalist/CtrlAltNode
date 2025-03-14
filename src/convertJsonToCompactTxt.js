const fs = require("fs").promises;

async function convertJsonToCompactTxt(inputFile, outputFile) {
  try {
    // Read the JSON file
    const jsonData = await fs.readFile(inputFile, "utf8");

    // Parse the JSON data
    const data = JSON.parse(jsonData);

    // Convert the data to a compact string
    const compactString = JSON.stringify(data).replace(/\s/g, "");

    // Write the compact string to the output file
    await fs.writeFile(outputFile, compactString, "utf8");

    console.log(`Converted ${inputFile} to compact format in ${outputFile}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Usage
convertJsonToCompactTxt("./output/a.json", "./output/a.txt").catch(
  console.error
);
