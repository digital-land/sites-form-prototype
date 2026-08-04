//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Routes with branching logic
router.post('/their-organisation', (req, res, next) => {
  if (req.session.data['onBehalfOf'] === 'yes') {
    next()
  } else {
    return res.redirect('/your-organisation')
  }
})

router.post('/site-boundary-choice', (req, res) => {
  if (req.body.siteBoundaryChoice === 'draw') {
    return res.redirect('/site-boundary')
  } else if (req.body.siteBoundaryChoice === 'upload') {
    return res.redirect('/upload-boundary')
  } else if (req.body.siteBoundaryChoice === 'findAddress') {
    return res.redirect('/find-address')
  } else {
    res.render('/site-boundary-choice')
  }
})
