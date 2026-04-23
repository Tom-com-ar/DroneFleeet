const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const { getDrones, tickDrones } = require("./drones");
const { entregas, crearEntrega, completarEntrega } = require("./entregas");

const app = express();
const server = http.createServer(app);

const PORT = 3000;

/* Socket.io */
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

/* Ruta base */
app.get("/", (req, res) => {
  res.send("DroneFleet funcionando 🚁");
});

/* =========================
   ENDPOINTS REST
========================= */

app.get("/api/drones", (req, res) => {
  res.json(getDrones());
});

app.get("/api/entregas", (req, res) => {
  res.json(entregas);
});

app.get("/api/drones/disponibles", (req, res) => {
  const drones = getDrones();
  const disponibles = drones.filter(
    (d) => d.estado === "disponible" && d.bateria > 20
  );
  res.json(disponibles);
});

/* Crear entrega */
app.post("/api/entregas", (req, res) => {
  const { droneId, destino, paquete, peso } = req.body;

  if (
    !droneId ||
    !destino ||
    typeof destino.lat !== "number" ||
    typeof destino.lng !== "number" ||
    !paquete ||
    typeof peso !== "number"
  ) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const drones = getDrones();
  const drone = drones.find((d) => d.id === droneId);

  if (!drone) return res.status(404).json({ error: "Drone no encontrado" });

  if (drone.estado !== "disponible") {
    return res.status(400).json({ error: "Drone no disponible" });
  }

  if (drone.bateria <= 20) {
    return res.status(400).json({ error: "Batería insuficiente" });
  }

  drone.estado = "en_vuelo";
  drone.entregasRealizadas += 1;

  const entrega = crearEntrega({ droneId, destino, paquete, peso });

  io.emit("actualizacionDrones", drones);
  io.emit("entrega-asignada", { entrega, drone });

  setTimeout(() => {
    completarEntrega(entrega.id, drones, io);
  }, entrega.tiempoEstimado * 1000);

  res.status(201).json({ entrega, drone });
});

/* =========================
   SOCKET.IO
========================= */

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  socket.emit("actualizacionDrones", getDrones());

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

/* =========================
   SIMULACIÓN
========================= */

function moverDrones() {
  const drones = getDrones();

  drones.forEach((drone) => {
    if (drone.estado === "mantenimiento") return;

    drone.ubicacion.lat += (Math.random() - 0.5) * 0.002;
    drone.ubicacion.lng += (Math.random() - 0.5) * 0.002;

    drone.velocidad = Math.floor(Math.random() * 60) + 10;

    if (drone.bateria > 0) drone.bateria -= 1;

    drone.distanciaRecorrida += Math.random() * 3;

    if (drone.bateria < 20) {
      io.emit("alerta-bateria-baja", drone);
    }
  });

  io.emit("actualizacionDrones", drones);
}

/* cada 10 segundos */
setInterval(moverDrones, 10000);

/* tick adicional del sistema */
setInterval(() => {
  tickDrones();
  io.emit("drones", getDrones());
}, 3500);

/* =========================
   START SERVER
========================= */

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});