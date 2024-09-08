import { Row } from "index";

export function getContent(rows: Map<string, Row>) {
  let str = "";
  rows.forEach(r => {
    str += `${r.content.join("")}\n`;
  })

  return str;
}
