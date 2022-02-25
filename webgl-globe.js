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
    this.render()
  }

  render() {
    this.innerHTML = ''
  }
}

if (!window.customElements.get('webgl-globe')) {
  window.customElements.define('webgl-globe', WebglGlobeElement)
}
