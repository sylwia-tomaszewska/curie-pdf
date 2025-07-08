export const highlightWords = (search: string) => {
  if (search.trim()) {
    const wordsToHighlight = search
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w);

    return wordsToHighlight;
  } else {
    return [];
  }
};
