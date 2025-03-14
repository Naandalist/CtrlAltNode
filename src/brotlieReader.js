const fs = require("fs").promises;
const zlib = require("node:zlib");
const util = require("util");

const brotliDecompress = util.promisify(zlib.brotliDecompress);

async function readAndLogBrotliCompressed(filePath) {
  try {
    // Read the compressed file
    const compressedData = await fs.readFile(filePath);

    // Decompress the data
    const decompressedBuffer = await brotliDecompress(compressedData);

    // Convert buffer to string
    const decompressedString = decompressedBuffer.toString("utf-8");

    // Parse the JSON if it's JSON data
    const data = JSON.parse(decompressedString);

    // Log the data
    // console.log("Decompressed data:", data);

    // Return the data in case you want to use it further
    return data;
  } catch (error) {
    console.error("Error reading or decompressing file:", error);
  }
}

// Usage
readAndLogBrotliCompressed("a.br")
  .then((data) => {
    // You can do more with the data here if needed
    console.log("Data processing complete: ", typeof data);
    console.log("data 0: ", Object.keys(data));
    console.log("length: ", data.a[10]);
    // console.log("length: ", data.a.length);
  })
  .catch(console.error);
