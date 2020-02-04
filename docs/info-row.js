const openedClassName = "openedInfoRow"

let oldSelectedVersion = ""

document.addEventListener("DOMContentLoaded", () => {
  for (const element of document.getElementsByClassName("regionInfo")) {
    findElement(element, HTMLTableCellElement).addEventListener("click", event => {
      event.preventDefault()
      if (element.classList.contains(openedClassName)) {
        element.classList.remove(openedClassName)
        expandLink(element, false)
      }
      else {
        element.classList.add(openedClassName)
        expandLink(element, true)
      }
      return false
    })
  }

  document.getElementById("mapVersionFormatSelect").addEventListener("change", event => {
    const selectElement = event.target

    if (oldSelectedVersion === "") {
      oldSelectedVersion = selectElement.options[0].value
    }

    showOrHideVersion(selectElement.value, true)
    showOrHideVersion(oldSelectedVersion, false)
    oldSelectedVersion = selectElement.value
  })
})

function showOrHideVersion(version, show) {
  const list = document.getElementsByClassName(`v-${version}`)
  for (let i = 0; i < list.length; i++) {
    list.item(i).style.display = show ? "block" : "none"
  }
}

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

function expandLink(target, expand) {
  const tr = findElement(target.parentElement, HTMLTableRowElement)
  const table = findElement(tr.parentElement, HTMLTableElement)

  const infoRow = table.rows[tr.rowIndex + 1]
  infoRow.style.display = expand ? "table-row" : "none"

  // const zipUrls = link.dataset.zipUrls.split(",")
  // const parentDirUrl = link.dataset.parentDirUrl
  // let html = "<tr><td>zip:</td><td>"
  // if (zipUrls.length === 1) {
  //   html += `<a href="${parentDirUrl}/${zipUrls[0]}">download</a>`
  // }
  // else {
  //   html += zipUrls.map((it, index) => `<a href="${parentDirUrl}/${it}">part ${index + 1}</a>`).join(", ")
  // }
  // html += "</td></tr>"
  //
  // newCell.innerHTML = `<table class="infoRow">${html}</table>`
}