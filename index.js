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
    return wordPattern
      .toLowerCase()
      .match(/.{1,2}/g)
      .map((item) => item.split(""));
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
        button.value = patterns[index][0].toUpperCase();
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
  fetch("./wordleDict.txt")
    .then((res) => res.text())
    .then((data) => data.split("\n"))
    .then((data) => data.sort())
    .then((dict) => {
      const excludeSet = getSet("exclude-pattern").toLowerCase().split("");
      const includeSet = getSet("include-pattern").toLowerCase().split("");

      const removeDuplicates = getCheck("duplicate-letters");
      const wordPatterns = getGuesses("guess")
        .map((x) => x.toLowerCase())
        .map(parsePattern);

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
      const result = addWeights(
        dict
          .filter(removeDupicateLetterWords(removeDuplicates))
          .filter(filterSet([...excludeSet, ...excludes])(false))
          .filter(filterSet([...includeSet, ...includes])(true))
          .filter((x) => regexes.every((pattern) => pattern.test(x)))
      ).map(({ word }) => word);

      setSuggestion(result[0]);
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

const onClick = () => {
  clearAll("suggestion");
  generateWord();
};

const filterBtn = document.getElementById("filter-btn");
filterBtn.onclick = onClick;

const ENTER_CODE = "Enter";

document.addEventListener("keydown", (e) => {
  if (e.key == ENTER_CODE) {
    onClick();
  }
});

const COUNT_WEIGHT = 0.5;
const POS_WEIGHT = 1;
const NO_DUPLICATE_CHAR = true;

const addWeights = (words) => {
  const charStats = [];
  words.forEach((word) => {
    for (let i = 0; i < word.length; i++) {
      const char = word.charAt(i);
      let stat = charStats.find((stat) => stat.char === char);
      if (!stat) {
        stat = {
          char,
          count: 0,
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
        };
        charStats.push(stat);
      }
      stat.count++;
      stat[i]++;
    }
  });

  const charStatsMap = charStats.reduce((map, val) => {
    map[val.char] = val;
    return map;
  }, {});

  const wordsWithWeights = words
    .map((word) => {
      let weight = 0;
      const usedChars = [];
      for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i);
        if (!NO_DUPLICATE_CHAR || !usedChars.includes(char)) {
          usedChars.push(char);
          const stat = charStatsMap[char];
          weight += (stat?.[i] ?? 0) * POS_WEIGHT;
          weight += (stat?.count ?? 0) * COUNT_WEIGHT;
        }
      }
      return { word, weight };
    })
    .sort((a, b) => b.weight - a.weight);

  return wordsWithWeights;
};
