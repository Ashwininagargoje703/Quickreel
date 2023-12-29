import { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";
import { fabric } from "fabric";

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const fabricCanvasRef = useRef(null);
  const interval = useRef();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);
    }
  }, []);

  const drawRect = (left, top, width, height) => {
    const rect = new fabric.Rect({
      left,
      top,
      width,
      height,
      fill: "transparent",
      stroke: "blue",
      strokeWidth: 2,
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.renderAll();
  };

  const clearCanvas = () => {
    fabricCanvasRef.current.clear();
  };

  const handlePlayPause = () => {
    const video = videoRef.current;

    if (video.paused || video.ended) {
      video
        .play()
        .then(() => {
          loadModels();
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Failed to start the video:", error);
        });
    } else {
      video.pause();
      setIsPlaying(false);
      clearCanvas();
      clearInterval(interval.current);
    }
  };

  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
    detectFaces();
  };

  const detectFaces = () => {
    interval.current = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      clearCanvas();

      faceapi.matchDimensions(canvasRef.current, {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });

      const resized = faceapi.resizeResults(detections, {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });

      resized.forEach(({ detection }) => {
        const { _x, _y, _width, _height } = detection.box;
        drawRect(_x, _y, _width, _height);
      });

      // Other drawing code for landmarks and expressions can be added here
    }, 1000);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      videoRef.current.src = videoURL;
      videoRef.current.load();

      videoRef.current.onloadedmetadata = () => {
        loadModels();
      };
    }
  };

  return (
    <div className="container">
      <div>
        <input type="file" accept="video/*" onChange={handleFileChange} />
        <button onClick={handlePlayPause} className="control-button">
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
      <div className="video-container">
        <video
          style={{ position: "absolute" }}
          width={450}
          height={450}
          crossOrigin="anonymous"
          ref={videoRef}
        ></video>
        <canvas
          style={{ position: "absolute" }}
          ref={canvasRef}
          width={450}
          height={450}
        />
      </div>
    </div>
  );
}

export default App;
