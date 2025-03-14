const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");

const FOLDER = "a";

async function searchKBBI(searchTerm) {
  // https://kamus-kbbi-api.adaptable.app/entri/kucing
  const searchResponse = await axios.get(
    `https://ethical-canid-naandalist-lab-ddf56b82.koyeb.app/entri/${String(
      searchTerm
    )}`
  );

  console.log("res: ", searchResponse.data.data);

  const currentData = require(`./data_1.0.0/${FOLDER}/${searchTerm}.json`);
  const result = { ...currentData, data: searchResponse.data.data };

  delete result.definisi;

  return result;
}

async function saveResults(searchTerm, result) {
  const dataDir = path.join(__dirname, `data_1.0.0/${searchTerm[0]}`);

  // Create the data directory if it doesn't exist
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }

  const filePath = path.join(dataDir, `${searchTerm}.json`);
  await fs.writeFile(filePath, JSON.stringify(result, null, 2));
  console.log(` ___________ ${searchTerm} ✅`);
}

async function readTxtFile() {
  try {
    const data = await fs.readFile("WORDLIST.txt", "utf8");
    const dataArray = data.trim().split("\n");
    return dataArray;
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

function updateProgressBar(current, total) {
  const percentage = Math.round((current / total) * 100);
  const filledWidth = Math.round((percentage / 100) * 20);
  const emptyWidth = 20 - filledWidth;
  const progressBar =
    "[" + "=".repeat(filledWidth) + " ".repeat(emptyWidth) + "]";
  process.stdout.write(
    `\rProgress: ${progressBar} ${percentage}% (${current}/${total})`
  );
}

function randomDelay() {
  const delays = [500, 1000, 2000, 3000, 4000, 5000];
  return delays[Math.floor(Math.random() * delays.length)];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readFiles(folderName) {
  const folderPath = path.join(__dirname, folderName);

  let filenames = [];

  try {
    const files = await fs.readdir(folderPath);
    files.forEach((file) => {
      const filenameWithoutExtension = path.basename(file, path.extname(file));
      filenames.push(filenameWithoutExtension);
    });
    return filenames;
  } catch (err) {
    console.error("Error reading directory:", err);
    return [];
  }
}

async function main() {
  const wordlist = await readFiles(`data_1.0.0/${FOLDER}`);

  try {
    for (let i = 506; i < wordlist.length; i++) {
      const currentData = require(`./data_1.0.0/${FOLDER}/${wordlist[i]}.json`);

      if (!currentData.data) {
        const result = await searchKBBI(wordlist[i]);

        if (
          result.data.length > 0 &&
          result.data.every((item) => item !== null)
        ) {
          await saveResults(wordlist[i], result);
        }
      }

      updateProgressBar(i + 1, wordlist.length);
    }
  } catch (error) {
    console.error("An error occurred in main:", error.message);
  }
}

main();
