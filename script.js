
let map;
var restaurantPhones = []

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
            fields: ['name', 'geometry'],
            type: ['restaurant']
          };

          service = new google.maps.places.PlacesService(map);

          service.nearbySearch(nearbyRequest, callback);

          //Percorre o array de telefones, usa cada um deles como parâmetro pra fazer busca no YELP
          restaurantPhones.forEach(phone => { 
            buscarRestaurantesPorFoneYELP(phone)
          });

          function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
                console.log(results[i])
                restaurantPhones.push(results[i].phone)
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


//--------------------------------------- YELP API ----------------------------------------------//
const endpoint = 'https://api-motor-de-busca-55jb6cp3q-matheus-s-projects.vercel.app/';
let location1 = "curitiba"

// Função para buscar restaurantes com base na geolocalização do usuário
function buscarRestaurantesPorFoneYELP(phone) {
  const url = `${endpoint}?term=restaurantes&phone=${phone}`;

  // Fazendo uma requisição GET para a API do Yelp Fusion
  fetch(url, {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
    
  })
    .then(response => response.json())
    .then(data => {
      data.forEach(restaurante => {
        adicionaRestaurantesNaTabela(restaurante);
      });
    })
    .catch(error => {
      console.error('Erro ao buscar restaurantes:', error);
    });
}

// Função para exibir os restaurantes em uma tabela HTML
function adicionaRestauranteNaTabela(restaurante) {
  var iframe = document.getElementById("iframe")
  var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
  var tabela = iframeDocument.getElementById("minhaTabela").getElementsByTagName("tbody")[0];

  // Limpa a tabela antes de adicionar novos dados
  tabela.innerHTML = '';
  const row = tabela.insertRow();
  row.insertCell().textContent = restaurante.name;
  row.insertCell().textContent = restaurante.location.address1;
  row.insertCell().textContent = restaurante.phone;
  row.insertCell().textContent = restaurante.rating;

}

// Exemplo de uso: chame a função buscarRestaurantes passando a latitude e longitude do usuário
// buscarRestaurantes(latitude, longitude);



