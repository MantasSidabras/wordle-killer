Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};

const getSet = (id) => document.getElementById(id).value;
const getCheck = (id) => document.getElementById(id).checked;
const getPatterns = (id) =>
  Array.from(document.getElementById(id).childNodes)
    .map((patternNode) => patternNode.value)
    .filter(Boolean);

const getGuesses = (classname) =>
  Array.from(document.getElementsByClassName(classname))
    .map(({ value }) => value)
    .filter(Boolean);

const parsePattern = (wordPattern) => {
  try {
    return wordPattern.match(/.{1,2}/g).map((item) => item.split(""));
  } catch {
    return [];
  }
};

const mapToRegex = ([letter, symbol]) => {
  return {
    ["-"]: ".",
    ["+"]: letter,
    ["?"]: `[^${letter}]`,
  }[symbol];
};

const mapIncludesExcludes = ([letter, symbol]) => {
  const value = {
    ["-"]: false,
    ["+"]: true,
    ["?"]: true,
  }[symbol];
  return [letter, value];
};

const getWords = Array.from(
  Array.from(document.getElementsByClassName("render-word")).map(
    (node) => node.childNodes
  )
);

const renderWords = () => {};

Array.from(document.getElementsByClassName("guess-item")).forEach((element) => {
  const guess = element.getElementsByClassName("guess");
  guess[0].oninput = (e) => {
    const patterns = parsePattern(e.target.value).filter(
      (item) => item.length === 2
    );
    const buttons = Array.from(element.getElementsByClassName("letter"));
    buttons.forEach((button, index) => {
      try {
        button.value = patterns[index][0];
        const symbol = patterns[index][1];
        const value = {
          ["-"]: "grey",
          ["+"]: "lightgreen",
          ["?"]: "orange",
        }[symbol];
        button.style = `background-color: ${value};`;
      } catch {
        button.value = " ";
        button.style = `background-color: light-grey`;
      }
    });
  };
});

const generateWord = () =>
  fetch("./words5.txt")
    .then((res) => res.text())
    .then((data) => data.split("\n"))
    .then((dict) => {
      const excludeSet = getSet("exclude-pattern").toLowerCase().split("");
      const includeSet = getSet("include-pattern").toLowerCase().split("");

      const removeDuplicates = getCheck("duplicate-letters");
      const wordPatterns = getGuesses("guess").map(parsePattern);

      const wordOccurences = wordPatterns.flatMap((word) =>
        word.map(mapIncludesExcludes)
      );
      const excludes = wordOccurences
        .filter(([, value]) => !value)
        .map(([letter]) => letter);
      const includes = wordOccurences
        .filter(([, value]) => value)
        .map(([letter]) => letter);

      const regexes = wordPatterns
        .map((word) => word.map(mapToRegex).join(""))
        .map((x) => new RegExp(x));

      const filterSet = (set) => (include) => (x) =>
        include ===
        set[include ? "every" : "some"]((letter) => x.includes(letter));

      const removeDupicateLetterWords = (active) => (x) => {
        if (!active) {
          return true;
        }
        const letters = x.split("");
        return letters.length === Array.from(new Set(letters)).length;
      };

      console.log({ excludeSet, includeSet, excludes, includes, regexes });
      const result = dict
        .filter(removeDupicateLetterWords(removeDuplicates))
        .filter(filterSet([...excludeSet, ...excludes])(false))
        .filter(filterSet([...includeSet, ...includes])(true))
        .filter((x) => regexes.every((pattern) => pattern.test(x)));

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

// const helpBtn = document.getElementById("help-btn");
// helpBtn.onclick = (e) => {
//   const helper = document.getElementById("helper");
//   if (helper.style.display === "none") {
//     helper.style.display = "block";
//   } else {
//     helper.style.display = "none";
//   }
// };
