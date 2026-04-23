import "../src/style.css";
import { io } from "socket.io-client";
import { inicializarNotificaciones } from "./notificaciones.js";

const socket = io("http://localhost:3000");
let entregas = []; // Variable global para entregas

/* conexión */
socket.on("connect", async () => {
  console.log("✅ Conectado al servidor");

  // Cargar entregas iniciales
  try {
    const respuesta = await fetch("http://localhost:3000/api/entregas");
    entregas = await respuesta.json();
  } catch (error) {
    console.error("Error cargando entregas:", error);
  }
});

socket.on("disconnect", () => {
  console.log("🔌 Desconectado del servidor");
});

/* inicializar notificaciones */
inicializarNotificaciones(socket);

/* recibe actualizaciones cada 2 segundos */
socket.on("actualizacionDrones", (drones) => {
  renderDrones(drones);
});

/* actualizar entregas */
socket.on("entrega-asignada", (data) => {
  // Agregar o actualizar la entrega
  const index = entregas.findIndex(e => e.id === data.entrega.id);
  if (index === -1) {
    entregas.push(data.entrega);
  } else {
    entregas[index] = data.entrega;
  }
});

socket.on("entrega-completada", (data) => {
  // Marcar como completada
  const index = entregas.findIndex(e => e.id === data.entrega.id);
  if (index !== -1) {
    entregas[index].estado = "completada";
  }
});


/* render */
function renderDrones(drones) {
  const lista = document.getElementById("listaDrones");

  lista.innerHTML = drones.map(drone => {
    const entregaActual = entregas.find(e => e.droneId === drone.id && e.estado === "asignada");
    let entregaTexto = "Entrega: Ninguna";
    if (entregaActual) {
      const tiempoTranscurrido = (Date.now() - new Date(entregaActual.creado)) / 1000;
      const tiempoRestante = Math.max(0, entregaActual.tiempoEstimado - tiempoTranscurrido);
      entregaTexto = `Entrega: ${entregaActual.paquete} - Tiempo restante: ${Math.ceil(tiempoRestante)}s`;
    }

    return `
    <div class="bg-slate-800 p-6 rounded-xl shadow ">
      <h2 class="text-2xl font-bold">${drone.nombre}</h2> 
      <p>ID: ${drone.id}</p>
      <p>Estado: ${drone.estado}</p>
      <p>Batería: ${drone.bateria}%</p>
      <p>Ubicación: (${drone.ubicacion.lat.toFixed(4)}, ${drone.ubicacion.lng.toFixed(4)})</p>
      <p>Velocidad: ${drone.velocidad} km/h</p>
      <p>Peso Máximo: ${drone.pesoMaximo} kg</p>
      <p>Entregas: ${drone.entregasRealizadas}</p>
      <p>Distancia: ${drone.distanciaRecorrida.toFixed(1)} km</p>
      <p class="text-sm text-slate-300">${entregaTexto}</p>
    </div>
  `;}).join("");
}