const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5000;

app.use(cors());

mongoose.connect("mongodb://localhost/audioDB", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => {
	console.log("Connected to the database");
});

const audioSchema = new mongoose.Schema({
	audioURL: String,
	fileName: String,
});
const Audio = mongoose.model("Audio", audioSchema);

const storage = multer.diskStorage({
	destination: "./uploads",
	filename: function (req, file, cb) {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
const upload = multer({ storage });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Could have made a separate folder of routes and api but since there was gonna be only one api so made it in a single file
app.get("/api/audios", async (req, res) => {
	try {
		const audios = await Audio.find();
		res.json(audios);
	} catch (error) {
		console.log(error);
		res.status(500).send("Could not fetch");
	}
});

app.post("/api/audios", upload.single("audio"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).send("No audio file provided!");
		}

		const { filename } = req.file;
		const audioURL = `${req.protocol}://${req.hostname}:${port}/uploads/${filename}`;
		const audio = new Audio({ audioURL });
		audio.fileName = filename;
		await audio.save();
		res.status(201).send("Audio saved successfully");
	} catch (error) {
		console.log(error);
		res.status(500).send("Could not save!");
	}
});

app.delete("/api/audios/:audioId", async (req, res) => {
	try {
		const audioId = req.params.audioId;

		const audio = await Audio.findById(audioId);
		if (!audio) {
			return res.status(404).send("Audio not found");
		}

		const filename = audio.fileName;

		await Audio.findByIdAndRemove(audioId);

		const filePath = path.join(__dirname, "uploads", filename);
		fs.unlinkSync(filePath);

		res.status(200).send("Audio deleted successfully");
	} catch (error) {
		console.log(error);
		res.status(500).send("An error occurred while deleting the audio");
	}
});

app.get("/api/audios/:audioId/download", async (req, res) => {
	try {
		const audio = await Audio.findById(req.params.audioId);
		console.log("broooo", audio.fileName);
		const filename = audio.fileName;
		if (!audio) {
			return res.status(404).send("Audio not found");
		}

		const filePath = path.join(__dirname, "uploads", filename);
		if (!fs.existsSync(filePath)) {
			return res.status(404).send("File not found");
		}

		res.download(filePath, (err) => {
			if (err) {
				console.log(err);
				res.status(500).send("An error occurred while downloading the file");
			}
		});
	} catch (error) {
		console.log(error);
		res.status(500).send("An error occurred");
	}
});

app.use("/uploads", express.static("uploads"));

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
