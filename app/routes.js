//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
require('dotenv').config()

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

router.post('/their-connection-controller', (req, res, next) => {
  if (req.session.data['theirConnection'] !== 'Other') {
    return res.redirect('/their-contact-details')
  } else {
    return res.redirect('/other-connection')
  }
})

router.post('/your-connection-controller', (req, res, next) => {
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

router.get('/site-boundary', mapHandler)
router.post('/site-boundary', mapHandler)

async function mapHandler(req, res, next) {
  const lpaDetails = 
    {
      curie: 'statistical-geography:E60000182'
    }

  res.render('site-boundary', {
    osMapsApiKey: process.env.ORDNANCE_SURVEY_API_KEY,
    lpaDetails
  })
}

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

router.post('/existing-lease-controller', (req, res, next) => {
  const selectedUses = req.body['currentSiteUse[]'] || req.body.currentSiteUse || req.session.data['currentSiteUse']
  const isOtherSuiGeneris = Array.isArray(selectedUses)
    ? selectedUses.includes('Other (Sui generis)')
    : selectedUses === 'Other (Sui generis)'

  if (isOtherSuiGeneris) {
    return res.redirect('/other-usage-description')
  }

  return res.redirect('/existing-lease')
})



router.post('/multiple-owners-controller', (req, res, next) => {
  if (req.session.data['multipleOwners'] !== 'yes') {
    return res.redirect('/access-issues')
  } else {
    return res.redirect('/multiple-owners-details')
  }
})


router.post('/vehicle-access-controller', (req, res, next) => {
  if (req.session.data['vehicleAccess'] === 'Yes') {
    return res.redirect('/constraints-pollution')
  } else {
    return res.redirect('/provide-vehicle-access')
  }
})


router.post('/provide-vehicle-access-controller', (req, res, next) => {
  if (req.session.data['provideVehicleAccess'] === 'Yes') {
    return res.redirect('/explain-vehicle-access')
  } else {
    return res.redirect('/constraints-pollution')
  }
})


router.post('/pollution-contamination-controller', (req, res, next) => {
  if (req.session.data['polutionContamination'] === 'Yes') {
    return res.redirect('/explain-dangerous-substances')
  } else {
    return res.redirect('/site-blockers')
  }
})



router.post('/site-marketed-controller', (req, res, next) => {
  if (req.session.data['siteMarketed'] === 'Yes') {
    return res.redirect('/explain-marketing-details')
  } else {
    return res.redirect('/ready-for-development')
  }
})
/**********************************************************
 * Proxy API routes for map data                          *
***********************************************************/
require('./routes/api.js')
