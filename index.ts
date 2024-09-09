import { getContent } from "./app.js";
import { parse } from "./closign-bracket.js"

const container = document.getElementById("container");
const wrapper = document.getElementById("wrapper");
if (!container || !wrapper) throw new Error("Container root not found");

const WIDTH = 1400;
const HEIGHT = 800;
let CHAR_WIDTH = 0;

export interface Row {
  hash: string
  content: string[]
  element: HTMLPreElement & { hash: string }
  textElement: HTMLParagraphElement
}

let activeRow: Row | null = null;
let activeInput: HTMLInputElement | null = null;
let activeColumnIndex = 0;
let activeRowIndex = 0;
let typingTimeout: number;

const rows: Map<string, Row> = new Map();

const UNSUPPORTED_KEYS = ["ShiftRight", "AltRight", "MetaRight", "ControlRight", "ShiftLeft", "AltLeft", "MetaLeft", "ControlLeft", "CapsLock", "Tab", "Delete", "Insert"];

function loadCharWidth() {
  const char = document.createElement("span");
  char.style.font = "1.5rem Roboto Mono, monospace";
  char.textContent = "0";
  document.body.appendChild(char);
  const width = char.getBoundingClientRect().width;
  
  document.body.removeChild(char);
  
  CHAR_WIDTH = width;
}

function setCursor(column: number) {
  if (!activeInput || !activeRow) throw new Error("Error");
  
  activeInput.style.left = `${column * CHAR_WIDTH}px`;
  activeColumnIndex = column;
}

function handleKey(e: Event, hash: string) {
  if (!(e instanceof KeyboardEvent) || UNSUPPORTED_KEYS.includes(e.code) || !activeInput || !activeRow) return;
  getRow(hash).element.classList.add("typing");

  const array: string[][] = [];

  Array.from(rows).forEach((r, i) => {
    array[i] = r[1].content
  })

  console.log(parse(array));

  clearTimeout(typingTimeout);
  switch(e.code) {
  case "Backspace":
    if(!Boolean(getRow(hash).textElement.textContent)) {
      const prevElement = getRow(hash).element.previousElementSibling;
      const nextElement = getRow(hash).element.nextElementSibling;
      if (prevElement instanceof HTMLPreElement) {
	prevElement.click();
      } else if (nextElement instanceof HTMLPreElement) {
	nextElement.click();
      }
      deleteRow(getRow(hash).element.getAttribute("hash") || "");
      loadNumbering();
      break;
    }

    if(activeColumnIndex === 0 && Boolean(getRow(hash).textElement.textContent)) {
      const prevRow = getRow(hash).element.previousElementSibling as HTMLPreElement & { hash: string };
      if (!prevRow) return;
      focusRow(getRow(prevRow.hash), { column: getRow(prevRow.hash).content.length });
      activeRow = updateRow(prevRow.hash, {
	content: [...getRow(prevRow.hash).content, ...getRow(hash).textElement.textContent?.split("") || ""],
      });
      deleteRow(hash);
      loadNumbering();
      break;
    }

    const beforeCursor = getRow(hash).content.slice(0, activeColumnIndex - 1);
    const afterCursor = getRow(hash).content.slice(activeColumnIndex);

    updateRow(hash, { content: [...beforeCursor, ...afterCursor] });

    activeColumnIndex -= 1;
    activeInput.style.left = `${activeColumnIndex * CHAR_WIDTH}px`;
    break;
  case "Enter":
    activeRow?.element.classList.remove("typing")
    const remainderContent = getRow(hash).textElement.textContent?.slice(activeColumnIndex) || "";
    updateRow(hash, { content: getRow(hash).content.splice(0, activeColumnIndex)  })
    
    const newRow = createRow(remainderContent);
    container?.insertBefore(newRow, getRow(hash).element.nextSibling);
    activeRowIndex += 1;

    activeColumnIndex = 0;
    focusRow(getRow(newRow.hash), { column: 0 });
    loadNumbering();
    break;
  case "ArrowUp":
    activeRow?.element.classList.remove("typing")
    const prevRow = getRow(hash).element.previousElementSibling;
    if (prevRow instanceof HTMLPreElement) {
      activeRowIndex -= 1;
      prevRow.click();
    }
    break;
  case "ArrowDown":
    activeRow?.element.classList.remove("typing")
    const nextRow = getRow(hash).element.nextElementSibling;
    if (nextRow instanceof HTMLPreElement) {
      activeRowIndex += 1;
      nextRow.click();
    }
    break;
  case "ArrowLeft":
    if (activeColumnIndex === 0) return;
    activeColumnIndex -= 1;
    activeInput.style.left = `${activeColumnIndex * CHAR_WIDTH}px`;
    break;
  case "ArrowRight":
    if (activeColumnIndex >= activeRow.content.length) return;
    activeColumnIndex += 1;
    activeInput.style.left = `${activeColumnIndex * CHAR_WIDTH}px`;
    break;
  default:
    const firstPart = getRow(hash).content.slice(0, activeColumnIndex) || "";
    const endPart = getRow(hash).content.slice(activeColumnIndex) || "";

    activeRow = updateRow(hash, { content: [...firstPart, e.key, ...endPart] })
    activeColumnIndex += 1;

    activeInput.style.left = `${activeColumnIndex * CHAR_WIDTH}px`;
    break;
  }

  typingTimeout = setTimeout(() => {
    activeRow?.element.classList.remove("typing")
  }, 200);

  setLoc();
}

function setLoc() {
  const loc = document.getElementById("loc");
  if (!loc) throw new Error("Location container not found");

  loc.textContent = `${activeRowIndex}:${activeColumnIndex}`
}

function createInput(row: Row) {
  const input = document.createElement("input");
  input.value = row.content.join("");

  input.style.height = "30px";
  input.style.width = "16px";
  input.style.backgroundColor = "#bbb";
  input.autocomplete = "off";
  input.spellcheck = false;

  activeInput = input;

  input.addEventListener("keydown", (e) => handleKey(e, row.hash));
  
  return input
}

function deleteRow(hash: string) {
  if (!container) throw new Error("Container root not defined");
  const row = getRow(hash);
  if (rows.size === 1 && activeColumnIndex === 0) return;

  container.removeChild(row.element);
  rows.delete(hash);
}

function generateHash() {
  const hash = String(Math.trunc(Math.random() * 100_000));

  if (document.querySelector(`[hash="${hash}"]`))
    return generateHash();

  return hash;
}

function createRow(content?: string) {
  if (!container) throw new Error("Container root not defined");
  const hash = generateHash();
  const row = Object.assign(document.createElement("pre"), { hash });
  const textElement = document.createElement("p");

  rows.set(hash, {
    hash,
    content: content?.split("") || [],
    element: row,
    textElement: textElement,
  });
  
  row.id = "row";
  row.setAttribute("hash", hash);
  row.appendChild(textElement);
  textElement.textContent = content || "";

  row.addEventListener("click", (e) => {
    if (!(e.currentTarget instanceof HTMLPreElement)) return;
    
    if (!activeRow) {
      activeRow = getRow(row.hash);
      createInput(activeRow);
    }
    
    if (e.currentTarget.getAttribute("hash") !== activeRow.hash) {
      deleteInput(activeInput, activeRow);
      activeRow.element.classList.remove("active");
      activeRow = getRow(row.hash);
      createInput(activeRow);
    }

    if (!activeInput) return;
    row.classList.add("active")

    setCursor(activeRow.content.length);

    row.appendChild(activeInput);
    activeInput.focus();
  })
  loadNumbering();

  return row;
}

function loadNumbering() {
  const numbering = document.createElement("div");
  numbering.id = "numbering";
  for (let i = 0; i < rows.size; i++) {
    const n = document.createElement("span");
    n.textContent = String(i);
    numbering.appendChild(n);
  }
  
  wrapper?.appendChild(numbering);
}

function deleteInput(input: HTMLInputElement | null, row: Row) {
  if (!input) return;
  row.element.removeChild(input);
  activeInput = null;
}

function updateRow(hash: string, row: Partial<Row>): Row {
  rows.set(hash, {...getRow(hash), ...row});

  if (row && row.content) {
    getRow(hash).textElement.textContent = row.content.join("");
  }

  return getRow(hash);
}

function getRow(hash: string): Row{
  const row = rows.get(hash);
  if (!row) throw new Error("Row not found");
  return row;
}

function focusRow(row: Row, { column }: { column?: number } = {}) {
  if (!activeRow) {
    activeRow = getRow(row.hash);
    createInput(activeRow);
  }
  
  deleteInput(activeInput, activeRow);
  activeRow.element.classList.remove("active");
  activeRow = getRow(row.hash);
  createInput(activeRow);

  if (!activeInput) return;
  row.element.classList.add("active")

  row.element.appendChild(activeInput);
  activeInput.focus();

  if (column) {
    activeColumnIndex = column;
    activeInput.style.left = `${column * CHAR_WIDTH}px`
  }
}

(() => {
  loadCharWidth();
  wrapper.style.height = HEIGHT.toString();
  wrapper.style.width = WIDTH.toString();

  const loc = document.createElement("div");
  loc.id = "loc";

  const printBtn = document.createElement("button");
  printBtn.onclick = () => console.log(getContent(rows));
  printBtn.textContent = "print to console";
  document.body.appendChild(printBtn);

  const runBtn = document.createElement("button");
  runBtn.onclick = () => eval(getContent(rows));
  runBtn.textContent = "run JS code";
  document.body.appendChild(runBtn);

  const row = createRow();
  
  container.appendChild(row);
  wrapper.appendChild(loc);
  setLoc();
})()
