import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import './App.css';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

import rayVertex from './shaders/ray_vertex.glsl';
import rayFragment from './shaders/ray_fragment.glsl';

function mapRange(number, inMin, inMax, outMin, outMax) {
  return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function App() {
  const [rayMarchVis, setRayMarchVis] = useState(false);

  function switchState() {
    setRayMarchVis(rayMarchVis != true);
    console.log(rayMarchVis);
  }

  const cameraRef = useRef(null);
  const analyserRef = useRef(null);
  const soundRef = useRef(null);
  const listenerRef = useRef(null);
  const sceneRef = useRef(null);
  const meshRef = useRef(null)
  const meshRef2 = useRef(null)

  const [previewUrl, setPreviewUrl] = useState('');
  const speedRef = useRef(0.001)

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

    renderer.setSize(window.innerWidth,window.innerHeight);

    const backgroundColor = new THREE.Color(0x000000);
    renderer.setClearColor(backgroundColor, 1);

    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(0.5, 1, 1);
    scene.add(light);

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

    const uniforms2 = {
      u_resolution: { type: 'v2', value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_time: { type: 'f', value: 0.0 },
      u_frequency: { value: 0.0 },
      u_color: { value: new THREE.Color(1, 1, 1) } // different base color
    };

    const mat2 = new THREE.ShaderMaterial({
      uniforms: uniforms2,
      vertexShader: document.getElementById('vertexshader').textContent,
      fragmentShader: document.getElementById('fragmentshader').textContent
    });

    const geometry = new THREE.IcosahedronGeometry(2, 10)
    const mesh = new THREE.Mesh(geometry, mat)

    scene.add(mesh)
    mesh.material.wireframe = true
    meshRef.current = mesh

    const mesh2 = new THREE.Mesh(geometry, mat2)
    scene.add(mesh2)
    mesh2.material.wireframe = true
    meshRef2.current = mesh2

    camera.position.z = 5;

    // Raymarching Plane
    const rayPlane = new THREE.PlaneGeometry();
    const rayMat = new THREE.ShaderMaterial();
    const rayMarchPlane = new THREE.Mesh(rayPlane, rayMat);

    const nearPlaneWidth = camera.near * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 2;
    const nearPlaneHeight = nearPlaneWidth / camera.aspect;
    rayMarchPlane.scale.set(nearPlaneWidth, nearPlaneHeight, 1);

    const outlineColor = new THREE.Color(0x0000ff);
    const color1 = new THREE.Color(0x888888);
    const color2 = new THREE.Color(0x555555);

    const raymarch_uniforms = {
      u_eps: {value: 0.01},
      u_maxDis: {value: 50},
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
      u_musicDispl: {value: 0},
      u_outlineColor: { value: outlineColor },
      u_color1: { value: color1 },
      u_color2: { value: color2 }
    }

    rayMat.uniforms = raymarch_uniforms;
    rayMat.vertexShader = rayVertex;
    rayMat.fragmentShader = rayFragment;
    scene.add(rayMarchPlane);

    let cameraForwardPos = new THREE.Vector3(0, 0, -1);
    const VECTOR3ZERO = new THREE.Vector3(0,0,0);
    let time = Date.now();

    // Animation loop
    function animate() {
      uniforms.u_time.value += 0.01;
      meshRef.current.rotation.x += speedRef.current
      meshRef.current.rotation.y += speedRef.current
      uniforms2.u_time.value += 0.01;
      meshRef2.current.rotation.x += speedRef.current
      meshRef2.current.rotation.y += speedRef.current

      // RayMarch Code
      cameraForwardPos = camera.position.clone().add(camera.getWorldDirection(VECTOR3ZERO).multiplyScalar(camera.near));
      rayMarchPlane.position.copy(cameraForwardPos);
      rayMarchPlane.rotation.copy(camera.rotation);

      uniforms.u_time.value = (Date.now() - time) / 1000;

      // uniforms.u_time.value = clock.getElapsedTime();
      // raymarch_uniforms.u_musicDispl.value = data[0];
      // raymarch_uniforms.u_outlineColor.value = new THREE.Color(mapRange(data[1], 0, 200, 0, 1), mapRange(data[2], 0, 200, 0, 1), mapRange(data[3], 0, 200, 0, 1));
      rayMarchPlane.visible = true;

      if (analyserRef.current) {
        const data = analyserRef.current.getFrequencyData();
        const avg = analyserRef.current.getAverageFrequency();
        
        speedRef.current = avg / 5000
        console.log(speedRef)
        
        let mids = 0
        for (let i = 8; i < 12; i++) {
          mids += data[i]
        }
        mids /= 4
        if((mids / 255 )< 0.66){
          mids *= 1.5
        }
        meshRef.current.material.uniforms.u_color.value.setHSL(mids / 255, 1.0, 0.5);
        meshRef2.current.material.uniforms.u_color.value.setHSL(1 - (mids / 255), 1.0, 0.5);
        meshRef.current.scale.x = analyserRef.current.getAverageFrequency() / 50
        meshRef.current.scale.y = analyserRef.current.getAverageFrequency() / 50
        meshRef.current.scale.z = analyserRef.current.getAverageFrequency() / 50

        uniforms.u_frequency.value = analyserRef.current.getAverageFrequency();
        uniforms2.u_frequency.value = analyserRef.current.getAverageFrequency();
        // uniforms.u_color1.value = new THREE.Color(mapRange(data[4], 0, 200, 0, 1), mapRange(data[5], 0, 200, 0, 1), mapRange(data[6], 0, 200, 0, 1));
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
          <button onClick={switchState}>Switch Visual</button>
        </div>
      </div>
    </div>
  );
}

export default App;