import "../src/style.css";
import { io } from "socket.io-client";
import { inicializarNotificaciones } from "./notificaciones.js";
import { bootMap, updateMapMarkers } from "./mapa.js";

const apiUrl = "http://localhost:3000/api/drones";
const socketUrl = "http://localhost:3000";

const socket = io(socketUrl);

let currentDrones = [];
let entregas = [];
let selectedDroneId = null;

let batteryChart;
let deliveryChart;

/* =========================
   SOCKET CONNECT
========================= */

socket.on("connect", async () => {
  console.log("✅ Conectado al servidor");

  try {
    const res = await fetch("http://localhost:3000/api/entregas");
    entregas = await res.json();
  } catch (err) {
    console.error("Error cargando entregas:", err);
  }
});

socket.on("disconnect", () => {
  console.log("🔌 Desconectado del servidor");
});

/* =========================
   SOCKET EVENTS
========================= */

socket.on("actualizacionDrones", (drones) => {
  updateDashboard(drones);
});

socket.on("drones", (drones) => {
  updateDashboard(drones);
});

socket.on("entrega-asignada", (data) => {
  const i = entregas.findIndex(e => e.id === data.entrega.id);
  if (i === -1) entregas.push(data.entrega);
  else entregas[i] = data.entrega;
});

socket.on("entrega-completada", (data) => {
  const i = entregas.findIndex(e => e.id === data.entrega.id);
  if (i !== -1) entregas[i].estado = "completada";
});

/* =========================
   UI HELPERS
========================= */

function batteryColor(v) {
  if (v > 50) return "#34d399";
  if (v > 20) return "#facc15";
  return "#f87171";
}

function displayStatus(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* =========================
   RENDER
========================= */

function renderDrones(drones) {
  const lista = document.getElementById("listaDrones");

  lista.innerHTML = drones.map(drone => {
    const entrega = entregas.find(
      e => e.droneId === drone.id && e.estado === "asignada"
    );

    let entregaTexto = "Sin entrega";

    if (entrega) {
      const tiempo = (Date.now() - new Date(entrega.creado)) / 1000;
      const restante = Math.max(0, entrega.tiempoEstimado - tiempo);
      entregaTexto = `${entrega.paquete} (${Math.ceil(restante)}s)`;
    }

    return `
      <div class="bg-slate-800 p-6 rounded-xl shadow">
        <h2 class="text-xl font-bold">${drone.nombre}</h2>
        <p>Estado: ${displayStatus(drone.estado)}</p>
        <p>Batería: ${drone.bateria}%</p>
        <p>Ubicación: ${drone.ubicacion.lat.toFixed(4)}, ${drone.ubicacion.lng.toFixed(4)}</p>
        <p>Velocidad: ${drone.velocidad} km/h</p>
        <p>Entregas: ${drone.entregasRealizadas}</p>
        <p class="text-sm text-slate-300">${entregaTexto}</p>
      </div>
    `;
  }).join("");
}

/* =========================
   DASHBOARD
========================= */

function updateDashboard(drones) {
  currentDrones = drones;

  renderDrones(drones);
  updateMapMarkers(drones);
  inicializarNotificaciones(socket);
}

/* =========================
   INIT
========================= */

async function cargarDrones() {
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    currentDrones = data;
    selectedDroneId = data[0]?.id || null;

    updateDashboard(data);
  } catch (err) {
    console.error("Error cargando drones:", err);
  }
}

/* =========================
   START
========================= */

bootMap();
cargarDrones();