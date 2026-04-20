// ==========================================
// 1. IMPORTACIONES
// ==========================================
import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  GeoPoint,
} from "firebase/firestore";

// ==========================================
// 2. INICIALIZACIÓN DEL MAPA
// ==========================================

const coordenadasPueblo = [-49.3069, -67.7297];
const map = L.map("map").setView(coordenadasPueblo, 15);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// ==========================================
// 3. CARGA DE DATOS DESDE FIREBASE
// ==========================================

let listaDEAs = [];

async function loadDefibrillators() {
  try {
    const q = query(
      collection(db, "defibrillators"),
      where("status", "==", "approved"),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("⚠️ No se encontraron DEAs aprobados en la base de datos.");
      return;
    }

    querySnapshot.forEach((doc) => {
      const dea = doc.data();

      if (!dea.location) {
        console.error(
          `❌ Error en el DEA '${dea.name}': Falta el campo 'location' (geopoint).`,
        );
        return;
      }

      const latitud = dea.location.latitude;
      const longitud = dea.location.longitude;

      const marker = L.marker([latitud, longitud]).addTo(map);

      const popupContent = `
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 5px 0; color: #d32f2f;">${dea.name}</h3>
          <p style="margin: 0 0 5px 0;"><strong>📍 Dirección:</strong> ${dea.address}</p>
          <p style="margin: 0 0 5px 0;"><strong>⏰ Horario:</strong> ${dea.access_hours} 
            ${dea.is_24_7 ? "🟢 (24/7)" : ""}
          </p>
          ${dea.description ? `<p style="margin: 0; font-size: 0.9em; color: #555;">ℹ️ ${dea.description}</p>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);

      listaDEAs.push({
        datos: dea,
        marcador: marker,
        coordenadas: L.latLng(latitud, longitud),
      });
    });

    console.log("✅ ¡Puntos cargados en el mapa!");
  } catch (error) {
    console.error("🚨 Error al cargar los datos:", error);
  }
}

loadDefibrillators();

// ==========================================
// 4. FUNCIÓN: ENCONTRAR EL DEA MÁS CERCANO
// ==========================================
document.getElementById("btn-nearest").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  const btn = document.getElementById("btn-nearest");
  const textoOriginal = btn.innerText;
  btn.innerText = "Buscando...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const userUbicacion = L.latLng(userLat, userLng);

      L.circleMarker(userUbicacion, { color: "blue", radius: 8 })
        .addTo(map)
        .bindPopup("¡Estás aquí!")
        .openPopup();

      let deaMasCercano = null;
      let distanciaMinima = Infinity;

      listaDEAs.forEach((item) => {
        const distancia = map.distance(userUbicacion, item.coordenadas);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          deaMasCercano = item;
        }
      });

      if (deaMasCercano) {
        map.flyTo(deaMasCercano.coordenadas, 16);
        deaMasCercano.marcador.openPopup();

        btn.innerText = textoOriginal;

        const distanciaTexto =
          distanciaMinima > 1000
            ? `${(distanciaMinima / 1000).toFixed(1)} km`
            : `${Math.round(distanciaMinima)} metros`;

        alert(`El DEA más cercano está a ${distanciaTexto}.`);
      }
    },
    (error) => {
      console.error(error);
      btn.innerText = textoOriginal;
      alert(
        "No pudimos obtener tu ubicación. Revisa los permisos de GPS de tu dispositivo.",
      );
    },
  );
});

// ==========================================
// 5. FUNCIÓN: GUARDAR NUEVO DEA POR DIRECCIÓN
// ==========================================
document
  .getElementById("btn-guardar-dea")
  .addEventListener("click", async () => {
    const nombre = document.getElementById("input-nombre").value;
    const direccion = document.getElementById("input-direccion").value;
    const mensaje = document.getElementById("mensaje-admin");

    if (!nombre || !direccion) {
      mensaje.innerText = "⚠️ Por favor completa ambos campos.";
      return;
    }

    mensaje.innerText = "🔍 Buscando coordenadas...";

    try {
      const urlBusqueda = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;
      const respuesta = await fetch(urlBusqueda);
      const resultados = await respuesta.json();

      if (resultados.length === 0) {
        mensaje.innerText =
          "❌ No se encontró la dirección. Intenta agregar tu ciudad al final (Ej: San Martin 123, Mi Pueblo).";
        return;
      }

      const latEncontrada = parseFloat(resultados[0].lat);
      const lonEncontrada = parseFloat(resultados[0].lon);

      mensaje.innerText = "☁️ Guardando en la nube...";
      await addDoc(collection(db, "defibrillators"), {
        name: nombre,
        address: direccion,
        access_hours: "Horario a confirmar",
        is_24_7: false,
        status: "approved",
        location: new GeoPoint(latEncontrada, lonEncontrada),
      });

      mensaje.style.color = "green";
      mensaje.innerText = "✅ ¡DEA guardado! Recarga la página para verlo.";

      document.getElementById("input-nombre").value = "";
      document.getElementById("input-direccion").value = "";
    } catch (error) {
      console.error("Error al guardar:", error);
      mensaje.style.color = "red";
      mensaje.innerText = "❌ Ocurrió un error al guardar.";
    }
  });
