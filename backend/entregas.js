const entregas = [];

function crearEntrega({ droneId, destino, paquete, peso }) {
  const tiempoEstimado = Math.floor(Math.random() * 30 + 30); // 30-60 segundos
  const nuevaEntrega = {
    id: `entrega-${Date.now()}`,
    droneId,
    destino,
    paquete,
    peso,
    estado: "asignada",
    tiempoEstimado,
    creado: new Date().toISOString()
  };
  entregas.push(nuevaEntrega);
  return nuevaEntrega;
}

function completarEntrega(entregaId, drones, io) {
  const entrega = entregas.find(e => e.id === entregaId);
  if (!entrega || entrega.estado !== "asignada") return;

  entrega.estado = "completada";
  const drone = drones.find(d => d.id === entrega.droneId);
  if (drone) {
    drone.estado = "disponible";
    io.emit("entrega-completada", { entrega, drone });
    io.emit("actualizacionDrones", drones);

    // Después de 15 segundos, notificar que está listo para nueva asignación
    setTimeout(() => {
      io.emit("drone-listo", { drone });
    }, 15000);
  }
}

module.exports = {
  entregas,
  crearEntrega,
  completarEntrega
};
