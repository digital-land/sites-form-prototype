import { OS_VTS_STYLE_URLS, OS_ATTRIBUTION, useOsTransformRequest } from './osMapStyle.js'

const MAP_STYLE = {
  id: 'light',
  url: OS_VTS_STYLE_URLS.light,
  attribution: OS_ATTRIBUTION,
  backgroundColor: '#c5cdd0'
}

const DRAW_LAYERS = ['fill-inactive.cold', 'stroke-inactive.cold']

const mapColours = {
  purple: '#330165',
  orange: '#C44200',
  turquoise: '#007A7A',
  pink: '#CD2380',
  green: '#217E01',
  dark_pink: '#6C003B',
  light_blue: '#2A72B2',
  dark_blue: '#001B4D'
}

const layerStyles = [
  {
    stroke: mapColours.purple,
    strokeWidth: 2,
    fill: mapColours.purple,
    fillOpacity: 0.2,
    fillPattern: 'diagonal-cross-hatch'
  },
  {
    stroke: mapColours.orange,
    strokeWidth: 2,
    fill: mapColours.orange,
    fillOpacity: 0.2,
    fillPattern: 'horizontal-hatch'
  },
  {
    stroke: mapColours.pink,
    strokeWidth: 2,
    fill: mapColours.pink,
    fillOpacity: 0.2,
    fillPattern: 'vertical-hatch'
  },
  {
    stroke: mapColours.green,
    strokeWidth: 2,
    fill: mapColours.green,
    fillOpacity: 0.2,
    fillPattern: 'dot' 
  },
  {
    stroke: mapColours.dark_pink,
    strokeWidth: 2,
    fill: mapColours.dark_pink,
    fillOpacity: 0.2,
    fillPattern: 'diagonal-cross-hatch'
  },
  {
    stroke: mapColours.dark_blue,
    strokeWidth: 2,
    fill: mapColours.dark_blue,
    fillOpacity: 0.2,
    fillPattern: 'horizontal-hatch' 
  }
]

const focusStyle = {
  fillColor: '#ffdd00',
  fillOpacity: 1,
  stroke: '#0b0c0c',
  strokeWidth: 4
}

const boundaryStyle = {
  stroke: mapColours.turquoise,
  strokeOpacity: 1,
  strokeWidth: 4,
  fill: 'transparent'
}

const siteBoundaryStyle = {
  stroke: mapColours.orange,
  strokeOpacity: 1,
  strokeWidth: 4,
  fill: 'transparent'
}

async function initialiseMap() {
  const transformRequest = useOsTransformRequest()
  console.log('Initialising map with config:', JSON.stringify(window.mapConfig))
  const lpaCurie = window.mapConfig.lpaDetails.curie
  const boundaryGeoJsonUrl = `/api/${lpaCurie}/boundary.geojson`
  const boundaryResponse = await fetch(boundaryGeoJsonUrl)
  
  if (!boundaryResponse.ok) {
    throw new Error(`Boundary request failed: ${boundaryResponse.status}`)
  }
  
  const boundaryGeoJson = await boundaryResponse.json()
  
  const datasetsPlugin = defra.datasetsPlugin({
    datasets: [
      {
        id: 'lpa-boundary',
        type: 'geojson',
        label: boundaryGeoJson.features[0].properties.name + ' boundary',
        geojson: boundaryGeoJson,
        minZoom: 0,
        maxZoom: 24,
        showInKey: true,
        showInMenu: true,
        style: boundaryStyle
      }
    ]
  })
  
  const drawPlugin = defra.drawPlugin({
    drawModes: ['draw_polygon'],
    style: layerStyles
  })
  
  const interactPlugin = defra.interactPlugin({
    layers: [
      { layerId: 'fill-inactive.cold', idProperty: 'id' },
      { layerId: 'stroke-inactive.cold', idProperty: 'id' }
    ],
    interactionModes: ['selectFeature'],
    multiSelect: false,
    deselectOnClickOutside: true
  })
  
  const interactiveMap = new defra.InteractiveMap('map', {
    behaviour: 'inline',
    mapProvider: defra.maplibreProvider(),
    mapStyle: MAP_STYLE,
    transformRequest,
    center: [-1.6, 53.1],
    zoom: 6,
    hasExitButton: true,
    plugins: [datasetsPlugin, drawPlugin, interactPlugin]
  })

  let selectedFeatureIds = []
  
  interactiveMap.on('map:ready', () => {
    interactiveMap.fitToBounds(boundaryGeoJson.features[0])
    
    interactiveMap.addButton('drawPolygon', {
      label: 'Draw polygon',
      iconId: 'polygon',
      onClick: () => {
        drawPlugin.newPolygon(crypto.randomUUID())
      },
      mobile: { slot: 'actions'},
      tablet: { slot: 'actions'},
      desktop: { slot: 'actions'}
    })

    interactiveMap.addButton('editPolygon', {
      label: 'Edit polygon',
      iconId: 'polygon',
      onClick: () => {
        if (!drawPlugin.editFeature(selectedFeatureIds[0])) return
        interactPlugin.disable()
      },
      mobile: { slot: 'actions'},
      tablet: { slot: 'actions'},
      desktop: { slot: 'actions'},
      isHidden: true
    })

    interactiveMap.addButton('deletePolygon', {
      label: 'Delete polygon',
      iconId: 'polygon',
      onClick: () => {
        if (!drawPlugin.deleteFeature(selectedFeatureIds[0])) return
        interactPlugin.disable()
      },
      mobile: { slot: 'actions'},
      tablet: { slot: 'actions'},
      desktop: { slot: 'actions'},
      isHidden: true
    })

    interactPlugin.enable()

    interactiveMap.on('draw:started', function () {
      interactPlugin.disable()
    })

    interactiveMap.on('draw:created', function () {
      interactiveMap.toggleButtonState('drawPolygon', 'hidden', true)
      interactiveMap.toggleButtonState('editPolygon', 'hidden', false)
      interactiveMap.toggleButtonState('deletePolygon', 'hidden', false)
      interactPlugin.enable()
    })

    interactiveMap.on('draw:edited', function () {
      interactiveMap.toggleButtonState('drawPolygon', 'hidden', true)
      interactiveMap.toggleButtonState('editPolygon', 'hidden', false)
      interactiveMap.toggleButtonState('deletePolygon', 'hidden', false)
      interactPlugin.enable()
    })

    interactiveMap.on('draw:cancelled', function () {
      interactiveMap.toggleButtonState('drawPolygon', 'hidden', false)
      interactPlugin.enable()
    })

    interactiveMap.on('draw:delete', function () {
      interactiveMap.toggleButtonState('drawPolygon', 'hidden', false)
      interactiveMap.toggleButtonState('drawPolygon', 'disabled', false)
      interactiveMap.toggleButtonState('editPolygon', 'hidden', true)
      interactiveMap.toggleButtonState('deletePolygon', 'hidden', true)
      interactPlugin.enable()
    })

    interactiveMap.on('interact:selectionchange', function (e) {
      var singleFeature = e.selectedFeatures.length === 1
      var anyFeature = e.selectedFeatures.length > 0
      var isDrawFeature = singleFeature && DRAW_LAYERS.includes(e.selectedFeatures[0].layerId)
      var allDrawFeatures = anyFeature && e.selectedFeatures.every(function (f) { return DRAW_LAYERS.includes(f.layerId) })
      selectedFeatureIds = e.selectedFeatures.map(function (f) { return f.featureId })
      interactiveMap.toggleButtonState('drawPolygon', 'disabled', singleFeature)
      interactiveMap.toggleButtonState('drawLine', 'disabled', singleFeature)
      interactiveMap.toggleButtonState('editFeature', 'disabled', !isDrawFeature)
      interactiveMap.toggleButtonState('deleteFeature', 'disabled', !allDrawFeatures)
    })
    
    interactiveMap.on('map:error', function (event) {
      console.error('Map error:', event)
    })
  })
}

window.initialiseMap = initialiseMap