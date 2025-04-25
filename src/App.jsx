import { useState } from 'react'
import { useEffect } from 'react'
import * as THREE from 'three';
import './App.css'

function App() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const canvReference = document.getElementById("threeJSCanvas");
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvReference});
    renderer.setSize( 2* window.innerWidth / 3, 2 * window.innerHeight / 3);

    const geometry = new THREE.IcosahedronGeometry( 2, 5);
    const material = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
    const ico = new THREE.Mesh( geometry, material );
    scene.add( ico );
    ico.material.wireframe = true;

    camera.position.z = 5;

    function animate() {
      ico.rotation.x += 0.001;
      ico.rotation.y += 0.001;
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
    </div>
  )
}

export default App
