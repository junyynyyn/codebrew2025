import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import './App.css';

import rayVertex from './shaders/ray_vertex.glsl';
import rayFragment from './shaders/ray_fragment.glsl';

function App() {
  const cameraRef = useRef(null);
  const analyserRef = useRef(null);
  const soundRef = useRef(null);
  const listenerRef = useRef(null);
  const sceneRef = useRef(null);
  const lineRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file && file.type === 'audio/mpeg') {
      // Clean up previous audio if exists
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
    
        sound.play();
        analyserRef.current = new THREE.AudioAnalyser(sound, 32);
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
    renderer.setSize(2 * window.innerWidth / 3, 2 * window.innerHeight / 3);

    const backgroundColor = new THREE.Color(0x3399ee);
    renderer.setClearColor(backgroundColor, 1);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1,1,1);
    scene.add(light);

    // Create visualization line
    const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
    const points = [];
    for (let i = 0; i < 16; i++) {
      points.push(new THREE.Vector3(i - 8, 0, -5));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    lineRef.current = line;

    camera.position.z = 5;

    // Raymarching Plane
    const rayPlane = new THREE.PlaneGeometry();
    const rayMat = new THREE.ShaderMaterial();
    const rayMarchPlane = new THREE.Mesh(rayPlane, rayMat);

    const nearPlaneWidth = camera.near * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 2;
    const nearPlaneHeight = nearPlaneWidth / camera.aspect;
    rayMarchPlane.scale.set(nearPlaneWidth, nearPlaneHeight, 1);

    const uniforms = {
      u_eps: {value: 0.01},
      u_maxDis: {value: 1000},
      u_maxSteps: {value: 100},

      u_clearColor: {value: backgroundColor},

      u_camPos: { value: camera.position },
      u_camToWorldMat: { value: camera.matrixWorld },
      u_camInvProjMat: { value: camera.projectionMatrixInverse },

      u_lightDir: { value: light.position },
      u_lightColor: {value: light.color },

      u_diffIntensity: { value: 0.5 },
      u_specIntensity: { value: 3},
      u_ambientIntensity: { value: 0.15 },
      u_shininess: { value: 16},

      u_time: {value: 0}, 
      u_musicDispl: {value: 0}
    }

    rayMat.uniforms = uniforms;
    rayMat.vertexShader = rayVertex;
    rayMat.fragmentShader = rayFragment;
    scene.add(rayMarchPlane);

    let cameraForwardPos = new THREE.Vector3(0, 0, -1);
    const VECTOR3ZERO = new THREE.Vector3(0,0,0);
    let time = Date.now();

    // Animation loop
    function animate() {
      cameraForwardPos = camera.position.clone().add(camera.getWorldDirection(VECTOR3ZERO).multiplyScalar(camera.near));
      rayMarchPlane.position.copy(cameraForwardPos);
      rayMarchPlane.rotation.copy(camera.rotation);

      if (analyserRef.current) {
        const data = analyserRef.current.getFrequencyData();
        const positions = lineRef.current.geometry.attributes.position.array;
        
        for (let i = 0; i < 16; i++) {
          positions[i * 3 + 1] = data[i] / 100;
        }
        uniforms.u_musicDispl.value = data[0];
        
        lineRef.current.geometry.attributes.position.needsUpdate = true;
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
      <div>
        <canvas id="threeJSCanvas" />
      </div>
      <button onClick={play}>play</button>
      <div>
        <h2>Upload MP3 File</h2>
        <input
          type="file"
          accept=".mp3,audio/mpeg"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default App;