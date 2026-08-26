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



//working on this one 

router.post('/potential-use-controller', (req, res) => {
  console.log('potential-use-controller');

  const selectedUses = req.session.data['proposedSiteUse'] || [];

  const isJobs = [
    'Class B2: General industry',
    'Class B8: Storage and distribution',
    'Class C1: Hotels',
    'Class C2: Residential institutions, for example care homes, boarding schools and colleges, hospitals or nursing homes',
    'Class C2a: Secure residential institutions, for example prisons, young offenders institutions, detention centres or secure training centres',
    'Class E: Commercial, Business and Service',
    'Class F1: Learning and non-residential institutions, for example schools, museums, libraries or art galleries'

  ];

  const isHomes = [
    'Class C3: Dwelling-houses',
    'Class C4: Houses in multiple occupation'
  ];

  const isOtherSuiGeneris = [
    'Other (Sui generis)'
  ];

  const pages = [];
  const hasJobs = selectedUses.some(use => isJobs.includes(use));
  console.log('has jobs', hasJobs);
  const hasHomes = selectedUses.some(use => isHomes.includes(use));
  console.log('has homes', hasHomes);
  const hasOther = selectedUses.some(use => isOtherSuiGeneris.includes(use));
  console.log('has other', hasOther);


  if (hasJobs) {
    pages.push('/how-many-jobs');
  }

  if (hasHomes) {
    pages.push('/how-many-homes');
  }

  if (hasOther) {
    pages.push('/potential-other-site-use');
  }

  // always redirect to site joining page at the end of the flow
  pages.push('/site-joining');

  const nextPage = pages.shift();
  req.session.data.remainingPages = pages;
  return res.redirect(nextPage);
});


// Reusable controller for conditional pages
router.post('/next-conditional-page', (req, res) => {

  const remainingPages = req.session.data.remainingPages || [];

  if (remainingPages.length > 0) {
    const nextPage = remainingPages.shift();
    req.session.data.remainingPages = remainingPages;
    return res.redirect(nextPage);
  } else {
    // throw error if no remaining pages are found
    console.error('No remaining pages found in session data.');
    throw new Error('No remaining pages found in session data.');
  }
});
// End of the proposed-lease-controller route


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

router.post('/site-blockers-constraint-details', (req, res) => {

  const selectedUses = req.session.data['siteBlockers'] || [];

  const noisePollution = selectedUses.includes('Noise pollution');
  const legalRestriction = selectedUses.includes('Legal restriction');
  const cannotBeConnected = selectedUses.includes('Cannot be connected');

  if (noisePollution || legalRestriction || cannotBeConnected) {
    return res.redirect('/site-blockers-constraint-details');
  }

  return res.redirect('/has-site-been-marketed');
});

router.post('/site-marketed-controller', (req, res, next) => {
  if (req.session.data['siteMarketed'] === 'Yes') {
    return res.redirect('/explain-marketing-details')
  } else {
    return res.redirect('/ready-for-development')
  }
})

router.all('/lpa-template/:lpaName/:templateName', (req, res) => {
  const lpaDetails = {}

  if (req.params.lpaName == "planhamshire") {
    lpaDetails.name = "Planhamshire Borough Council"
  } else if (req.params.lpaName == "calderdale") {
    lpaDetails.name = "Calderdale Council"
    lpaDetails.logo = "/public/images/lpa-logos/calderdale-logo.svg"
  } else if (req.params.lpaName == "middlesbrough") {
    lpaDetails.name = "Middlesbrough Council"
    lpaDetails.logo = "/public/images/lpa-logos/middlesbrough-logo.svg"
    lpaDetails.colour = "#02467b"
  } else if (req.params.lpaName == "rossendale") {
    lpaDetails.name = "Rossendale Borough Council"
    lpaDetails.logo = "/public/images/lpa-logos/rossendale-logo.svg"
    lpaDetails.colour = "#005c3c"
  } else if (req.params.lpaName == "sunderland") {
    lpaDetails.name = "Sunderland City Council"
    lpaDetails.logo = "/public/images/lpa-logos/sunderland-logo.svg"
    lpaDetails.colour = "#ed0039"
  }

  res.render(`lpa-template/${req.params.templateName}`, { data: {
    lpaDetails: lpaDetails
  } });
});

/**********************************************************
 * Proxy API routes for map data                          *
***********************************************************/
require('./routes/api.js')
