class WebglGlobeElement extends HTMLElement {

  constructor() {
    super()
  }

  static get observedAttributes() {
    return []
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      default:
        this.render()
    }
  }

  connectedCallback() {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000)
    this.camera.position.z = 3

    this.renderer = new THREE.WebGLRenderer({alpha: true})
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.appendChild(this.renderer.domElement)

    this.sphere = this.getSphere()
    this.glow = new THREE.AmbientLight(0xffffff, 1)
    this.sun = new THREE.DirectionalLight(0xffffff, 1)
    this.sun.position.set(5, 3, 5)

    this.scene.add(this.sphere)
    this.scene.add(this.glow)
    this.scene.add(this.sun)

    this.render()
  }

  disconnectedCallback() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.sphere = null
    this.glow = null
    this.sun = null
    this.innerHTML = ''
  }

  getSphere() {
    const geometry = new THREE.SphereGeometry(1, 48, 24)  // unit sphere
    const material = new THREE.MeshLambertMaterial({color: 'gray'})
    return new THREE.Mesh(geometry, material)
  }

  render() {
    // FUTURE: animate globe
    // requestAnimationFrame(this.render.bind(this))

    // FUTURE: rotate around poles
    // this.sphere.rotation.y += 0.01

    this.renderer.render(this.scene, this.camera)
  }
}

if (!window.customElements.get('webgl-globe')) {
  window.customElements.define('webgl-globe', WebglGlobeElement)
}
