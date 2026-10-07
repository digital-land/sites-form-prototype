//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here

// Source - https://stackoverflow.com/a/46427070
// Posted by Thomas
// Retrieved 2026-08-26, License - CC BY-SA 3.0

/**
* Returns a JSON stringified version of the value, safe for inclusion in an
* inline <script> tag. The optional argument 'spaces' can be used for
* pretty-printing.
*
* Output is NOT safe for inclusion in HTML! If that's what you need, use the
* built-in 'dump' filter instead.
*/
addFilter('json', (value, spaces) => {
  return JSON.stringify(value, null, spaces)
    .replace(/</g, '\\u003c')
})

addFilter('bullets', (value, classes) => {
  let listItemsHtml = ""
  if (Array.isArray(value)) {
    listItemsHtml += value.map(item => `<li>${item}</li>`).join('')
  } else {
    listItemsHtml += `<li>${value}</li>`
  }

  listItemsHtml = `<ul class="govuk-list govuk-list--bullet ${classes || ''}">${listItemsHtml}</ul>`

  return listItemsHtml
}, { renderAsHtml: true })
