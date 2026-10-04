const WIKIMEDIA_FILE_PATH = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const STRICT_ENCODE_PATTERN = /['()!*]/g;

export function wikimediaImageUrl(fileName: string, width = 800): string {
  const encoded = encodeURIComponent(fileName).replace(
    STRICT_ENCODE_PATTERN,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `${WIKIMEDIA_FILE_PATH}${encoded}?width=${width}`;
}
