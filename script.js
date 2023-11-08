
let map;
var restaurantPhones = []
const restaurantMarkers = [];
//var _send = require("call-me-maybe-master/lib/index")

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

document.getElementById('form').addEventListener('submit',
  async function initMap(event) {
    // Request needed libraries.
    //@ts-ignore
    event.preventDefault();

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerView } = await google.maps.importLibrary("marker");
    const { Places } = await google.maps.importLibrary("places")

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          var local = new google.maps.LatLng(pos.lat, pos.lng);
          map = new google.maps.Map(document.getElementById('map'), {
            center: local,
            zoom: 15
          });

          var nearbyRequest = {
            location: pos,
            radius: '1000',
            fields: ['name', 'geometry', 'delivery', 'allowsDogs'],
            type: ['restaurant'],
            headers: {
              'X-Goog-FieldMask': ['places.allowsDogs']
            }
          };

          service = new google.maps.places.PlacesService(map);

          service.nearbySearch(nearbyRequest, callback);

          //Percorre o array de telefones, usa cada um deles como parâmetro pra fazer busca no YELP
          restaurantPhones.forEach(phone => { 
            businessMatch(phone)
          });

          function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              for (var i = 0; i < results.length; i++) {

                createMarker(results[i]);
                console.log(results[i])
                adicionaRestauranteNaTabela(results[i])
                restaurantPhones.push(results[i].name)
              }
            }
          }
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter())
        }
      )
    } else {
      //browser nao suporta localizacao
      console.log("navegador nao suporta localizacao")
    }
  }
)


function createMarker(place) {
  const marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    title: place.name,
    //label: { text: place.name }
  })
  restaurantMarkers.push(marker);

  const infowindow = new google.maps.InfoWindow({
    content: `<strong>${place.name}</strong><br>${place.vicinity}`
  });


}

// Função para exibir os restaurantes em uma tabela HTML
function adicionaRestauranteNaTabela(restaurante) {
  var iframe = document.getElementById("iframe")
  var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
  var tabela = iframeDocument.getElementById("minhaTabela").getElementsByTagName("tbody")[0];
  let resultados = document.getElementById("resultados")
 
  resultados.style.display = "flex"
  document.getElementsByTagName("main")[0].style.display = "block"
  document.getElementsByTagName("header")[0].style.height = "25%"
  document.getElementsByTagName("form")[0].style.marginTop = "10px"
  //console.log(restaurante)
  // Limpa a tabela antes de adicionar novos dados
  //tabela.innerHTML = '';
  const row = tabela.insertRow();
  row.insertCell().textContent = restaurante.name;
  row.insertCell().textContent = restaurante.vicinity;
  row.insertCell().textContent = restaurante.priceLevel;
  row.insertCell().textContent = restaurante.rating;
console.log("fone: ", restaurante.phone)
}


