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
    `https://${process.env.BASE_URL}/entri/bin`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
    }
  );

  const $ = cheerio.load(searchResponse.data);

  const result = {
    istilah: searchTerm,
    entri: $("h2").first().text().trim(),
    bentukTidakBaku: $("h2 small b").text().trim(),
    kataTurunan: [],
    gabunganKata: [],
    peribahasa: [],
    etimologi: {
      bahasaAsal: "",
      arti: "",
      kataAsal: "",
    },
    data: [],
  };

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

  function sanitizeUndefinedString(input) {
    // Remove '[undefined]' and any trailing spaces
    let sanitized = input.replace(/\[undefined\]/g, "").trim();

    // Remove any trailing space followed by '[' if it exists
    sanitized = sanitized.replace(/\s+\[$/, "");

    return sanitized;
  }

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

      if (!deskripsi.includes("Usulkan makna baru")) {
        arti[j] = {
          kelas_kata: sanitizeUndefinedString(kelas_kata.trim()),
          deskripsi,
        };
      }
    }

    result.data[i] = {
      lema,
      arti,
    };
  }

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

  // Remove the processed word from data.txt
  //   const dataFilePath = path.join(__dirname, "WORDLIST.txt");
  //   let content = await fs.readFile(dataFilePath, "utf8");
  //   content = content
  //     .split("\n")
  //     .filter((line) => !line.includes(searchTerm))
  //     .join("\n");
  //   await fs.writeFile(dataFilePath, content);

  console.log(`   >>>> ${searchTerm} ✅`);
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

function updateProgressBar(current, total, allLength) {
  const percentage = Math.round((current / allLength) * 100);
  const filledWidth = Math.round((percentage / 100) * 20);
  const emptyWidth = 20 - filledWidth;
  const progressBar =
    "[" + "=".repeat(filledWidth) + " ".repeat(emptyWidth) + "]";
  process.stdout.write(
    `\ ${
      total - current
    } -  of ${total}: ${progressBar} ${percentage}% (${current}/${allLength})`
  );
}

async function main() {
  const credentials = {
    Posel: process.env.POSEL,
    KataSandi: process.env.KATASANDI,
  };

  // const terms = await readTxtFile();
  const terms = [
    // "apotek",
    "bin",
    // "b.k.p.h",
    // "botol manci",
    // "fesyenista",
    // "lungguh",
    // "y.t.m",
  ];
  const startIndex = 0;
  const limitIndex = terms.length;

  try {
    const cookies = await loginToKBBI(credentials);

    if (cookies) {
      for (let i = startIndex; i <= limitIndex; i++) {
        const result = await searchKBBI(terms[i], cookies);
        if (
          result.data.length > 0 &&
          result.data.every((item) => item !== null)
        ) {
          await saveResults(terms[i], result);
        } else {
          console.log("Skip: ", terms[i]);
        }
        updateProgressBar(i + 1, limitIndex, terms.length);
        if (i === limitIndex) {
          const emailActive = process.env.POSEL;

          console.log(`\nDONE ${emailActive} ✨`);
        }
      }
    } else {
      console.log("fail to login");
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
