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
    'Class C2a: Secure residential institutions, for example prisons, young offenders institutions, detention centres or secure training centres'
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
    console.log('has jobs');
    pages.push('/how-many-jobs');
  }

  if (hasHomes) {
    console.log('has homes');
    pages.push('/how-many-homes');
  }

  if (hasOther) {
    console.log('has other');
    pages.push('/other-usage-description');
  }

  if (pages.length > 0) {

    const nextPage = pages.shift();

    req.session.data.remainingPages = pages;

    return res.redirect(nextPage);

  } else {
    return res.redirect('/site-joining');
  }


});


// Reusable controller for conditional pages

router.post('/next-conditional-page', (req, res) => {

  const remainingPages = req.session.data.remainingPages || [];

  if (remainingPages.length > 0) {

    const nextPage = remainingPages.shift();

    req.session.data.remainingPages = remainingPages;

    return res.redirect(nextPage);

  }

  return res.redirect('/site-joining');

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
/**********************************************************
 * Proxy API routes for map data                          *
***********************************************************/
require('./routes/api.js')
