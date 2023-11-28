
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

    let preferencia = document.getElementById("buscaOqStr").value
    //let onde = document.getElementById("buscaOndeStr").value
    
    //console.log(preferencia, onde)
    

    if (preferencia !== "") {
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
              zoom: 12
            });

            var request = {
              location: pos,
              radius: '1000',
              query: preferencia
            };

            service = new google.maps.places.PlacesService(map);

            service.textSearch(request, callback);

            function callback(results, status) {
              if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                  if(i == 0) {
                    map.setCenter(createMarker(results[i]).getPosition());
                  }
                  createMarker(results[i])
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
    } else {
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
              zoom: 12
            });

            var request = {
              location: pos,
              radius: '1000',
              fields: ['name', 'geometry', 'delivery', 'allowsDogs'],
              type: ['restaurant'],
              headers: {
                'X-Goog-FieldMask': ['places.allowsDogs']
              }
            };

            service = new google.maps.places.PlacesService(map);

            service.nearbySearch(request, callback);

            //Percorre o array de telefones, usa cada um deles como parâmetro pra fazer busca no YELP
            restaurantPhones.forEach(phone => {
              businessMatch(phone)
            });

            function callback(results, status) {
              if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {

                  createMarker(results[i]);
                  //console.log(results[i])
                  adicionaRestauranteNaTabela(results[i])
                  restaurantPhones.push(results[i].name)
                }
                encontrarMelhorRestaurante()
                ordenarRestaurantes()
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
  return marker

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
  row.insertCell().textContent = restaurante.formatted_address;
  row.insertCell().textContent = restaurante.price_level;
  row.insertCell().textContent = restaurante.rating;
  //console.log("fone: ", restaurante.phone)
}


function encontrarMelhorRestaurante() {
  var tabelaRestaurantes = document.getElementById("minhaTabela");
  var linhas = tabelaRestaurantes.getElementsByTagName("tr");

  // Inicializa com valores "infinitos" para avaliação e preço
  var melhor = { avaliacao: -Infinity, preco: Infinity, restaurante: null };

  for (var i = 0; i < linhas.length; i++) {
      var linha = linhas[i];
      var colunas = linha.getElementsByTagName("td");

      // Verifica se há pelo menos 4 colunas (para evitar erro se a tabela não estiver bem formatada)
      if (colunas.length >= 4) {
          var precoRestaurante = parseInt(colunas[2].textContent, 10); // A terceira coluna (índice 2) contém o "price-level"
          var avaliacaoRestaurante = parseFloat(colunas[3].textContent); // A quarta coluna (índice 3) contém a "Avaliacao"

          if (avaliacaoRestaurante > melhor.avaliacao || (avaliacaoRestaurante === melhor.avaliacao && precoRestaurante < melhor.preco)) {
              melhor = { restaurante: colunas[0].textContent, avaliacao: avaliacaoRestaurante, preco: precoRestaurante };
              
          }
      }
  }
}

function ordenarRestaurantes() {
  var tabelaRestaurantes = document.getElementById("minhaTabela");
  var linhas = Array.from(tabelaRestaurantes.getElementsByTagName("tr"));

  // Remove a primeira linha (cabeçalho)
  linhas.shift();

  // Ordena as linhas com base na avaliação (decrescente) e no preço (crescente)
  linhas.sort(function (a, b) {
      var avaliacaoA = parseFloat(a.getElementsByTagName("td")[3].textContent); // Índice 3 para a "Avaliacao"
      var avaliacaoB = parseFloat(b.getElementsByTagName("td")[3].textContent);

      var precoA = parseInt(a.getElementsByTagName("td")[2].textContent, 10); // Índice 2 para o "price-level"
      var precoB = parseInt(b.getElementsByTagName("td")[2].textContent, 10);

      // Ordena por avaliação (decrescente)
      if (avaliacaoB !== avaliacaoA) {
          return avaliacaoB - avaliacaoA;
      }

      // Se as avaliações forem iguais, ordena por preço (crescente)
      return precoA - precoB;
  });

  // Limpa a tabela
  tabelaRestaurantes.innerHTML = "";

  // Adiciona as linhas ordenadas de volta à tabela
  tabelaRestaurantes.appendChild(document.getElementsByTagName("thead")[0]); // Adiciona o cabeçalho de volta
  linhas.forEach(function (linha) {
      tabelaRestaurantes.appendChild(linha);
  });
}