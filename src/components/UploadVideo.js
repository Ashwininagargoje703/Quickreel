import React, { useState, useEffect } from "react";
import { fabric } from "fabric";
import * as faceapi from "face-api.js";

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

    // Load Face-api models
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");

    const displaySize = {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    };
    faceapi.matchDimensions(canvasElement, displaySize);

    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Draw rectangles around detected faces
    resizedDetections.forEach((detection) => {
      const {
        detection: { box },
      } = detection;
      const drawBox = new fabric.Rect({
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        stroke: "green",
        strokeWidth: 2,
        fill: "transparent",
        selectable: false,
      });
      canvas.add(drawBox);
    });
  };

  const playPauseVideo = () => {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      {video && (
        <div style={{ height: 400, width: "100vw" }}>
          <video controls loop ref={(ref) => setVideoElement(ref)}>
            <source src={video.src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      <canvas id="video-canvas" />
      <button onClick={playPauseVideo}>Play/Pause</button>
    </div>
  );
};

export default UploadVideoComponent;
