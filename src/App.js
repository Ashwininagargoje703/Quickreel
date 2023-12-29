import React, { useState, useEffect } from "react";
import { fabric } from "fabric";
import * as faceapi from "face-api.js";
import "./App.css"; // Import your CSS file for styling

const UploadVideoComponent = () => {
  const [video, setVideo] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [videoElement, setVideoElement] = useState(null);

  useEffect(() => {
    if (video) {
      renderVideoOnCanvas(video);
      detectFaces(video);
    }
  }, [video]);

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    const videoObject = document.createElement("video");
    videoObject.src = URL.createObjectURL(file);
    videoObject.onloadedmetadata = () => {
      setVideo(videoObject);
      setVideoElement(videoObject);
    };
  };

  const renderVideoOnCanvas = (video) => {
    const canvasElement = new fabric.Canvas("video-canvas", {
      width: video.videoWidth,
      height: video.videoHeight,
    });
    canvasElement.add(
      new fabric.Image(video, {
        left: 0,
        top: 0,
        width: video.videoWidth,
        height: video.videoHeight,
      })
    );
    setCanvas(canvasElement);
  };

  const detectFaces = async (videoElement) => {
    const canvasElement = document.getElementById("video-canvas");

    // Load Face-api models from the public/models directory
    await faceapi.nets.tinyFaceDetector.loadFromUri("../models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("../models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("../models");
    await faceapi.nets.faceExpressionNet.loadFromUri("../models");

    const displaySize = {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    };
    faceapi.matchDimensions(canvasElement, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear canvas before drawing rectangles
      const context = canvasElement.getContext("2d");
      context.clearRect(0, 0, canvasElement.width, canvasElement.height);

      resizedDetections.forEach((detection) => {
        const { box } = detection.detection;
        const drawBox = new fabric.Rect({
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          stroke: "blue", // Blue color border
          strokeWidth: 4, // 4px width
          fill: "transparent",
          selectable: false,
        });
        canvas.add(drawBox);
      });
    }, 100); // Adjust interval for face detection
  };

  const playPauseVideo = () => {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  return (
    <div className="container">
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      <button className="control-button" onClick={playPauseVideo}>
        Play/Pause
      </button>
      {video && (
        <div className="video-container">
          <video controls loop ref={(ref) => setVideoElement(ref)}>
            <source src={video.src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      <canvas id="video-canvas" />
    </div>
  );
};

export default UploadVideoComponent;
