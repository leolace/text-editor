export function getContent(rows) {
    let str = "";
    rows.forEach(r => {
        str += `${r.content.join("")}\n`;
    });
    return str;
}
