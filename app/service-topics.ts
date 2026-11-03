export type TopicMode = "numbered" | "bulleted";
export type TopicList = { prefix: string; items: string[]; separators: string[]; numbered: boolean; mode: TopicMode };

/** Keep the original delimiters so opening or editing another field cannot rewrite content. */
export function readTopics(value: string, mode: TopicMode): TopicList {
  const markers = mode === "numbered" ? [...value.matchAll(/(^|\s+)(\d+[.)][ \t]+)/g)] : [];
  if (markers.length && markers[0].index === 0) {
    return {
      prefix: markers[0][0], numbered: true, mode,
      items: markers.map((marker, i) => value.slice(marker.index! + marker[0].length, markers[i + 1]?.index ?? value.length)),
      separators: markers.slice(1).map((marker) => marker[0]),
    };
  }
  const delimiters = [...value.matchAll(mode === "bulleted" ? /;[ \t]*(?:\r?\n[ \t]*)?|\r?\n+/g : /\r?\n+/g)];
  const items: string[] = [];
  let start = 0;
  for (const delimiter of delimiters) {
    items.push(value.slice(start, delimiter.index));
    start = delimiter.index! + delimiter[0].length;
  }
  items.push(value.slice(start));
  return { prefix: "", items, separators: delimiters.map((delimiter) => delimiter[0]), numbered: false, mode };
}

export function writeTopics(list: TopicList): string {
  return list.prefix + list.items.map((text, index) => text + (list.separators[index] ?? "")).join("");
}

/** Public document items use the same boundaries as the editor; source strings stay intact. */
export function documentTopicParts(value: string) {
  const list = readTopics(value, "bulleted");
  let cursor = 0;
  const parts = list.items.map((text, index) => {
    const start = cursor;
    cursor += text.length;
    const end = cursor;
    cursor += list.separators[index]?.length ?? 0;
    return { text, start, end };
  }).filter((part) => part.text.trim());
  return parts.length ? parts : [{ text: value, start: 0, end: value.length }];
}

export function changeTopic(list: TopicList, index: number, value: string): TopicList {
  return { ...list, items: list.items.map((text, i) => i === index ? value : text) };
}

/** Explicit structural edits keep item text and update the original numbering in place. */
export function arrangeTopics(list: TopicList, action: "add" | "remove" | "up" | "down", index = 0): TopicList {
  const items = [...list.items];
  const separators = [...list.separators];
  if (action === "add") {
    items.push(""); separators.push("\n");
  } else if (action === "remove") {
    if (items.length === 1) return { ...list, prefix: "", items: [""], separators: [], numbered: false };
    items.splice(index, 1); separators.splice(Math.max(0, index - 1), 1);
  } else {
    const target = index + (action === "up" ? -1 : 1);
    if (target < 0 || target >= items.length) return list;
    [items[index], items[target]] = [items[target], items[index]];
  }
  const numbered = list.numbered || (list.mode === "numbered" && action !== "remove");
  const prefix = numbered && !list.numbered ? "1. " : list.prefix;
  if (numbered) {
    const first = Number(prefix.match(/\d+/)![0]);
    for (let i = 0; i < separators.length; i++) {
      separators[i] = /\d+[.)]/.test(separators[i])
        ? separators[i].replace(/\d+/, String(first + i + 1))
        : `\n${first + i + 1}. `;
    }
  }
  return { ...list, items, separators, prefix, numbered };
}
