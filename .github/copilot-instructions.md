# AI Agent Instructions for Local Plans Site Identification Form

## Project Overview
This is a GOV.UK Prototype Kit application for collecting site suggestions for Local Plan 2040. It allows users to submit potential development sites through a multi-step form process using GOV.UK Design System components.

## Key Technologies
- [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) v13.17.0
- [GOV.UK Frontend](https://design-system.service.gov.uk/) v5.11.0
- Nunjucks templating
- Node.js/Express

## Architecture Patterns

### View Templates
- All pages extend either `layouts/main.html` (GOV.UK branded) or `layouts/unbranded.html`
- Pages use Nunjucks templating with GOV.UK Design System macros
- Form pages follow this structure:
```html
{% extends "layouts/lpa-branded.html" %}
{% block pageTitle %}Page name – {{ serviceName }}{% endblock %}
{% block beforeContent %}{{ govukBackLink }}{% endblock %}
{% block content %}
  <div class="govuk-grid-row">
    <div class="govuk-grid-column-two-thirds">
      <form class="form" action="..." method="post">
        <!-- GOV.UK components -->
      </form>
    </div>
  </div>
{% endblock %}
```

### Routing
- Routes defined in `app/routes.js` using Express router
- POST handlers manage form submissions and redirects
- Example pattern:
```js
router.post('/route-name', (req, res) => {
  if (condition) {
    return res.redirect('/next-page')
  }
  res.render('current-page')
})
```

### Components
- Use GOV.UK Design System components via Nunjucks macros
- Common components: `govukButton`, `govukInput`, `govukRadios`, `govukCheckboxes`
- Components should include proper labels, hints, and error states
- Example: `site-uses.html` demonstrates checkbox group with conditional fields

## Development Workflow

### Setup & Running
```bash
npm install
npm run dev  # Start development server
```

### Adding New Pages
1. Create new view in `app/views/`
2. Add route handler in `app/routes.js` if needed
3. Use existing pages as templates (`site-uses.html`, `contact-details.html`)
4. Follow GOV.UK Design System patterns

### Form Validation
- Form validation handled through route handlers
- Use conditional reveals for dependent fields (see `site-uses.html`)
- Follow GOV.UK error message patterns

## Key Files
- `app/config.json` - Service name and global config
- `app/views/layouts/` - Base layouts
- `app/routes.js` - All route handlers
- `app/assets/sass/application.scss` - Custom styles
- `app/filters.js` - Custom Nunjucks filters

## Common Patterns
- Use `govuk-` prefixed classes for styling
- Use fieldset/legend pattern for form sections
- Back links should use `javascript:window.history.back()`
- Group related form controls with fieldsets
- Use button groups for form actions

## Converting Markdown to GOV.UK Components
When converting custom markdown syntax to GOV.UK Design System components, use these mappings:

| Markdown Syntax | GOV.UK Component |
|----------------|------------------|
| `[___]` | `govukInput` macro |
| `[+ ButtonText]` | `govukButton` macro with specified text |
| `[link]` | `<a class="govuk-link">` |
| `( )` | `govukRadios` macro |
| `[ ]` | `govukCheckboxes` macro |
| `[> Details]` | `govukDetails` macro |

Example conversion:
```markdown
**Field label**
Help text
[___]
```
Becomes:
```html
{{ govukInput({
  label: {
    text: "Field label",
    classes: "govuk-label--s"
  },
  hint: {
    text: "Help text"
  },
  id: "fieldName",
  name: "fieldName"
}) }}
```

For radio buttons and checkboxes:
- Text below options in quotes becomes conditional reveal content
- Use fieldset with legend for the question text
- Set `isPageHeading: true` when the legend is the main page heading
