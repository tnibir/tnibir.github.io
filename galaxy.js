import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const container = document.querySelector("#galaxy-background");
const canvas = document.querySelector("#galaxy-canvas");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const constrainedDevice = navigator.connection?.saveData ||
  (navigator.deviceMemory && navigator.deviceMemory < 2);

if (container && canvas && !constrainedDevice) {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth > 780,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
    camera.position.set(0, 0, 5.2);

    const stage = new THREE.Group();
    scene.add(stage);

    let galaxy = null;
    let frame = 0;
    let scrollProgress = 0;
    let currentProgress = 0;
    let lastTime = performance.now();
    let isVisible = !document.hidden;

    function updateScrollProgress() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      if (galaxy && !frame) startRendering();
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatioCap = width <= 780 ? 1.25 : 1.75;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      if (galaxy && !frame) startRendering();
    }

    function placeGalaxy() {
      if (!galaxy) return;
      const mobile = window.innerWidth <= 780;
      const progress = reduceMotion.matches ? 0 : currentProgress;

      galaxy.rotation.set(
        -.2 + progress * .72,
        .28 + progress * 1.55,
        -.28 + progress * 1.08
      );
      galaxy.position.set(
        (mobile ? .15 : 1.45) - progress * (mobile ? .3 : .82),
        (mobile ? .2 : .35) - progress * .72,
        0
      );
      const zoom = (mobile ? .82 : 1.08) + progress * (mobile ? .18 : .32);
      galaxy.scale.setScalar(zoom);
    }

    function render(time) {
      if (!isVisible) return;
      const paused = document.body.classList.contains("motion-paused") || reduceMotion.matches;
      const delta = Math.min(50, time - lastTime);
      lastTime = time;

      if (!paused) currentProgress += (scrollProgress - currentProgress) * Math.min(1, delta * .006);
      placeGalaxy();
      renderer.render(scene, camera);
      const settling = !paused && Math.abs(scrollProgress - currentProgress) > .0001;
      frame = settling ? requestAnimationFrame(render) : 0;
    }

    function startRendering() {
      if (frame || !isVisible) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(render);
    }

    resize();
    updateScrollProgress();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    document.addEventListener("visibilitychange", () => {
      isVisible = !document.hidden;
      if (isVisible) startRendering();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    new MutationObserver(() => startRendering()).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
    reduceMotion.addEventListener?.("change", startRendering);
    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      container.classList.add("load-failed");
    });

    const loader = new GLTFLoader();
    loader.load("assets/bg-3d.glb", gltf => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const longestSide = Math.max(size.x, size.y, size.z) || 1;

      model.position.sub(center);
      model.traverse(object => {
        if (!object.isPoints) return;
        object.material = object.material.clone();
        object.material.size = .022;
        object.material.sizeAttenuation = true;
        object.material.transparent = true;
        object.material.opacity = .82;
        object.material.depthWrite = false;
      });

      const normalized = new THREE.Group();
      normalized.scale.setScalar(3.7 / longestSide);
      normalized.add(model);
      galaxy = new THREE.Group();
      galaxy.add(normalized);
      stage.add(galaxy);
      placeGalaxy();
      container.classList.add("is-ready");
      startRendering();
    }, undefined, () => {
      container.classList.add("load-failed");
      renderer.dispose();
    });
  } catch {
    container.classList.add("load-failed");
  }
} else {
  container?.classList.add("load-failed");
}
