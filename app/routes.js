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






router.post('/find-address', (req, res, next) => {
  if (req.session.data['siteBoundaryChoice'] === 'postcode') {
    next()
  } else if (req.session.data['siteBoundaryChoice'] === 'map') {
    return res.redirect('/site-boundary')
  }
})

router.post('/constraint-flood-zone-1', (req, res, next) => {
  if (req.session.data['floodZone1ConstraintResponse'] === 'yes') {
    return res.redirect('/constraint-flood-zone-1-how')
  } else if (req.session.data['floodZone1ConstraintResponse'] === 'no') {
    return res.redirect('/site-constraints')
  }
})

router.post('/constraint-conservation-area', (req, res, next) => {
  if (req.session.data['conservationAreaConstraintResponse'] === 'yes') {
    return res.redirect('/constraint-conservation-area-how')
  } else if (req.session.data['conservationAreaConstraintResponse'] === 'no') {
    return res.redirect('/site-constraints')
  }
})

router.post('/other-constraints', (req, res, next) => {
  if (req.session.data['hasOtherConstraints'] === 'yes') {
    return res.redirect('/other-constraints-details')
  } else if (req.session.data['hasOtherConstraints'] === 'no') {
    return res.redirect('/current-use')
  }
})


