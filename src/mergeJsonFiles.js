const fs = require("fs").promises;
const path = require("path");

async function mergeJsonFiles(rootDir, outputFile) {
  const result = {};

  async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      console.log("entry in: ", entry);

      if (entry.isDirectory()) {
        const letter = entry.name.toLowerCase();
        if (!result[letter]) {
          result[letter] = [];
        }
        await processDirectory(fullPath);
      } else if (entry.isFile() && path.extname(entry.name) === ".json") {
        const content = await fs.readFile(fullPath, "utf-8");
        const jsonContent = JSON.parse(content);
        const letter = path.basename(dir).toLowerCase();

        if (!result[letter]) {
          result[letter] = [];
        }

        const obj = {};
        obj[jsonContent.istilah] = jsonContent;
        result[letter].push(obj);
      }
    }
  }

  await processDirectory(rootDir);

  // Sort the keys alphabetically
  const sortedResult = Object.keys(result)
    .sort()
    .reduce((obj, key) => {
      obj[key] = result[key];
      return obj;
    }, {});

  await fs.writeFile(outputFile, JSON.stringify(sortedResult, null, 2));
  console.log(`Merged JSON written to ${outputFile}`);
}

// Usage
// mergeJsonFiles("./data_1.0.0", "./dist/output.json").catch(console.error);
// mergeJsonFiles("./data_1.0.0/a", "./output/a.json").catch(console.error);
mergeJsonFiles("../data_1.0.0/a", "../output/a.json").catch(console.error);
