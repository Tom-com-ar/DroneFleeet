const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

/* Socket.io */
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

const PORT = 3000;

/* Importar datos de drones */
const drones = require("./drones");
const { entregas, crearEntrega, completarEntrega } = require("./entregas");

/* Endpoint REST */
app.get("/api/drones", (req, res) => {
  res.json(drones);
});

app.get("/api/entregas", (req, res) => {
  res.json(entregas);
});

app.get("/api/drones/disponibles", (req, res) => {
  const disponibles = drones.filter(drone => drone.estado === "disponible" && drone.bateria > 20);
  res.json(disponibles);
});


app.post("/api/entregas", (req, res) => {
  const { droneId, destino, paquete, peso } = req.body;

  if (!droneId || !destino || typeof destino.lat !== "number" || typeof destino.lng !== "number" || !paquete || typeof peso !== "number") {
    return res.status(400).json({ error: "Faltan campos obligatorios o formato inválido." });
  }

  const drone = drones.find((d) => d.id === droneId);
  if (!drone) {
    return res.status(404).json({ error: "Drone no encontrado." });
  }

  if (drone.estado !== "disponible") {
    return res.status(400).json({ error: "El drone no está disponible." });
  }

  if (drone.bateria <= 20) {
    return res.status(400).json({ error: "El drone no tiene suficiente batería." });
  }

  drone.estado = "en_vuelo";
  drone.entregasRealizadas += 1; // Incrementar contador de entregas
  const entrega = crearEntrega({ droneId, destino, paquete, peso });

  io.emit("actualizacionDrones", drones);
  io.emit("entrega-asignada", { entrega, drone }); // Notificación de asignación

  // Programar completación de la entrega
  setTimeout(() => {
    completarEntrega(entrega.id, drones, io);
  }, entrega.tiempoEstimado * 1000);

  return res.status(201).json({ entrega, drone, entregas });
});

/* Cliente conectado */
io.on("connection", (socket) => {
  console.log("Cliente conectado");

  /* manda datos iniciales apenas entra */
  socket.emit("actualizacionDrones", drones);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

/* Simulación */
function moverDrones() {
  drones.forEach(drone => {

    if (drone.estado === "mantenimiento") return;

    drone.ubicacion.lat += (Math.random() - 0.5) * 0.002;
    drone.ubicacion.lng += (Math.random() - 0.5) * 0.002;

    drone.velocidad = Math.floor(Math.random() * 60) + 10;

    if (drone.bateria > 0) {
      drone.bateria -= 1;
    }

    drone.distanciaRecorrida += Math.random() * 3;

    if (drone.bateria < 20) {
      io.emit("alerta-bateria-baja", drone);
    }
  });

  io.emit("actualizacionDrones", drones);

  console.log("Drones actualizados");
}

/* cada 2 segundos */
setInterval(moverDrones, 10000);

/* iniciar */
server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});