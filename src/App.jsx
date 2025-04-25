import { useState } from 'react'
import { useEffect } from 'react'
import * as THREE from 'three';
import './App.css'
import { OrbitControls } from 'https://esm.sh/three/examples/jsm/controls/OrbitControls';

import rayVertex from './shaders/ray_vertex.glsl';
import rayFragment from './shaders/ray_fragment.glsl';

function App() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;

    const canvReference = document.getElementById("threeJSCanvas");
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvReference});
    renderer.setSize( 2* window.innerWidth / 3, 2 * window.innerHeight / 3);

    const backgroundColor = new THREE.Color(0x3399ee);
    renderer.setClearColor(backgroundColor, 1);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1,1,1);
    scene.add(light);

    const geometry = new THREE.IcosahedronGeometry(2, 5);
    const material = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
    const ico = new THREE.Mesh( geometry, material );
    scene.add( ico );

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
    }

    rayMat.uniforms = uniforms;
    rayMat.vertexShader = rayVertex;
    rayMat.fragmentShader = rayFragment;
    scene.add(rayMarchPlane);

    let cameraForwardPos = new THREE.Vector3(0, 0, -1);
    const VECTOR3ZERO = new THREE.Vector3(0,0,0);
    let time = Date.now();

    // Audio Player/Analysis
    const play = () => {
      // create an AudioListener and add it to the camera
      const listener = new THREE.AudioListener()
      cameraRef.current.add(listener)
  
      // create a global audio source
      const sound = new THREE.Audio(listener)
  
      // load a sound and set it as the Audio object's buffer
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load( song , function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.5 );
        sound.play();
  
        // create an AudioAnalyser, passing in the sound and desired fftSize
        analyser = new THREE.AudioAnalyser( sound, 32 );
      });
    }

    function animate() {
      requestAnimationFrame(animate);
      cameraForwardPos = camera.position.clone().add(camera.getWorldDirection(VECTOR3ZERO).multiplyScalar(camera.near));
      rayMarchPlane.position.copy(cameraForwardPos);
      rayMarchPlane.rotation.copy(camera.rotation);

      renderer.render( scene, camera );

      uniforms.u_time.value = (Date.now() - time) / 1000;
      // Controls.update();
    }
    animate();
  }, []);

  return (
    <div>
      <p>It's an Audio Visualizer (not yet) Yayyyy</p>
      <div>
        <canvas id="threeJSCanvas" />
      </div>
      <button onClick={play}>play</button>
    </div>
  )
}

export default App
