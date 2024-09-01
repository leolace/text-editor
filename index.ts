const container = document.getElementById("container");
if (!container) throw new Error("Container root not found");

const WIDTH = 1300;
const HEIGHT = 800;
const ROWS_COUNT = HEIGHT / 50;
const COLS_COUNT = WIDTH / 25;

let activeRow: HTMLPreElement | null = null;
let activeInput: HTMLInputElement | null = null;

interface Row {
  content: string[]
  element: HTMLPreElement
  textElement: HTMLParagraphElement
  activeColumnIndex: number
}

const rows: Map<string, Row> = new Map();

const UNSUPPORTED_KEYS = ["ShiftRight", "AltRight", "MetaRight", "ControlRight", "ShiftLeft", "AltLeft", "MetaLeft", "ControlLeft", "CapsLock", "Tab", "Delete", "Insert"];

function getRowColumn(hash: string) {
  return rows.get(hash)
}

function charWidth(row: Row) {
  return row.textElement.offsetWidth / row.content.length;
}

function createInput(row: HTMLPreElement) {
  const input = document.createElement("input");
  const textElement = row.getElementsByTagName("p")[0] || document.createElement("p");
  input.value = textElement.textContent || "";

  input.style.height = "40px";
  input.style.width = "4px";
  input.style.backgroundColor = "black";
  activeInput = input;

  input.addEventListener("keydown", (e: Event) => {
    const rowHash = row.getAttribute("hash");
    if (!(e instanceof KeyboardEvent) || UNSUPPORTED_KEYS.includes(e.code) || !activeInput || !activeRow || !rowHash) return;
    const thisRow = getRow(rowHash);
    const leftValue = Number(activeInput?.style.left.split("px")[0] || 0);

    switch(e.code) {
    case "Backspace":
      if(!Boolean(textElement.textContent)) {
	const prevElement = thisRow.element.previousElementSibling;
	const nextElement = thisRow.element.nextElementSibling;
	if (prevElement instanceof HTMLPreElement) {
	  prevElement.click();
	} else if (nextElement instanceof HTMLPreElement) {
	  nextElement.click();
	}
	deleteRow(thisRow.element.getAttribute("hash") || "");
	break;
      };

      updateRow(rowHash, { activeColumnIndex: thisRow.activeColumnIndex - 1, content: thisRow.content.slice(0, thisRow.content.length - 1) })
      input.style.left = `${thisRow.textElement.offsetWidth + 2}px`;
      break;
    case "Enter":
      const remainderContent = textElement.textContent?.slice(thisRow.activeColumnIndex) || "";
      updateRow(rowHash, { content: thisRow.content.splice(0, thisRow.activeColumnIndex) });
      
      const newRow = createRow(remainderContent);
      container?.insertBefore(newRow, row.nextSibling);

      newRow.click();
      break;
    case "ArrowUp":
      const prevRow = row.previousElementSibling;
      if (prevRow instanceof HTMLPreElement) {
	prevRow.click();
	activeInput.style.left = `${(getRow(prevRow.getAttribute("hash") || "").textElement.offsetWidth) + 2}px`;
      }
      break;
    case "ArrowDown":
      const nextRow = row.nextElementSibling;
      if (nextRow instanceof HTMLPreElement) {
	nextRow.click();
	activeInput.style.left = `${getRow(nextRow.getAttribute("hash") || "").textElement.offsetWidth + 2}px`;
      }
      break;
    case "ArrowLeft":
      if (thisRow.activeColumnIndex === 0) return;
      updateRow(rowHash, { activeColumnIndex: thisRow.activeColumnIndex - 1 })
      activeInput.style.left = `${Number(leftValue - charWidth(thisRow))}px`;
      break;
    case "ArrowRight":
      if (thisRow.activeColumnIndex >= thisRow.content.length) return;
      updateRow(rowHash, { activeColumnIndex: thisRow.activeColumnIndex + 1 })
      activeInput.style.left = `${Number(leftValue + charWidth(thisRow))}px`;
      break;
    default:
      const firstPart = thisRow.content.slice(0, thisRow.activeColumnIndex) || "";
      const endPart = thisRow.content.slice(thisRow.activeColumnIndex) || "";

      const updatedRow = updateRow(rowHash, {
	activeColumnIndex: thisRow.activeColumnIndex + 1,
	content: [...firstPart, e.key, ...endPart]
      })

      input.style.left = `${charWidth(updatedRow) * (updatedRow.activeColumnIndex)}px`;
      break;
    }
  })
  
  return input
}

function deleteRow(hash: string) {
  if (!container) throw new Error("Container root not defined");
  if (rows.size === 1) return;
  const row = getRow(hash).element;

  container.removeChild(row);
  rows.delete(hash);
}

function createRow(content?: string) {
  if (!container) throw new Error("Container root not defined");
  const row = document.createElement("pre");
  const textElement = document.createElement("p");
  const hash = String(Math.trunc(Math.random() * 10000));

  rows.set(hash, {
    content: content?.split("") || [],
    element: row,
    textElement: textElement,
    activeColumnIndex: content?.length || 0
  });
  
  row.id = "row";
  row.setAttribute("hash", hash);
  row.appendChild(textElement);
  textElement.textContent = content || "";

  row.addEventListener("click", (e: FocusEvent) => {
    if (!(e.currentTarget instanceof HTMLPreElement)) return;
    
    if (!activeRow) {
      activeRow = row;
      createInput(activeRow);
    }
    
    if (e.currentTarget.getAttribute("hash") !== activeRow.getAttribute("hash")) {
      deleteInput(activeInput, activeRow);
      activeRow.classList.remove("active");
      activeRow = row;
      createInput(activeRow);
    }

    if (!activeInput) return;
    row.classList.add("active")

    const leftValue = getRow(hash).content.length ? getRow(hash).textElement.offsetWidth : 0;

    activeInput.style.left = `${leftValue}px`

    row.appendChild(activeInput);
    activeInput.focus();
  })

  return row;
}

function deleteInput(input: HTMLInputElement | null, row: HTMLSpanElement) {
  if (!input) return;
  row.removeChild(input);
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

(() => {
  container.style.height = HEIGHT.toString();
  container.style.width = WIDTH.toString();

  const row = createRow();
  container.appendChild(row);
})()
