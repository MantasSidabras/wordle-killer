Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};

const getSet = (id) => document.getElementById(id).value;
const getCheck = (id) => document.getElementById(id).checked;
const getPatterns = (id) =>
  Array.from(document.getElementById(id).childNodes)
    .map((patternNode) => patternNode.value)
    .filter(Boolean);

const generateWord = () =>
  fetch("./words5.txt")
    .then((res) => res.text())
    .then((data) => data.split("\n"))
    .then((dict) => {
      const excludeSet = getSet("exclude-pattern");
      const includeSet = getSet("include-pattern");

      const removeDuplicates = getCheck("duplicate-letters");
      const patternsExpressions = getPatterns("patterns");

      console.log({
        excludeSet,
        includeSet,
        removeDuplicates,
        patternsExpressions,
      });
      const patterns = patternsExpressions.map((x) => new RegExp(x));
      const filterSet = (set) => (include) => (x) =>
        include ===
        set
          .split("")
          [include ? "every" : "some"]((letter) => x.includes(letter));

      const removeDupicateLetterWords = (active) => (x) => {
        if (!active) {
          return true;
        }
        const letters = x.split("");
        return letters.length === Array.from(new Set(letters)).length;
      };

      const result = dict
        .filter(removeDupicateLetterWords(removeDuplicates))
        .filter(filterSet(excludeSet)(false))
        .filter(filterSet(includeSet)(true))
        .filter((x) => patterns.every((pattern) => pattern.test(x)));

      setSuggestion(result.random());
      setResult(result);
    });

const clearAll = (id) => {
  const parent = document.getElementById(id);
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};

setResult = (result) => {
  clearAll("word-bank");
  const wordBankElement = document.getElementById("word-bank");
  const paragraph = document.createElement("p");
  paragraph.innerText = result.join(" ");
  wordBankElement.appendChild(paragraph);
};

const setSuggestion = (result) => {
  document.getElementById("suggestion").innerText = result;
};

const filterBtn = document.getElementById("filter-btn");
filterBtn.onclick = () => {
  clearAll("suggestion");
  generateWord();
};

const helpBtn = document.getElementById("help-btn");
helpBtn.onclick = (e) => {
  const helper = document.getElementById("helper");
  if (helper.style.display === "none") {
    helper.style.display = "block";
  } else {
    helper.style.display = "none";
  }
};
