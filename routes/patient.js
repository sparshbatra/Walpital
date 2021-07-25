const express = require("express");
const routes = express.Router();
const LocalStorage = require("node-localstorage").LocalStorage;
const localStorage = new LocalStorage("./scratch");
const Patient = require("../models/patient.js");
const bcrypt = require("bcrypt");
const secret = require("../config/key").secret;
const jwt = require("jsonwebtoken");
const { generateToken, verifyToken, getUsername } = require("./verify");
const Hosptial = require("../models/hospital");
const dateFormat = require("dateformat");
const moment = require("moment");
var isEqual = require("lodash.isequal");

routes.get("/", (req, res) => {
	res.render("patient", {
		message: '',
		flag: '0'
	});
});
routes.post("/", async (req, res) => {
	try {
		// console.log(req.body);
		var user = await Patient.findOne({ username: req.body.username }).exec();
		// console.log(user);

		if (!user) {
			// console.log("wrong username");
			return res.render("patient", { message: "The username does not exist", flag: '1' });
		}

		if (!bcrypt.compareSync(req.body.password, user.password)) {
			// console.log("wrong password");
			return res.render("patient", { message: "the password in invalid", flag: '1' });
		}

		await generateToken(res, user.username, user._id);
		res.redirect("/patient/getLocation");
	} catch (error) {
		// console.log(error);
		return res.render("patient", { message: "error in token", flag: '1' });
	}
});
routes.get("/register", (req, res) => {
	res.render("register.ejs",{message:'',flag:'0'});
});
routes.post("/register", (req, res) => {
	const { username, password, name, contact, age, gender } = req.body;
	// console.log(req.body);
	let errors = [];
	Patient.findOne({ username: username })
		.then(user => {
			if (user) {
				res.render("register", {
					message: "username already exist",
					flag: '1'
				});
			} else {
				const newPatient = new Patient({
					username,
					password,
					name,
					contact,
					age,
					gender
				});
				bcrypt.genSalt(10, (err, salt) => {
					bcrypt.hash(newPatient.password, salt, (err, hash) => {
						if (err) {
							throw err;
						}
						newPatient.password = hash;

						newPatient.save((err, newUser) => {
							if (err) {
								res.render("register", {
									message: "ERROR DURING REGISTRATION", flag: '1'
								});
							} else {
								// console.log(newUser);
								generateToken(res, newUser.username, newUser._id)
								res.redirect("/patient/getLocation");
							}
						});
					});
				});
			}
		})
		.catch(err => {
			res.render("register", {
				message: "SOMETHING WENT WRONG",
				flag: '1'
			});
		});
});
routes.get("/getLocation", verifyToken, (req, res) => {
	res.render("location", {
		message: '',
		flag: '0'
	});
});

routes.post("/getLocation", verifyToken, (req, res) => {
	const city = req.body.city.toLowerCase();
	const state = req.body.state.toLowerCase();
	console.log(city, state);
	if (!city || !state) {
		res.render("location", { message: "error in location sending", flag: '1' });

	}
	Hosptial.find({ city: city, state: state }, (err, docs) => {
		if (err) {
			res.render("location", { message: "error in location sending", flag: '1' });
		}
		res.render("hospitals", { docs: docs });
	});
});

routes.get("/getLocation/hospital_detail", verifyToken, (req, res) => {
	const id = req.query.id;
	// console.log(id);
	if (!id) {
		res.redirect('/patient');
	}
	else {
		const username = req.user.username;
		Hosptial.findOne({ _id: id }).then(docs => {
			if (!docs) {
				res.render("hospitals", { docs: docs, message: "error", flag: '1' });
			}
			// console.log(docs.Patients);
			const d1 = docs.Patients.filter(element => {
				// console.log(String(user._id) == String(element.Patient._id));
				console.log((dateFormat(Date.now(),"HH:mm")))
				if (String(element.Patient.final_time) < moment(Date.now(), "HH:mm").format("HH:mm")) return true;
			});
			//console.log(d1);
			for (var i = 0; i < d1.length; i++) {
				const index = docs.Patients.indexOf(d1[0]);
				console.log(index)
				if (index >= 0) docs.Patients.splice(index, 1);
			}
			docs.save('done');
			res.render("hospital_detail", {
				docs: docs.Patients,
				id: id,
				username: username,
				message: "",
				flag: '0'

			});
		});
	}
});

function intersect(x1, y1, x2, y2) {
	if (x1 <= x2 && x2 <= y1) {
		return true;
	} else if (x1 <= y2 && y2 <= y1) {
		return true;
	} else if (x2 <= x1 && x1 <= y2) {
		return true;
	} else if (x2 <= y1 && y1 <= y2) {
		return true;
	} else {
		return false;
	}
}
routes.post("/getLocation/hospital_detail_delete", verifyToken, (req, res) => {
	const username = req.user.username;
	console.log(username)
	const id = req.query.id;
	if (!id || !username) {
		res.redirect('/patient');
	}
	else {
		Patient.findOne({ username: username }).then(user => {
			if (user) {
				Hosptial.findOne({ _id: id }, (err, docs) => {
					if (err) {
						return res.json({ msg: "wrong input", flag: '1' });
					}
					else if (!docs) {

						res.render("hospital_detail", {

							docs: docs.Patients,
							id: id,
							username: username, flag: '1',
							message: "Some Error"
						});

					}
					else if (!docs.Patients) {
						res.render("hospital_detail", {

							docs: docs.Patients,
							id: id,
							username: username, flag: '1',
							message: "Some Error"
						});
					}
					// console.log(user);
					else {
						const d1 = docs.Patients.filter(element => {
							// console.log(String(user._id) == String(element.Patient._id));
							if (String(user._id) == String(element.Patient._id)) return true;
						});
						//console.log(d1);

						const index = docs.Patients.indexOf(d1[0]);
						console.log(index)
						if (index >= 0) docs.Patients.splice(index, 1);

						docs.save("done");
						//console.log(docs)

						res.render("hospital_detail", {
							docs: docs.Patients,
							id: id,
							username: username, flag: '0',
							message: "you are already have an appointment"
						});
					}
				});
			}
			else {
				res.render("hospital_detail", {

					docs: docs.Patients,
					id: id,
					username: username, flag: '1',
					message: "Some Error"
				});
			}
		})
			.catch((err) => {
				res.json({ "err": err });
			})
	}
});
routes.post("/getLocation/hospital_detail", verifyToken, async (req, res) => {
	const id = req.query.id;
	const desc = req.body.desc;
	// console.log(req.body.time);
	const initial_time = req.body.time;
	const final_time = moment(initial_time, "HH:mm")
		.add(30, "minutes")
		.format("HH:mm");
	// console.log(final_time);
	const token = req.cookies.token || "";
	const decrypt = await jwt.verify(token, secret);
	const username = decrypt.username;
	Patient.findOne({ username: username }).then(user => {
		if (user) {
			Hosptial.findOne({ _id: id }, (err, docs) => {
				if (err) {
					return res.render("hospital_detail", {
						docs: docs.Patients,
						id: id,
						username: username, flag: '1',
						message: "Some Error"
					});
				}
				if (!docs) {

					return res.render("hospital_detail", {
						docs: docs.Patients,
						id: id,
						username: username, flag: '1',
						message: ""
					});
				}
				else if (!docs.Patients) {

					return res.render("hospital_detail", {
						docs: docs.Patients,
						id: id,
						username: username, flag: '1',
						message: "No patient"
					});
				}
				else {
					var flag = 0;
					for (var i = 0; i < docs.Patients.length; i++) {
						if (
							intersect(
								docs.Patients[i].initial_time,
								docs.Patients[i].final_time,
								initial_time,
								final_time
							)
						) {
							flag = 1;
							return res.render("hospital_detail", {
								docs: docs.Patients,
								id: id,
								username: username,
								message: "Intersecting times",
								flag: '1'
							});
							break;
						}
					}

					if (flag) {

					}
					else {
						const d1 = docs.Patients.filter(element => {
							// console.log(String(user._id) == String(element.Patient._id));
							if (String(user._id) == String(element.Patient._id)) return true;
						});

						const index = docs.Patients.indexOf(d1[0]);
						// console.log(index)
						if (index >= 0) {

							return res.render("hospital_detail", {
								docs: docs.Patients,
								id: id,
								username: username, flag: '1',
								message: "you already have an appointment"
							});
						}
						else {
							// console.log(user);
							docs.Patients.push({
								Patient: user,
								initial_time: initial_time,
								final_time: final_time,
								desc: desc
							});
							docs.save("done");
							res.render("hospital_detail", {
								docs: docs.Patients,
								id: id,
								username: username, flag: '2',
								message: 'Successfully added'
							});
						}
					}
				}
			});

		} else {

			res.json({ "msg": "some error restart from login page" });
			// console.log("user not found");
		}
	});
});

module.exports = routes;
