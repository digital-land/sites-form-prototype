import { OS_VTS_STYLE_URLS, OS_ATTRIBUTION, useOsTransformRequest } from './osMapStyle.js'

const MAP_STYLE = {
  id: 'light',
  url: OS_VTS_STYLE_URLS.light,
  attribution: OS_ATTRIBUTION,
  backgroundColor: '#f5f5f0'
}

async function initialiseMap() {
  const transformRequest = useOsTransformRequest()

  const interactiveMap = new defra.InteractiveMap('map', {
    behaviour: 'inline',
    mapProvider: defra.maplibreProvider(),
    mapStyle: MAP_STYLE,
    transformRequest,
    center: [-1.6, 53.1],
    zoom: 6,
    containerHeight: '40vh',
    hasExitButton: true
  })
  
  interactiveMap.on('map:error', function (event) {
    console.error('Map error:', event)
  })
  
}

window.initialiseMap = initialiseMap