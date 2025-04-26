import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import './App.css';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

function App() {
  const cameraRef = useRef(null);
  const analyserRef = useRef(null);
  const soundRef = useRef(null);
  const listenerRef = useRef(null);
  const sceneRef = useRef(null);
  const lineRef = useRef(null);
  const lineRef2 = useRef(null);
  const meshRef = useRef(null)

  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file && file.type === 'audio/mpeg') {
      // Clean up previous audio if exists
      document.getElementById("track-name").innerText = file.name; // Update the track name
      document.getElementById("input-overlay").style.display = "none"; // Hide the input overlay
      if (soundRef.current) {
        soundRef.current.stop();
        if (listenerRef.current) {
          cameraRef.current.remove(listenerRef.current);
        }
      }
      
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    } else {
      alert('Please select an MP3 file');
      event.target.value = '';
    }
  };

  const play = () => {
    if (!previewUrl) {
      console.log("No song selected");
      return;
    }

    // Clean up previous audio
    if (soundRef.current) {
      soundRef.current.stop();
      if (listenerRef.current) {
        cameraRef.current.remove(listenerRef.current);
      }
    }

    const listener = new THREE.AudioListener();
    cameraRef.current.add(listener);
    listenerRef.current = listener;

    const sound = new THREE.Audio(listener);
    soundRef.current = sound;

    const audioLoader = new THREE.AudioLoader();
    
    audioLoader.load(
      previewUrl, 
      (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);
        
        if (sound.context.state === 'suspended') {
          sound.context.resume().then(() => {
            sound.play();
            analyserRef.current = new THREE.AudioAnalyser(sound, 32);
          });
        } else {
          sound.play();
          analyserRef.current = new THREE.AudioAnalyser(sound, 32);
        }
      },
      undefined,
      (error) => {
        console.error('Audio loading error:', error);
      }
    );
  };

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const canvReference = document.getElementById("threeJSCanvas");
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvReference });

    renderer.setSize(window.innerWidth,window.innerHeight);


    const uniforms = {
      u_resolution: {type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
      u_time: {type: 'f', value: 0.0},
      u_frequency: {value: 0.0},
      u_color: { value: new THREE.Color(1, 1, 1) }
    }
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: document.getElementById('vertexshader').textContent,
      fragmentShader: document.getElementById('fragmentshader').textContent
    });
    const geometry = new THREE.IcosahedronGeometry(2, 10)
    const mesh = new THREE.Mesh(geometry, mat)
    scene.add(mesh)
    mesh.material.wireframe = true
    meshRef.current = mesh

    camera.position.z = 5;

    // Animation loop
    function animate() {
      uniforms.u_time.value += 0.01;
      meshRef.current.rotation.x += 0.001
      meshRef.current.rotation.y += 0.001
      if (analyserRef.current) {
        const data = analyserRef.current.getFrequencyData();
        const avg = analyserRef.current.getAverageFrequency();
        let mids = 0
        for (let i = 8; i < 12; i++) {
          mids += data[i]
        }
        mids /= 4
        meshRef.current.material.uniforms.u_color.value.setHSL(mids / 256, 1.0, 0.5);
        // meshRef.current.scale.x = analyserRef.current.getAverageFrequency() / 50
        // meshRef.current.scale.y = analyserRef.current.getAverageFrequency() / 50
        // meshRef.current.scale.z = analyserRef.current.getAverageFrequency() / 50

        uniforms.u_frequency.value = analyserRef.current.getAverageFrequency();
        // uniforms.u_time.value = clock.getElapsedTime();
        console.log(uniforms.u_frequency.value)
      }
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    // Cleanup
    return () => {
      renderer.setAnimationLoop(null);
      if (soundRef.current) {
        soundRef.current.stop();
      }
      if (listenerRef.current) {
        cameraRef.current.remove(listenerRef.current);
      }
    };
  }, []);

  return (
    <div>
      <h1>mp.3d</h1>
      <div className="input-overlay" id="input-overlay">
        <div className="input-content">
          <h3>Upload your song</h3>
          <input
            className="file-input"
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={handleFileChange}
          />
        </div>
        <div className="colour-overlay">
        </div>
      </div>


      <div>
        <canvas id="threeJSCanvas" />
      </div>
      <div className="audio-track">
        <div className="left-content">
          <div className="album-art"></div>
          <div className="track">
            <div className="track-name" id="track-name">Untitled</div>
          </div>
        </div>
        <div className="pause-play-button">
          <button onClick={play}>play</button>
          <button onClick={() => { if (soundRef.current) soundRef.current.stop(); }}>stop</button>
        </div>
      </div>
    </div>
  );
}

export default App;