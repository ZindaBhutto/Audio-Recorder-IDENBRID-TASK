import React, { useState, useEffect } from "react";
import axios from "axios";
import AudioPlayer from "react-audio-player";

function App() {
	const [audios, setAudios] = useState([]);
	const [recording, setRecording] = useState(false);
	const [audioURL, setAudioURL] = useState("");

	const baseURL = "http://localhost:5000/api/audios";

	useEffect(() => {
		fetchAudios();
	}, []);

	const fetchAudios = async () => {
		try {
			const response = await axios.get(baseURL);
			setAudios(response.data);
		} catch (error) {
			console.log(error);
		}
	};

	const startRecording = () => {
		setRecording(true);
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				const mediaRecorder = new MediaRecorder(stream);
				const audioChunks = [];

				mediaRecorder.addEventListener("dataavailable", (event) => {
					audioChunks.push(event.data);
				});

				mediaRecorder.addEventListener("stop", () => {
					const audioBlob = new Blob(audioChunks);
					const audioURL = URL.createObjectURL(audioBlob);
					setAudioURL(audioURL);
				});

				mediaRecorder.start();

				setTimeout(() => {
					mediaRecorder.stop();
					stream.getTracks().forEach((track) => track.stop());
					setRecording(false);
				}, 5000); // Adjust the duration of the recording here (in milliseconds)
			})
			.catch((error) => {
				console.log(error);
				setRecording(false);
			});
	};

	const saveAudio = async () => {
		try {
			await axios.post(baseURL, { audioURL });
			fetchAudios();
			setAudioURL("");
		} catch (error) {
			console.log(error);
		}
	};

	const handleDownload = async (audioId, filename) => {
		try {
			const response = await axios.get(`${baseURL}/${audioId}/download`, {
				responseType: "blob",
			});

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", filename);
			document.body.appendChild(link);

			link.click();

			link.parentNode.removeChild(link);
		} catch (error) {
			console.log(error);
		}
	};

	const deleteAudio = async (audioId) => {
		try {
			await axios.delete(`${baseURL}/${audioId}`);
			fetchAudios();
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div>
			<h1>IDENBRID Task (Audi Recorder)</h1>
			{recording ? (
				<button onClick={() => setRecording(false)}>Stop Recording</button>
			) : (
				<button onClick={startRecording}>Start Recording</button>
			)}
			{audioURL && (
				<div>
					<AudioPlayer src={audioURL} controls />
					<button onClick={saveAudio}>Save Audio</button>
				</div>
			)}
			<h2>Saved Audios</h2>
			{audios.map((audio) => (
				<div key={audio._id}>
					<AudioPlayer src={audio.audioURL} controls />
					<button onClick={() => handleDownload(audio._id, audio.fileName)}>
						Download
					</button>
					<button onClick={() => deleteAudio(audio._id)}>Delete</button>
				</div>
			))}
		</div>
	);
}

export default App;
