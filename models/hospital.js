const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var Image = new Schema({
	img: {
		data: Buffer,
		contentType: String
	}
});

const patient = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},

	password: {
		type: String,
		required: true
	},

	name: {
		type: String,
		required: true
	},

	contact: {
		type: String,
		required: true
	},
	age: {
		type: Number,
		required: true
	},
	gender: {
		type: String,
		required: true
	}
});

var hosptial = new Schema({
	name: {
		type: String,
		required: true
	},

	city: {
		type: String,
		required: true
	},

	state: {
		type: String,
		required: true
	},
	Url: {
		type: String
	},
	specs: {
		type: String
	},
	imageUrl: {
		type: Image
	},

	Patients: [
		{
			Patient: {
				type: patient
			},
			initial_time: {
				type: String
			},
			final_time: {
				type: String
			},
			desc: {
				type: String
			}
		}
	]
});

module.exports = mongoose.model("hosptial", hosptial);
