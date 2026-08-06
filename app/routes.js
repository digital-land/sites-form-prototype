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



router.post('/their-contact-details', (req, res, next) => {
  if (req.session.data['theirConnection'] === 'Other' && Object.prototype.hasOwnProperty.call(req.body, 'otherConnection')) {
    return res.redirect('/their-contact-details')
  }

  if (req.session.data['theirConnection'] !== 'Other') {
    next()
  } else {
    return res.redirect('/other-connection')
  }
})


router.post('/your-connection', (req, res, next) => {
  if (req.session.data['yourConnection'] !== 'Other') {
    return res.redirect('/your-contact-details')
  } else {
    return res.redirect('/your-other-connection')
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
