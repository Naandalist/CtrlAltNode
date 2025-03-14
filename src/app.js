const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");

async function loginToKBBI(credentials) {
  const loginUrl = `https://${process.env.BASE_URL}/Account/Login`;

  const response = await axios.get(loginUrl);
  const $ = cheerio.load(response.data);
  const token = $('input[name="__RequestVerificationToken"]').val();

  const formData = new URLSearchParams();
  formData.append("__RequestVerificationToken", token);
  formData.append("Posel", credentials.Posel);
  formData.append("KataSandi", credentials.Posel);

  const cookies = response.headers["set-cookie"];

  const loginResponse = await axios.post(loginUrl, formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies.join("; "),
    },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 303,
  });

  if (loginResponse.status !== 302) {
    throw new Error("Login failed. Please check your credentials.");
  }

  return loginResponse.headers["set-cookie"].join("; ");
}

async function searchKBBI(searchTerm, cookies) {
  const searchResponse = await axios.get(
    `https://${process.env.BASE_URL}/entri/${String(searchTerm)}`
    // {
    //   headers: {
    //     "Content-Type": "application/x-www-form-urlencoded",
    //     Cookie: cookies,
    //   },
    // }
  );

  const $ = cheerio.load(searchResponse.data);

  const result = {
    istilah: searchTerm,
    entri: $("h2").first().text().trim(),
    bentukTidakBaku: $("h2 small b").text().trim(),
    definisi: [],
    kataTurunan: [],
    gabunganKata: [],
    peribahasa: [],
    etimologi: {
      bahasaAsal: "",
      arti: "",
      kataAsal: "",
    },
  };

  function formatDefinition(definition) {
    // If the definition is "Usulkan makna baru", return null
    if (definition === "Usulkan makna baru") {
      return null;
    }

    // Regular expression to match the type and detail
    const match = definition.match(/^(\w+)\s+(?:\w+\s+)?(.+)$/);

    if (match) {
      const [, type, detail] = match;
      return {
        jenis: type.trim(),
        arti: definition.trim(),
      };
    }

    // If no match, return null
    return null;
  }

  $("ol > li").each((_, element) => {
    const text = $(element).text().trim();

    if (text !== "Usulkan makna baru") {
      result.definisi.push(formatDefinition(text));
    }
  });

  if (result.definisi.length < 1) {
    $("ul.adjusted-par > li")
      .slice(0, 1)
      .each((_, element) => {
        const text = $(element).text();
        result.definisi.push(formatDefinition(text));
      });
  }

  $('h4:contains("Kata Turunan") + ul li').each((_, element) => {
    result.kataTurunan = result.kataTurunan.concat(
      $(element)
        .text()
        .split(";")
        .map((word) => word.trim())
    );
  });

  $('h4:contains("Gabungan Kata") + ul li').each((_, element) => {
    result.gabunganKata = result.gabunganKata.concat(
      $(element)
        .text()
        .split(";")
        .map((word) => word.trim())
    );
  });

  $('h4:contains("Peribahasa") + ul li').each((_, element) => {
    result.peribahasa.push($(element).text().trim());
  });

  $('b:contains("Etimologi:")+ i').each((_, element) => {
    const text = $(element).text().trim();
    if (text) {
      result.etimologi.bahasaAsal = $(element).text().trim();
    }
  });

  $('b:contains("Etimologi:") ~ span b i').each((_, element) => {
    const text = $(element).text().trim();
    if (text) {
      result.etimologi.kataAsal = text;
    }
  });

  $('b:contains("Etimologi:")')
    .parent()
    .contents()
    .filter(function () {
      return this.nodeType === 3 && this.nodeValue.trim().length > 0;
    })
    .each((_, element) => {
      const text = element.nodeValue.trim();
      if (text) {
        result.etimologi.arti = text
          .replace(/^\[|\]$/g, "")
          .trim()
          .replace(/'/g, "");
      }
    });

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

async function main() {
  const credentials = {
    Posel: process.env.POSEL,
    KataSandi: process.env.KATASANDI,
  };

  // const terms = await readTxtFile();

  const terms = ["raja", "permaisuri"];

  try {
    // const cookies = await loginToKBBI(credentials);

    // if (cookies) {
    for (let i = 0; i < terms.length; i++) {
      const result = await searchKBBI(terms[i], (cookies = null));
      if (
        result.definisi.length > 0 &&
        result.definisi.every((item) => item !== null)
      ) {
        await saveResults(terms[i], result);
      } else {
        console.log("Skip: ", terms[i]);
      }
      updateProgressBar(i + 1, terms.length);
      // }
      // } else {
      // console.log("fail to login");
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

main();

// const credentials = {
//   Posel: process.env.POSEL,
//   KataSandi: process.env.KATASANDI,
// };

// console.log("cred: ", credentials);
