//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
require('dotenv').config()

const govukPrototypeKit = require('govuk-prototype-kit')
const https = require('node:https')
const router = govukPrototypeKit.requests.setupRouter()

const osMapApiOrigin = 'https://api.os.uk'
const osMapProxyPath = '/os-map-proxy'
const osMapResourcePathPrefix = '/maps/vector/ngd/ota/v1/collections/ngd-base'
const osMapStylePath = `${osMapResourcePathPrefix}/styles/light-3857`

function getOsMapResponse(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, response => resolve(response))
    request.setTimeout(15000, () => request.destroy(new Error('Map request timed out')))
    request.on('error', reject)
  })
}

function getOsMapResourcePath(pathname) {
  const proxyPathPrefix = `${osMapProxyPath}/`
  if (!pathname.startsWith(proxyPathPrefix)) return null

  const pathSegments = pathname.slice(proxyPathPrefix.length).split('/')
  let decodedSegments
  try {
    decodedSegments = pathSegments.map(segment => decodeURIComponent(segment))
  } catch {
    return null
  }

  if (
    decodedSegments.some(segment =>
      !segment ||
      segment === '.' ||
      segment === '..' ||
      /[\/\\\u0000-\u001f]/.test(segment)
    ) ||
    `/${decodedSegments.slice(0, 7).join('/')}` !== osMapResourcePathPrefix ||
    decodedSegments.length <= 7
  ) {
    return null
  }

  const resource = decodedSegments.slice(7).join('/')
  const isStyleResource = /^styles\/light-3857(?:\/sprites\/sprite(?:@2x)?(?:\.(?:json|png))?|\/fonts\/[^/]+\/(?:\d+-\d+|\{range\})\.pbf)?$/.test(resource)
  const isTile = /^tiles\/3857\/\d+\/\d+\/\d+$/.test(resource)
  if (!isStyleResource && !isTile) return null

  return `/${decodedSegments.map(segment => encodeURIComponent(segment)).join('/')}`
}

function adaptOsMapStyle(style, proxyOrigin) {
  const source = style.sources?.['ngd-base']
  if (source?.type !== 'vector' || typeof source.url !== 'string') {
    throw new Error('Unexpected NGD map source')
  }
  const sourceUrl = new URL(source.url)
  if (sourceUrl.origin !== osMapApiOrigin || sourceUrl.pathname !== `${osMapResourcePathPrefix}/tiles/3857`) {
    throw new Error('Unexpected NGD map source')
  }

  source.tiles = [`${proxyOrigin}${osMapProxyPath}${osMapResourcePathPrefix}/tiles/3857/{z}/{y}/{x}`]
  delete source.url

  for (const property of ['sprite', 'glyphs']) {
    const resourceUrl = new URL(style[property])
    if (
      resourceUrl.origin !== osMapApiOrigin ||
      !getOsMapResourcePath(`${osMapProxyPath}${resourceUrl.pathname}`)
    ) {
      throw new Error(`Unexpected NGD ${property} resource`)
    }
    style[property] = `${proxyOrigin}${osMapProxyPath}${resourceUrl.pathname.replaceAll('%7B', '{').replaceAll('%7D', '}')}`
  }
  return style
}

async function proxyOsMapRequest(req, res) {
  const apiKey = process.env.ORDNANCE_SURVEY_API_KEY?.trim()
  if (!apiKey) {
    return res.status(503).send('Map service is not configured.')
  }

  const requestUrl = new URL(req.originalUrl, 'http://localhost')
  const resourcePath = getOsMapResourcePath(requestUrl.pathname)
  if (!resourcePath) {
    return res.status(404).send('Map resource not found.')
  }

  const upstreamUrl = new URL(resourcePath, osMapApiOrigin)
  for (const [name, value] of requestUrl.searchParams) {
    if (!['key', 'srs'].includes(name.toLowerCase())) {
      upstreamUrl.searchParams.append(name, value)
    }
  }
  upstreamUrl.searchParams.set('key', apiKey)

  try {
    const response = await getOsMapResponse(upstreamUrl)
    if (response.statusCode >= 300 && response.statusCode < 400) {
      response.resume()
      return res.status(502).send('Map resource is unavailable.')
    }
    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
      const status = response.statusCode || 502
      response.resume()
      return res.status(status).send('Map resource is unavailable.')
    }

    const chunks = []
    for await (const chunk of response) chunks.push(chunk)
    const body = Buffer.concat(chunks)
    const isStyle = resourcePath === osMapStylePath
    const result = isStyle
      ? JSON.stringify(adaptOsMapStyle(JSON.parse(body.toString('utf8')), `${req.protocol}://${req.get('host')}`))
      : body
    res.set({
      'Content-Type': isStyle ? 'application/json' : response.headers['content-type'] || 'application/octet-stream',
      'Cache-Control': isStyle ? 'no-store' : response.headers['cache-control'] || 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff'
    })
    return res.send(result)
  } catch (error) {
    console.error('Ordnance Survey map request failed:', error.name)
    return res.status(502).send('Map resource is unavailable.')
  }
}

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

function mapHandler(req, res, next) {
  const lpaDetails = 
    {
      curie: 'statistical-geography:E60000182'
    }

  res.render('site-boundary', {
    osMapsConfigured: Boolean(process.env.ORDNANCE_SURVEY_API_KEY?.trim()),
    lpaDetails
  })
}

router.get('/os-map-proxy/*', (req, res) => {
  proxyOsMapRequest(req, res)
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
  if (req.session.data['hasOtherConstraints'] === 'Yes') {
    return res.redirect('/other-constraints-details')
  } else {
    return res.redirect('/current-use')
  }
})

router.post('/existing-lease-controller', (req, res, next) => {
  const selectedUses = req.body['currentSiteUse[]'] || req.body.currentSiteUse || req.session.data['currentSiteUse']
  const isOtherSuiGeneris = Array.isArray(selectedUses)
    ? selectedUses.includes('Other')
    : selectedUses === 'Other'

  if (isOtherSuiGeneris) {
    return res.redirect('/other-usage-description')
  }

  return res.redirect('/current-site-status')
})



//working on this one 

router.post('/potential-use-controller', (req, res) => {
  console.log('potential-use-controller');

  const selectedUses = req.session.data['proposedSiteUse'] || [];

  const isJobs = [
    'Education',
    'General industrial',
    'Health',
    'Light industrial',
    'Office',
    'Retail',
    'Sports and leisure',
    'Warehousing or storage and distribution'
  ];

  const isHomes = [
    'Residential',
    'Traveller accommodation'
  ];

  const isOtherSuiGeneris = [
    'Other'
  ];

  const pages = [];
  const hasJobs = selectedUses.some(use => isJobs.includes(use));
  console.log('has jobs', hasJobs);
  const hasHomes = selectedUses.some(use => isHomes.includes(use));
  console.log('has homes', hasHomes);
  const hasOther = selectedUses.some(use => isOtherSuiGeneris.includes(use));
  console.log('has other', hasOther);

  if (hasOther) {
    pages.push('/potential-other-site-use');
  }

  if (hasHomes) {
    pages.push('/how-many-homes');
  }

  if (hasJobs) {
    pages.push('/how-many-jobs');
  }

  // always redirect to landowner support page at the end of the flow
  pages.push('/landowner-support');

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
  if (req.session.data['multipleOwners'] !== 'Yes') {
    return res.redirect('/access-issues')
  } else {
    return res.redirect('/multiple-owners-details')
  }
})


router.post('/provide-vehicle-access-controller', (req, res, next) => {
  if (req.session.data['provideVehicleAccess'] === 'No') {
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
