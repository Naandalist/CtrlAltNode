function fuzzySearch(query, wordList) {
  const results = [];

  for (const word of wordList) {
    const similarity = calculateSimilarity(query, word);
    results.push({ word, similarity });
  }

  results.sort((a, b) => b.similarity - a.similarity); // Urutkan berdasarkan kemiripan tertinggi
  return results.map((result) => result.word); // Kembalikan hanya kata-kata yang cocok
}

function calculateSimilarity(query, word) {
  const queryLength = query.length;
  const wordLength = word.length;

  if (queryLength === 0) {
    return wordLength === 0 ? 1 : 0;
  }

  if (wordLength === 0) {
    return 0;
  }

  const matrix = Array(queryLength + 1)
    .fill(null)
    .map(() => Array(wordLength + 1).fill(0));

  for (let i = 0; i <= queryLength; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= wordLength; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= queryLength; i++) {
    for (let j = 1; j <= wordLength; j++) {
      const cost = query[i - 1] === word[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Penghapusan
        matrix[i][j - 1] + 1, // Penyisipan
        matrix[i - 1][j - 1] + cost // Penggantian
      );
    }
  }

  const maxDistance = Math.max(queryLength, wordLength);
  const distance = matrix[queryLength][wordLength];
  return 1 - distance / maxDistance; // Kemiripan sebagai persentase
}

const wordList = [
  "jaat",
  "jab",
  "jaba",
  "jabal",
  "jaban",
  "jabang bayi",
  "jabang",
  "jabar",
  "jabaran",
  "jabariah",
  "jabat tangan",
  "jabat",
  "jabata",
  "jabatan fungsional",
  "jabatan negeri",
  "jabatan organik",
  "jabatan rangkap",
  "jabatan struktural",
  "jabatan",
];

const query = "rkap";
const results = fuzzySearch(query, wordList);
console.log(results);
