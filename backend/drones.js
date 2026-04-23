const drones = [
  {
    id: "drone-001",
    nombre: "EcoFlyer",
    estado: "disponible",
    bateria: 90,
    ubicacion: { lat: -34.6037, lng: -58.3816 },
    velocidad: 0,
    pesoMaximo: 5,
    entregasRealizadas: 0,
    distanciaRecorrida: 0
  },
  {
    id: "drone-002",
    nombre: "SkyFast",
    estado: "disponible",
    bateria: 65,
    ubicacion: { lat: -34.6010, lng: -58.3790 },
    velocidad: 0,
    pesoMaximo: 8,
    entregasRealizadas: 0,
    distanciaRecorrida: 0
  },
  {
    id: "drone-003",
    nombre: "AeroMax",
    estado: "disponible",
    bateria: 78,
    ubicacion: { lat: -34.6055, lng: -58.3840 },
    velocidad: 0,
    pesoMaximo: 6,
    entregasRealizadas: 0,
    distanciaRecorrida: 0
  },
  {
    id: "drone-004",
    nombre: "TurboWing",
    estado: "disponible",
    bateria: 100,
    ubicacion: { lat: -34.6070, lng: -58.3770 },
    velocidad: 0,
    pesoMaximo: 10,
    entregasRealizadas: 0,
    distanciaRecorrida: 0
  },
  {
    id: "drone-005",
    nombre: "RapidAir",
    estado: "disponible",
    bateria: 54,
    ubicacion: { lat: -34.6000, lng: -58.3825 },
    velocidad: 0,
    pesoMaximo: 7,
    entregasRealizadas: 0,
    distanciaRecorrida: 0
  }
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomDelta() {
  return (Math.random() - 0.5) * 0.0016;
}

function getDrones() {
  return drones.map(drone => ({ ...drone, ubicacion: { ...drone.ubicacion } }));
}

function tickDrones() {
  drones.forEach(drone => {
    if (drone.estado === "en_vuelo") {
      drone.ubicacion.lat = clamp(drone.ubicacion.lat + randomDelta(), -90, 90);
      drone.ubicacion.lng = clamp(drone.ubicacion.lng + randomDelta(), -180, 180);
      drone.velocidad = 15 + Math.round(Math.random() * 10);
      drone.bateria = clamp(drone.bateria - Math.random() * 3, 0, 100);
      if (drone.bateria <= 20) drone.estado = "regresando";
      if (Math.random() < 0.08) drone.entregasRealizadas += 1;
    }

    if (drone.estado === "regresando") {
      drone.ubicacion.lat = clamp(drone.ubicacion.lat + randomDelta() * 0.5, -90, 90);
      drone.ubicacion.lng = clamp(drone.ubicacion.lng + randomDelta() * 0.5, -180, 180);
      drone.velocidad = 10 + Math.round(Math.random() * 6);
      drone.bateria = clamp(drone.bateria - 1.6, 0, 100);
      if (drone.bateria <= 5) drone.estado = "cargando";
    }

    if (drone.estado === "cargando") {
      drone.velocidad = 0;
      drone.bateria = clamp(drone.bateria + 3, 0, 100);
      if (drone.bateria >= 90) {
        drone.estado = "disponible";
        drone.velocidad = 0;
      }
    }

    if (drone.estado === "disponible") {
      drone.velocidad = 0;
      if (drone.bateria < 100 && Math.random() < 0.1) {
        drone.bateria = clamp(drone.bateria - 0.2, 0, 100);
      }
    }
  });
}

module.exports = {
  getDrones,
  tickDrones,
};
