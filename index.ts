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
let typingTimeout: number;

const UNSUPPORTED_KEYS = ["ShiftRight", "AltRight", "MetaRight", "ControlRight", "ShiftLeft", "AltLeft", "MetaLeft", "ControlLeft", "CapsLock", "Tab", "Delete", "Insert"];

function getRowColumn(hash: string) {
  return rows.get(hash)
}

function charWidth(row: Row) {
  return (row.textElement.offsetWidth / row.content.length) || 0;
}

function handleKey(e: Event, row: HTMLPreElement) {
  const rowHash = row.getAttribute("hash");
  if (!(e instanceof KeyboardEvent) || UNSUPPORTED_KEYS.includes(e.code) || !activeInput || !activeRow || !rowHash) return;
  const leftValue = Number(activeInput?.style.left.split("px")[0] || 0);
  getRow(rowHash).element.classList.add("typing");

  clearTimeout(typingTimeout);
  switch(e.code) {
  case "Backspace":
    if(!Boolean(getRow(rowHash).textElement.textContent)) {
      const prevElement = getRow(rowHash).element.previousElementSibling;
      const nextElement = getRow(rowHash).element.nextElementSibling;
      if (prevElement instanceof HTMLPreElement) {
	prevElement.click();
      } else if (nextElement instanceof HTMLPreElement) {
	nextElement.click();
      }
      deleteRow(getRow(rowHash).element.getAttribute("hash") || "");
      break;
    };

    if(getRow(rowHash).textElement.textContent && getRow(rowHash).activeColumnIndex === 0) {
      const prevRow = getRow(rowHash).element.previousElementSibling as HTMLPreElement & { hash: string };
      if (!prevRow) return;
      updateRow(prevRow.hash, {
	content: [...getRow(prevRow.hash).content, getRow(rowHash).textElement.textContent || ""],
	activeColumnIndex: prevRow.textContent?.length
      });
      prevRow.click();
      deleteRow(getRow(rowHash).element.getAttribute("hash") || "");
      break;
    }

    const beforeCursor = getRow(rowHash).content.slice(0, getRow(rowHash).activeColumnIndex - 1);
    const afterCursor = getRow(rowHash).content.slice(getRow(rowHash).activeColumnIndex);

    const updatedRow2 = updateRow(rowHash, {
      activeColumnIndex: getRow(rowHash).activeColumnIndex - 1,
      content: [...beforeCursor, ...afterCursor]
    })
    activeInput.style.left = `${updatedRow2.activeColumnIndex * charWidth(updatedRow2)}px`;
    break;
  case "Enter":
    const remainderContent = getRow(rowHash).textElement.textContent?.slice(getRow(rowHash).activeColumnIndex) || "";
    updateRow(rowHash, { content: getRow(rowHash).content.splice(0, getRow(rowHash).activeColumnIndex) });
    
    const newRow = createRow(remainderContent);
    container?.insertBefore(newRow, row.nextSibling);

    updateRow(newRow.hash, { activeColumnIndex: 0 });
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
    if (getRow(rowHash).activeColumnIndex === 0) return;
    updateRow(rowHash, { activeColumnIndex: getRow(rowHash).activeColumnIndex - 1 })
    activeInput.style.left = `${Number(leftValue - charWidth(getRow(rowHash)))}px`;
    break;
  case "ArrowRight":
    if (getRow(rowHash).activeColumnIndex >= getRow(rowHash).content.length) return;
    updateRow(rowHash, { activeColumnIndex: getRow(rowHash).activeColumnIndex + 1 })
    activeInput.style.left = `${Number(leftValue + charWidth(getRow(rowHash)))}px`;
    break;
  default:
    const firstPart = getRow(rowHash).content.slice(0, getRow(rowHash).activeColumnIndex) || "";
    const endPart = getRow(rowHash).content.slice(getRow(rowHash).activeColumnIndex) || "";

    const updatedRow = updateRow(rowHash, {
      activeColumnIndex: getRow(rowHash).activeColumnIndex + 1,
      content: [...firstPart, e.key, ...endPart]
    })

    activeInput.style.left = `${charWidth(updatedRow) * (updatedRow.activeColumnIndex)}px`;
    break;
  }

  console.log(getRow(rowHash).content[getRow(rowHash).activeColumnIndex - 1]);

  typingTimeout = setTimeout(() => {
    getRow(rowHash).element.classList.remove("typing")
  }, 200);
}

function createInput(row: HTMLPreElement) {
  const input = document.createElement("input");
  const textElement = row.getElementsByTagName("p")[0] || document.createElement("p");
  input.value = textElement.textContent || "";

  input.style.height = "30px";
  input.style.width = "2px";
  input.style.backgroundColor = "black";
  activeInput = input;

  input.addEventListener("keydown", (e) => handleKey(e, row));
  
  return input
}

function deleteRow(hash: string) {
  if (!container) throw new Error("Container root not defined");
  const row = getRow(hash);
  if (rows.size === 1 && row.activeColumnIndex === 0) return;

  container.removeChild(row.element);
  rows.delete(hash);
}

function createRow(content?: string) {
  if (!container) throw new Error("Container root not defined");
  const hash = String(Math.trunc(Math.random() * 10000));
  const row = Object.assign(document.createElement("pre"), { hash });
  const textElement = document.createElement("p");

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

    const leftValue = getRow(hash).activeColumnIndex * charWidth(getRow(hash));
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
