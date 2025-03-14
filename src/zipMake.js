const fs = require("fs").promises;
const zlib = require("node:zlib");
const util = require("util");

const brotliCompress = util.promisify(zlib.brotliCompress);
const brotliDecompress = util.promisify(zlib.brotliDecompress);

async function compressFile(inputFile, outputFile) {
  try {
    const data = await fs.readFile(inputFile);
    const compressed = await brotliCompress(data, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      },
    });
    await fs.writeFile(outputFile, compressed);
    console.log(`Compressed ${inputFile} to ${outputFile}`);
  } catch (error) {
    console.error("Compression error:", error);
  }
}

async function decompressFile(inputFile, outputFile) {
  try {
    const compressed = await fs.readFile(inputFile);
    const decompressed = await brotliDecompress(compressed);
    await fs.writeFile(outputFile, decompressed);
    console.log(`Decompressed ${inputFile} to ${outputFile}`);
  } catch (error) {
    console.error("Decompression error:", error);
  }
}

// Usage
// compressFile("output.txt", "output.br")
//   .then(() => decompressFile("output.br", "decompressed_output.txt"))
//   .catch(console.error);

compressFile("./output/a.txt", "a.br")
  .then(() => decompressFile("output.br", "decompressed_output.txt"))
  .catch(console.error);
