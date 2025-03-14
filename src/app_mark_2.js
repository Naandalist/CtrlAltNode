const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");

async function searchKBBI(searchTerm) {
  const searchResponse = await axios.get(
    `https://${process.env.BASE_URL}/entri/${String(searchTerm)}`
  );

  const $ = cheerio.load(searchResponse.data);

  const currentData = require(`./data_1.0.0/a/${searchTerm}.json`);
  const result = { ...currentData, data: [] };

  //   const aJson = require('./data/a.json');

  $(".body-content > h4:contains('Pesan')")
    .nextAll()
    .each(function () {
      $(this).remove();
    });

  for (let i = 0; i < $(".body-content > h2").length; i++) {
    let lema = $(".body-content > h2").eq(i).text().trim();
    let kelas_kata = "";
    let deskripsi = "";
    let arti = [];

    const list = $(".body-content > h2")
      .eq(i)
      .nextAll("ul, ol")
      .first()
      .find("li");

    if (list.length === 0) continue;

    for (let j = 0; j < list.length; j++) {
      kelas_kata = "";
      for (let k = 0; k < list.eq(j).find("span").length; k++) {
        let getAttributeTitle = list.eq(j).find("span").eq(k).attr("title");
        kelas_kata += `${list
          .eq(j)
          .find("span")
          .eq(k)
          .text()}[${getAttributeTitle}] `;
        list.eq(j).find("span").eq(k).empty();
      }

      deskripsi = list
        .eq(j)
        .html()
        .replace(/<(?:.|\n)*?>/gm, "")
        .replace(/\n/g, "")
        .trim();

      arti[j] = {
        kelas_kata: kelas_kata.trim(),
        deskripsi,
      };
    }

    result.data[i] = {
      lema,
      arti,
    };
  }

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
  const wordlist = await readFiles("data_1.0.0/a");

  try {
    for (let i = 300; i < wordlist.length; i++) {
      const currentData = require(`./data_1.0.0/a/${wordlist[i]}.json`);

      if (!currentData.data) {
        const result = await searchKBBI(wordlist[i]);

        if (
          result.data.length > 0 &&
          result.data.every((item) => item !== null)
        ) {
          await saveResults(wordlist[i], result);
        }
      } else {
        console.log("skip: ", wordlist[i]);
      }

      updateProgressBar(i + 1, wordlist.length);
    }
  } catch (error) {
    console.error("An error occurred in main:", error.message);
  }
}

main();
