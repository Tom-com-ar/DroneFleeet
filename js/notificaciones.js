export function mostrarNotificacion(mensaje, tipo = "info") {
  const colores = {
    info: "bg-slate-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500"
  };

  const notificacion = document.createElement("div");
  notificacion.className = `${colores[tipo]} text-white px-4 py-2 rounded-lg shadow-lg mb-2 transition-opacity duration-300`;
  notificacion.style.backgroundColor = notificacion.style.backgroundColor || "rgba(15, 23, 42, 0.95)";
  notificacion.style.backdropFilter = "blur(10px)";
  notificacion.style.border = "1px solid rgba(255,255,255,0.08)";
  notificacion.textContent = mensaje;

  const contenedor = document.getElementById("notificaciones") || document.body;
  contenedor.appendChild(notificacion);

  setTimeout(() => {
    notificacion.style.opacity = "0";
    setTimeout(() => notificacion.remove(), 300);
  }, 5000);
}

export function inicializarNotificaciones(socket) {
  socket.on("entrega-asignada", (data) => {
    const { entrega, drone } = data;
    mostrarNotificacion(`Entrega asignada: ${entrega.paquete} a ${drone.nombre} (Tiempo estimado: ${entrega.tiempoEstimado}s)`, "success");
  });

  socket.on("alerta-bateria-baja", (drone) => {
    mostrarNotificacion(`BATERÍA CRÍTICA: ${drone.nombre} (${drone.bateria}%)`, "error");
  });

  socket.on("entrega-completada", (data) => {
    const { entrega, drone } = data;
    mostrarNotificacion(`Entrega completada: ${entrega.paquete} por ${drone.nombre}`, "success");
  });

  socket.on("drone-listo", (data) => {
    const { drone } = data;
    mostrarNotificacion(`${drone.nombre} está listo para nueva asignación`, "info");
  });
}