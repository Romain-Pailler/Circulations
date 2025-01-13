
  let department = 'Indisponible';
  let city = 'Indisponible';
  let latitude = 'Indisponible';
  let longitude = 'Indisponible';
  let map;

  // Fonction pour récupérer la localisation via l'API ipapi.co
  async function fetchLocation() {
      try {
          const response = await fetch('https://ipapi.co/json/');
          if (!response.ok) {
              throw new Error(`Erreur HTTP! statut: ${response.status}`);
          }
          const data = await response.json();

          department = data.region || 'Indisponible';
          city = data.city || 'Indisponible';
          latitude = data.latitude || 'Indisponible';
          longitude = data.longitude || 'Indisponible';

          document.getElementById('city').textContent = `Ville: ${city}`;

          // Initialise la carte avec la position de l'utilisateur
          initialiserCarte(latitude, longitude);

          // Récupére les stations Velolib
          fetchVelolibStations();

          // Récupére les données de qualité de l'air
          fetchAirQualityData();
          fetchWeatherData(latitude, longitude);
      } catch (error) {
          document.getElementById('city').textContent = 'Ville: Erreur';
          console.error('Error retrieving location:', error);
      }
  }

  // Fonction pour initialiser la carte Leaflet
  function initialiserCarte(lat, lon) {
      map = L.map('map').setView([lat, lon], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const userIcon = L.icon({
          iconUrl: 'https://img.icons8.com/ios/452/user-location.png', 
          iconSize: [40, 40],  
          iconAnchor: [20, 40],  
          popupAnchor: [0, -40]  
      });

      L.marker([lat, lon], { icon: userIcon }).addTo(map)
          .bindPopup("Vous êtes ici !")
          .openPopup();
  }
  async function fetchVelolibStations() {
      try {
          // latitude et longitude
          const stationInfoResponse = await axios.get('https://api.cyclocity.fr/contracts/nancy/gbfs/station_information.json');
          const stationInfo = stationInfoResponse.data.data.stations;

          // disponibilité des vélos et des places
          const stationStatusResponse = await axios.get('https://api.cyclocity.fr/contracts/nancy/gbfs/station_status.json');
          const stationStatus = stationStatusResponse.data.data.stations;

          const stationStatusMap = {};
          stationStatus.forEach(station => {
              stationStatusMap[station.station_id] = station;
          });

          // Ajoute chaque station sur la carte
          stationInfo.forEach(station => {
              const stationStatusData = stationStatusMap[station.station_id];
              const { lat, lon, name } = station;
              const num_bikes_available = stationStatusData ? stationStatusData.num_bikes_available : 0;
              const num_docks_available = stationStatusData ? stationStatusData.num_docks_available : 0;

              // Ajoute un marqueur pour chaque station
              const popupContent = `
                  <strong>${name}</strong><br>
                  Vélos disponibles: ${num_bikes_available}<br>
                  Places disponibles: ${num_docks_available}
              `;
              L.marker([lat, lon]).addTo(map)
                  .bindPopup(popupContent);
          });
      } catch (error) {
          console.error('Error fetching Velolib stations:', error);
      }
  }

  // Fonction pour récupérer les données de qualité de l'air
  async function fetchAirQualityData() {
      try {
          const airQualityResponse = await axios.get('https://services3.arcgis.com/Is0UwT37raQYl9Jj/arcgis/rest/services/ind_grandest/FeatureServer/0/query?where=lib_zone%3D%27Nancy%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=');

          const airQualityData = airQualityResponse.data.features[0].attributes;
          const airQualityIndex = airQualityData['index'];

          let airQuality = '';

          if (airQualityIndex <= 50) {
              airQuality = 'Bonne';
          } else if (airQualityIndex <= 100) {
              airQuality = 'Moyenne';
          } else {
              airQuality = 'Mauvaise';
          }


          const airQualityMessage = document.getElementById('airQualityMessage');
          airQualityMessage.textContent = `Qualité de l'air: ${airQuality}`; 
          const airQualityDiv = document.getElementById('airQuality');
          if (airQuality === 'Bonne') {
              airQualityDiv.className = 'good';
          } else if (airQuality === 'Moyenne') {
              airQualityDiv.className = 'average';
          } else {
              airQualityDiv.className = 'bad';
          }
      } catch (error) {
          console.error('Error fetching air quality data:', error);
      }
  }
  async function fetchWeatherData(lat, long) {
      try {
          const weatherResponse = await axios.get(`https://www.infoclimat.fr/public-api/gfs/json?_ll=${lat},${long}&_auth=ARsDFFIsBCZRfFtsD3lSe1Q8ADUPeVRzBHgFZgtuAH1UMQNgUTNcPlU5VClSfVZkUn8AYVxmVW0Eb1I2WylSLgFgA25SNwRuUT1bPw83UnlUeAB9DzFUcwR4BWMLYwBhVCkDb1EzXCBVOFQoUmNWZlJnAH9cfFVsBGRSPVs1UjEBZwNkUjIEYVE6WyYPIFJjVGUAZg9mVD4EbwVhCzMAMFQzA2JRMlw5VThUKFJiVmtSZQBpXGtVbwRlUjVbKVIuARsDFFIsBCZRfFtsD3lSe1QyAD4PZA%3D%3D&_c=19f3aa7d766b6ba91191c8be71dd1ab2`);
          const weatherData = weatherResponse.data;

          const currentDate = new Date();
          const currentHour = currentDate.getHours();
          const formattedDate = currentDate.toISOString().split('T')[0]; // Format date "YYYY-MM-DD"

          const hour8Data = weatherData[`${formattedDate} 07:00:00`];
          const hour13Data = weatherData[`${formattedDate} 13:00:00`];
          const hour19Data = weatherData[`${formattedDate} 19:00:00`];

          if (currentHour < 11) {
              displayWeather(hour8Data, 7);

          } else if (currentHour < 16) {

              displayWeather(hour13Data, 13);

          } else {
              displayWeather(hour19Data, 19);
          }
      } catch (error) {
      }
  }

  // Fonction pour afficher la météo dans la div
  function displayWeather(weatherData, hour) {
      if (weatherData) {
          const temperature = (weatherData.temperature["2m"] - 273.15).toFixed(1);  // Conversion Kelvin -> Celsius
          const windSpeed = weatherData.vent_moyen["10m"].toFixed(1);
          document.getElementById('weatherDuJour').textContent = '';
          if (hour === 7) {
              document.getElementById('weatherDuJour').textContent = `Ce matin: Temp: ${temperature}°C, Vent: ${windSpeed} km/h`;
          } else if (hour === 13) {
              document.getElementById('weatherDuJour').textContent = `Ce midi: Temp: ${temperature}°C, Vent: ${windSpeed} km/h`;
          } else {
              document.getElementById('weatherDuJour').textContent = `Ce soir: Temp: ${temperature}°C, Vent: ${windSpeed} km/h`;
          }
      }
  }

  fetchLocation();