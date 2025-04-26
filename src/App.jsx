import { useState } from 'react'
import { useEffect } from 'react'
import * as THREE from 'three';
// import './App.css'
import { OrbitControls } from 'https://esm.sh/three/examples/jsm/controls/OrbitControls';

import ThreeJSScene from './ThreeJSScene';

function App() {
  return (
    <>
      <ThreeJSScene />
      <main className="fixed top-10 left-10">
        <h1 className="text-4xl font-bold">THIS IS NOT FIXED</h1>
      </main>
    </>
  )
}

export default App
