import { OS_VTS_STYLE_URLS, OS_ATTRIBUTION, useOsTransformRequest } from './osMapStyle.js'

const MAP_STYLE = {
  id: 'light',
  url: OS_VTS_STYLE_URLS.light,
  attribution: OS_ATTRIBUTION,
  backgroundColor: '#f5f5f0'
}

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

  const interactiveMap = new defra.InteractiveMap('map', {
    behaviour: 'inline',
    mapProvider: defra.maplibreProvider(),
    mapStyle: MAP_STYLE,
    transformRequest,
    center: [-1.6, 53.1],
    zoom: 6,
    containerHeight: '40vh',
    hasExitButton: true,
    plugins: [datasetsPlugin]
  })

  interactiveMap.map.on('load', () => {
    interactiveMap.map.fitBounds(getBounds(boundaryGeoJson), {
      padding: 40,
      maxZoom: 14
    })
  })

  interactiveMap.on('map:error', function (event) {
    console.error('Map error:', event)
  })
  
}

window.initialiseMap = initialiseMap