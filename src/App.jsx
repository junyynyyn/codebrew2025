import { useState, useRef } from 'react'
import { useEffect } from 'react'
import * as THREE from 'three';
import './App.css'
import song from './assets/lucy.mp3'

function App() {

  const cameraRef = useRef(null)
  let analyser;

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

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    cameraRef.current = camera

    const canvReference = document.getElementById("threeJSCanvas");
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvReference});
    renderer.setSize( 2* window.innerWidth / 3, 2 * window.innerHeight / 3);

    // const geometry = new THREE.IcosahedronGeometry( 2, 5);
    // const material = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
    // const ico = new THREE.Mesh( geometry, material );
    // scene.add( ico );
    // ico.material.wireframe = true;

    const material2 = new THREE.LineBasicMaterial({
      color: 0x0000ff
    });
    const points = [];
    for(let i = 0; i < 16; i++){
      points.push( new THREE.Vector3( i-8, 0, -5 ) );
    }

    const geometry2 = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry2, material2 );
    scene.add( line );

    camera.position.z = 5;

    function animate() {
      // ico.rotation.x += 0.001;
      // ico.rotation.y += 0.001;
      if (analyser) {
        // get the average frequency of the sound
        const data = analyser.getFrequencyData();
        for(let i = 0; i < 16; i++){
          line.geometry.attributes.position.array[i*3 + 1] = data[i] / 100
        }
        line.geometry.attributes.position.needsUpdate = true;
      }
      renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
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