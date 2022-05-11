const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const routes = require("./routes/index.js");
const axios = require("axios");

const { Activities, Country } = require("./db.js");

const server = express();
server.use(express.json());
server.use(morgan("dev"));
server.name = "API";

server.use(express.urlencoded({ extended: true, limit: "50mb" }));
server.use(express.json({ limit: "50mb" }));
server.use(cookieParser());
server.use(morgan("dev"));
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

server.use("/", routes);

server.get("/hola", (req, res) => {
  res.send("Hola");
});

//CARGO ELEMENTOS A LISTA POR POSTMAN
server.post("/activity", async (req, res) => {
  const { name, difficulty, duration, season } = req.body;
  try {
    const newActivity = await Activities.create({
      name,
      difficulty,
      duration,
      season,
    });
    res.json(newActivity);
  } catch (e) {
    res.send(e.message);
  }
});

//CARGO LOS PAISES A LA BASE DE DATOS
let CargarPais = function () {
  axios.get("https://restcountries.com/v3/all").then(async (r) => {
    for (const element of r.data) {
      console.log(element.capital);
      try {
        const newCountry = await Country.create({
          id: element.cca3,
          name: element.translations.spa.common
            ? element.translations.spa.common
            : element.name.common,
          img: element.flags[1],
          continent: element.continents[0] || "Sin continente",
          capital: element.capital ? element.capital[0] : "Sin capital",
          subregion: element.subregion,
          area: element.area,
          population: element.population,
        });
      } catch (e) {
        throw new Error(e);
      }
    }
  });
};
server.get("/countries", (req, res) => {
  CargarPais();
  res.send("Aca tendria que aparecer los paises");
  //FALTA HACER UN LISTDO DE PAISES
});

//MOSTRAR INFORMACION DEL PAIS POR ID PARAMS
server.get("/countries/:idPais", async (req, res) => {
  try {
    let { idPais } = req.params;
    let pais = await Country.findByPk(idPais);
    res.json([pais.name, pais.img, pais.continent] || "No existe pais");
  } catch (e) {
    res.send(e);
  }
  //FALTA VINCULAR LA ID DE ACTIVIDADES AL PAIS Y MOSTRAR LA ACTIVIDAD
});

server.get("/countries", async (req, res) => {
  try {
    const { namePais } = req.query;
    const paisQuery = await Country.findByPk(namePais);
    if (!paisQuery) return "No existe ningun pais con ese nombre";
    return paisQuery;
  } catch (e) {
    res.send(e);
  }
});

// Error catching endware.
server.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const message = err.message || err;
  console.error(err);
  res.status(status).send(message);
});

module.exports = server;
