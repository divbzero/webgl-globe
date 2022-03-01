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

  async connectedCallback() {
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
    this.geojson = await this.getGeoJSON('countries.json')
    this.glow = new THREE.AmbientLight(0xffffff, 1)
    this.sun = new THREE.DirectionalLight(0xffffff, 1)
    this.sun.position.set(5, 3, 5)

    this.scene.add(this.sphere)
    this.circlesOfLatitude.forEach(curve => this.scene.add(curve))
    this.circlesOfLongitude.forEach(curve => this.scene.add(curve))
    this.geojson.forEach(line => this.scene.add(line))
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
    this.geojson = null
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

  async getGeoJSON(url) {
    const lines = []

    const response = await fetch(url)
    const geojson = await response.json()

    switch (geojson.type) {
      case 'FeatureCollection':
        geojson.features.forEach(feature => lines.push.apply(lines, this.getGeoJSONFeature(feature)))
        break
    }

    return lines
  }

  /**
   * @typedef {[Number, Number]} Coordinates
   * @param {Object} feature
   * @param {Object} feature.geometry
   * @param {String} feature.geometry.type
   * @param {Coordinates[]|Coordinates[][]} feature.geometry.coordinates
   * @returns {THREE.Object3D[]}
   */
  getGeoJSONFeature(feature) {
    const objects = []

    let points, geometry, material
    switch (feature.geometry.type) {
      case 'LineString':
        points = feature.geometry.coordinates.map(this.getUnitSphereCoordinates)
        geometry = new THREE.BufferGeometry().setFromPoints(points)
        material = new THREE.LineBasicMaterial({color: 0x888888, linewidth: 3})
        objects.push(new THREE.Line(geometry, material))
        break
      case 'Point':
        points = [this.getUnitSphereCoordinates(feature.geometry.coordinates)]
        geometry = new THREE.BufferGeometry().setFromPoints(points)
        material = new THREE.PointsMaterial({color: 0x888888, size: 3})
        objects.push(new THREE.Points(geometry, material))
        break
      case 'MultiLineString':
        feature.geometry.coordinates.forEach(coordinates => {
          const points = coordinates.map(this.getUnitSphereCoordinates)
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const material = new THREE.LineBasicMaterial({color: 0x888888, linewidth: 3})
          objects.push(new THREE.Line(geometry, material))
        })
        break
      case 'MultiPoint':
        points = feature.geometry.coordinates.map(this.getUnitSphereCoordinates)
        geometry = new THREE.BufferGeometry().setFromPoints(points)
        material = new THREE.PointsMaterial({color: 0x888888, size: 3})
        objects.push(new THREE.Points(geometry, material))
        break
    }

    return objects
  }

  /**
   * @param {Number} longitude
   * @param {Number} latitude
   * @returns {THREE.Vector3}
   */
  getUnitSphereCoordinates([longitude, latitude]) {
    longitude *= Math.PI / 180
    latitude *= Math.PI / 180

    // positive x-axis intersects prime meridian and equator (0°E 0°N)
    const x = Math.cos(latitude) * Math.cos(longitude)
    // positive y-axis intersects north pole (0°E 90°N)
    const y = Math.sin(latitude)
    // positive z-axis intersects 90°W and equator (90°W 0°N)
    const z = -Math.cos(latitude) * Math.sin(longitude)

    return new THREE.Vector3(x, y, z)
  }

  render() {
    // animate globe
    requestAnimationFrame(this.render.bind(this))

    // rotate around poles
    this.circlesOfLongitude.forEach(curve => curve.rotation.y += 0.01)
    this.geojson.forEach(line => line.rotation.y += 0.01)

    this.renderer.render(this.scene, this.camera)
  }
}

if (!window.customElements.get('webgl-globe')) {
  window.customElements.define('webgl-globe', WebglGlobeElement)
}
