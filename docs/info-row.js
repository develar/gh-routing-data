const openedClassName = "openedInfoRow"

document.addEventListener("DOMContentLoaded", () => {
  for (const link of document.getElementsByClassName("regionInfo")) {
    findElement(link.parentElement, HTMLTableCellElement).addEventListener("click", event => {
      event.preventDefault()
      if (link.classList.contains(openedClassName)) {
        link.classList.remove(openedClassName)
        collapseLink(event, link)
      }
      else {
        link.classList.add(openedClassName)
        expandLink(event, link)
      }
      return false
    })
  }
})

function findElement(element, clazz) {
  do {
    if (element instanceof clazz) {
      return element
    }
    else {
      element = element.parentElement
    }
  }
  while (element != null)
  return null
}

function expandLink(event, link) {
  const tr = findElement(link.parentElement, HTMLTableRowElement)
  const table = findElement(tr.parentElement, HTMLTableElement)

  const rowIndex = tr.rowIndex
  const newRow = table.insertRow(rowIndex + 1)
  const newCell = newRow.insertCell(0)
  newCell.colSpan = 4

  const zipUrls = link.dataset.zipUrls.split(",")
  const parentDirUrl = link.dataset.parentDirUrl
  let html = "<tr><td>zip:</td><td>"
  if (zipUrls.length === 1) {
    html += `<a href="${parentDirUrl}/${zipUrls[0]}">download</a>`
  }
  else {
    html += zipUrls.map((it, index) => `<a href="${parentDirUrl}/${it}">part ${index + 1}</a>`).join(", ")
  }
  html += "</td></tr>"

  newCell.innerHTML = `<table class="infoRow">${html}</table>`
}

function collapseLink(event, link) {
  const tr = findElement(link.parentElement, HTMLTableRowElement)
  findElement(tr.parentElement, HTMLTableElement).deleteRow(tr.rowIndex + 1)
}