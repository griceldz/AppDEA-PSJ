import "./style.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { db } from "./firebase.js";

import { collection, getDocs, query, where } from "firebase/firestore";

const coordenadasPueblo = [-49.3069, -67.7297];
const map = L.map("map").setView(coordenadasPueblo, 15);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

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
      console.log("✅ Encontré un DEA en Firebase:", dea);

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
    });
  } catch (error) {
    console.error("🚨 Error al cargar los datos:", error);
  }
}

loadDefibrillators();
