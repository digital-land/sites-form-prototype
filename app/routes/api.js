const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/api')
const asyncHandler = require('express-async-handler');

const { queryDatasette, getOrg, getDataset, getJsonResponse } = require('./functions.js');

router.get("/:curie/boundary.geojson", asyncHandler(async (req, res) => {
  const apiUrl = new URL('https://www.planning.data.gov.uk/entity.geojson')
  apiUrl.searchParams.set('curie', req.params.curie)

  const boundaryGeoJsonObject = await getJsonResponse(apiUrl).catch(e => console.error(e));

  res.json(boundaryGeoJsonObject);
}))
