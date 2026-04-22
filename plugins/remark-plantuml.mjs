import { visit } from "unist-util-visit";
import { deflateRawSync } from "node:zlib";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const SERVER = "https://www.plantuml.com/plantuml/svg";

function encode(data) {
  let r = "";
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data[i];
    const b2 = data[i + 1] ?? 0;
    const b3 = data[i + 2] ?? 0;
    r += ALPHABET[(b1 >> 2) & 0x3f];
    r += ALPHABET[((b1 & 0x3) << 4) | ((b2 >> 4) & 0xf)];
    r += ALPHABET[((b2 & 0xf) << 2) | ((b3 >> 6) & 0x3)];
    r += ALPHABET[b3 & 0x3f];
  }
  return r;
}

function toUrl(source) {
  const src = source.trimStart().startsWith("@startuml")
    ? source
    : `@startuml\n${source}\n@enduml`;
  const compressed = deflateRawSync(Buffer.from(src, "utf-8"), { level: 9 });
  return `${SERVER}/${encode(compressed)}`;
}

export default function remarkPlantUML() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "plantuml") return;
      const url = toUrl(node.value);
      parent.children[index] = {
        type: "html",
        value: `<img src="${url}" alt="PlantUML diagram" />`,
      };
    });
  };
}
