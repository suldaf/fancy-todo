const { User } = require("../models");
const { compare } = require("../helpers/bcrypt");
const { generateToken } = require("../helpers/jwt");
const axios = require("axios");
const apiKey = process.env.API_WEATHER;

class UserController {
  static register(req, res, next) {
    const { email, password, location } = req.body;
    // console.log(req.body);
    User.create({ email, password, location })
      .then((user) => {
        res.status(201).json({
          msg: "Succes create a user",
          id: user.id,
          email: user.email,
        });
      })
      .catch((err) => {
        next(err);
      });
  }
  static login(req, res, next) {
    const { email, password } = req.body;

    User.findOne({
      where: { email },
    })
      .then((user) => {
        const compared = compare(password, user.password);
        if (!user || !compared) {
          throw {
            message: "Wrong Email or Password",
            status: 500,
            name: "Custom",
          };
        }

        const access_token = generateToken({
          id: user.id,
          email: user.email,
        });
        let weather = {};

        axios({
          method: "get",
          url: `http://api.weatherstack.com/current?access_key=${apiKey}&query=${user.location}`,
        }).then((response) => {
          const apiResponse = response.data;
          weather.location = apiResponse.location.name;
          weather.weatherStatus = apiResponse.current.weather_descriptions[0];
          weather.temperature = apiResponse.current.temperature;
          weather.url_img = apiResponse.current.weather_icons;
          res.status(200).json({ access_token, weather });
        });
      })
      .catch((err) => {
        next(err);
      });
  }
  static checkWeather(req, res, next) {
    const userId = +req.params.id;
    User.findOne({ where: { id: userId } })
      .then((user) => {
        if (!user)
          throw { message: "User not found", status: 404, name: "Custom" };
        axios({
          method: "get",
          url: `http://api.weatherstack.com/current?access_key=${apiKey}&query=${user.location}`,
        }).then((response) => {
          const apiResponse = response.data;
          res.json(apiResponse);
        });
      })
      .catch((err) => {
        next(err);
      });
  }
}

module.exports = UserController;
