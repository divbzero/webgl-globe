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

    this.sphere = this.getSphere(0.998)
    this.circlesOfLatitude = []
    for (let latitude = -75; latitude <= 75; latitude += 15) {
      this.circlesOfLatitude.push(this.getCircleOfLatitude(latitude))
    }
    this.circlesOfLongitude = []
    for (let longitude = 0; longitude < 180; longitude += 15) {
      this.circlesOfLongitude.push(this.getCircleOfLongitude(longitude))
    }
    this.glow = new THREE.AmbientLight(0xffffff, 1)
    this.sun = new THREE.DirectionalLight(0xffffff, 1)
    this.sun.position.set(5, 3, 5)

    this.scene.add(this.sphere)
    this.circlesOfLatitude.forEach(curve => this.scene.add(curve))
    this.circlesOfLongitude.forEach(curve => this.scene.add(curve))
    this.scene.add(this.glow)
    this.scene.add(this.sun)

    this.render()
  }

  disconnectedCallback() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.sphere = null
    this.circlesOfLatitude = null
    this.circlesOfLongitude = null
    this.glow = null
    this.sun = null
    this.innerHTML = ''
  }

  getSphere(radius) {
    const geometry = new THREE.SphereGeometry(radius, 48, 24)
    const material = new THREE.MeshLambertMaterial({color: 0xFFFFFF})
    return new THREE.Mesh(geometry, material)
  }

  getCircleOfLatitude(latitude) {
    // angle in radians
    const angle = latitude * Math.PI / 180

    // calculate radius from angle
    const radius = Math.cos(angle)

    // circle in same plane as prime meridian
    const curve = new THREE.EllipseCurve(0, 0, radius, radius)
    const points = curve.getSpacedPoints(48)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({color: 0xEEEEEE, linewidth: 3})
    const line = new THREE.Line(geometry, material)

    // rotate circle to be in same plane as equator
    const quaternion = new THREE.Quaternion()
    line.rotation.x += Math.PI / 2

    // translate circle towards north or south pole
    line.position.y += Math.sin(angle)

    return line
  }

  getCircleOfLongitude(longitude) {
    // angle in radians
    const angle = longitude * Math.PI / 180

    // great circle of 0 degrees (prime meridian) and 180 degrees
    const curve = new THREE.EllipseCurve()
    const points = curve.getSpacedPoints(48)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({color: 0xEEEEEE, linewidth: 3})
    const line = new THREE.Line(geometry, material)

    // rotate great circle about poles
    line.rotation.y += angle

    return line
  }

  render() {
    // animate globe
    requestAnimationFrame(this.render.bind(this))

    // rotate around poles
    this.circlesOfLongitude.forEach(curve => curve.rotation.y += 0.01)

    this.renderer.render(this.scene, this.camera)
  }
}

if (!window.customElements.get('webgl-globe')) {
  window.customElements.define('webgl-globe', WebglGlobeElement)
}
