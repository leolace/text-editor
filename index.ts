const container = document.getElementById("container");
const numbers = document.getElementById("numbers");
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

let rows: Row[] = [];

const UNSUPPORTED_KEYS = ["ShiftRight", "AltRight", "MetaRight", "ControlRight", "ShiftLeft", "AltLeft", "MetaLeft", "ControlLeft", "CapsLock", "Tab", "Delete", "Insert"];

function getRowColumn(rowIndex: number) {
  return (rows[rowIndex]?.content.length - 1) ?? 0;
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
    if (!(e instanceof KeyboardEvent) || UNSUPPORTED_KEYS.includes(e.code)) return;
    const rowIndex = Number(row.dataset.nth);
    const thisRow = getRow(rowIndex);

    switch(e.code) {
    case "Backspace":
      if(!Boolean(textElement.textContent) && row.contains(textElement)) return deleteRow(rowIndex);

      updateRow(rowIndex, { activeColumnIndex: thisRow.activeColumnIndex - 1, content: thisRow.content.slice(0, thisRow.content.length - 1) })
      input.style.left = `${thisRow.textElement.offsetWidth + 2}px`;
      break;
    case "Enter":
      const resto = textElement.textContent?.slice(thisRow.activeColumnIndex) || "";
      updateRow(rowIndex, { content: thisRow.content.splice(0, thisRow.activeColumnIndex - 1) });
      
      const newRow = createRow(resto);
      container?.insertBefore(newRow, row.nextSibling);

      newRow.click();
      break;
    case "ArrowUp":
      const prevRow = row.previousElementSibling;
      if (prevRow instanceof HTMLPreElement && activeInput) {
	prevRow.click();
	activeInput.style.left = `${getRow(Number(prevRow.dataset.nth)).textElement.offsetWidth + 2}px`;
      }
      break;
    case "ArrowDown":
      const nextRow = row.nextElementSibling;
      if (nextRow instanceof HTMLPreElement && activeInput) {
	nextRow.click();
	activeInput.style.left = `${getRow(Number(nextRow.dataset.nth)).textElement.offsetWidth + 2}px`;
      }
      break;
    case "ArrowLeft":
      if (!activeInput || !activeRow) return;
      const leftValue = Number(activeInput.style.left.split("px")[0]);
      if (leftValue <= 10) return;
      updateRow(rowIndex, { activeColumnIndex: thisRow.activeColumnIndex - 1 })
      activeInput.style.left = `${Number(leftValue - 16)}px`;
      break;
    case "ArrowRight":
      if (!activeInput || !activeRow) return;
      if (thisRow.activeColumnIndex >= thisRow.content.length) return;
      const leftValue2 = Number(activeInput.style.left.split("px")[0]);
      updateRow(rowIndex, { activeColumnIndex: thisRow.activeColumnIndex + 1 })
      activeInput.style.left = `${Number(leftValue2 + 16)}px`;
      break;
    default:
      const firstPart = thisRow.content.slice(0, thisRow.activeColumnIndex) || "";
      const endPart = thisRow.content.slice(thisRow.activeColumnIndex) || "";

      updateRow(rowIndex, {
	activeColumnIndex: thisRow.activeColumnIndex + 1,
	content: [...firstPart, e.key, ...endPart]
      })

      
      input.style.left = `${(thisRow.textElement.offsetWidth / ((thisRow.content.length) || 1)) * (thisRow.activeColumnIndex)}px`;
      break;
    }

    console.log(thisRow.content[thisRow.activeColumnIndex - 1]);
  })
  
  return input
}

function deleteRow(index: number) {
  if (!container || !numbers) throw new Error("Container root not defined");
  if (rows.length === 1) return;


  container.removeChild(rows[index].element);
  const lastChildNumber = numbers.lastChild;
  rows = rows.filter((_, i) => i !== index);
  console.log(rows);

  if(lastChildNumber)
    numbers.removeChild(numbers.lastChild);

  if (container.lastElementChild && container.lastElementChild instanceof HTMLPreElement)
    container.lastElementChild.click();
}

function createRow(content?: string) {
  if (!container) throw new Error("Container root not defined");
  const index = container.childElementCount.toString()
  const row = document.createElement("pre");
  const textElement = document.createElement("p");
  const n = document.createElement("span");

  if (!rows[Number(row.dataset.nth as string)])
    rows.push({content: content?.split("") || [], element: row, textElement: textElement, activeColumnIndex: content?.length || 0});
  
  row.id = "row";
  row.dataset.nth = index;
  row.setAttribute("hash", String(Math.trunc(Math.random() * 1000000)));
  row.appendChild(textElement);
  textElement.textContent = content || "";
  n.textContent = index;
  numbers?.appendChild(n);

  row.addEventListener("click", (e: FocusEvent) => {
    if (!(e.currentTarget instanceof HTMLPreElement)) return;
    
    if (!activeRow) {
      activeRow = row;
      createInput(activeRow);
    }
    
    if (e.currentTarget.dataset.nth !== activeRow.dataset.nth) {
      removeInput(activeInput, activeRow);
      activeRow.classList.remove("active");
      activeRow = row;
      createInput(activeRow);
    }

    if (!activeInput) return;
    row.classList.add("active")

    const leftValue = getRow(Number(index)).content.length ? getRow(Number(index)).textElement.offsetWidth : 0;

    activeInput.style.left = `${leftValue}px`

    row.appendChild(activeInput);
    activeInput.focus();
  })

  return row;
}

function removeInput(input: HTMLInputElement | null, row: HTMLSpanElement) {
  if (!input) return;
  row.removeChild(input);
  activeInput = null;
}

function updateRow(index: number, row: Partial<Row>): Row {
  rows[index] = {...rows[index], ...row};

  if (row?.content) {
    rows[index].textElement.textContent = row.content.join("");
  }

  return {...rows[index], ...row};
}

function getRow(index: number): Row {
  return rows[index];
}

(() => {
  container.style.height = HEIGHT.toString();
  container.style.width = WIDTH.toString();

  const row = createRow();
  container.appendChild(row);
})()
