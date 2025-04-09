import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PCDLoader } from './PCDLoader';
import { OrbitControls } from './OrbitControls';

interface Props {
}

function Scene(props: Props) {
  const mountRef = useRef(null);
  // NB: Must use union type to avoid compile error
  // https://www.designcise.com/web/tutorial/how-to-fix-useref-react-hook-cannot-assign-to-read-only-property-typescript-error
  const pointCloudRef = useRef<any|null>(null);

  useEffect(() => {
    if (mountRef.current === null) {
      // NB: This is just to satisfy TypeScript.
      return;
    }

    // NB: Width of the div.
    // We were already using a div to attach the animation context, but it
    // also works for determining the width, per: 
    // https://thewebdev.info/2021/05/24/how-to-get-the-width-of-an-element-in-a-react-component/
    const width = (mountRef.current as any).offsetWidth;
    const height = 300;

    //const aspect= window.innerWidth / window.innerHeight;
    const aspect = width / height;

    const scene = new THREE.Scene();

    //const camera = new THREE.PerspectiveCamera(75, perspective, 0.1, 1000);
    const camera = new THREE.PerspectiveCamera(30, aspect, 0.01, 40);
    camera.position.set( 0, 0, 1 );
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      alpha: true, // transparent bg
    });

    function render() {
      renderer.render( scene, camera );
    }

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 0.5;
    controls.maxDistance = 10;

    renderer.setSize(width, height);
    
    (mountRef.current as any).appendChild(renderer.domElement);
    
    //const geometry = new THREE.BoxGeometry(1, 1, 1);
    //const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    //const cube = new THREE.Mesh(geometry, material);
    //scene.add(cube);
    
    const animate = function () {
      requestAnimationFrame(animate);

      if (pointCloudRef.current !== null) {
        (pointCloudRef.current as any).rotation.x += 0.0005;
        (pointCloudRef.current as any).rotation.y += 0.001;
      }

      renderer.render(scene, camera);
    };
    
    animate();

    // instantiate a loader
    const loader = new PCDLoader();

    loader.load(
      '/assets/temp.pcd', // resource URL
      function (mesh : any) {
        // on load handler
        mesh.geometry.center();
        mesh.geometry.rotateX( Math.PI );
        mesh.scale.x = 2;
        mesh.scale.y = 2;
        mesh.scale.z = 2;
        mesh.material.color.setHex( 0xffffff );
        scene.add( mesh );
        pointCloudRef.current = mesh;
      },
      function ( xhr : any ) {
        // in-progress updates
      },
      function ( error : any) {
        // error handler
      }
    );

    // NB: React wants a closure to avoid destructing the wrong thing.
    const currentMountRef = mountRef.current;

    // React DTOR hook
    return () => (currentMountRef as any).removeChild(renderer.domElement);
  }, []);

  return (
    <div ref={mountRef}></div>
  );
}

export default Scene;
