export default class GlobePointDrawer {
  constructor(viewer, actionTitle) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.clock = viewer.clock
    this.canvas = viewer.scene.canvas
    this.camera = viewer.scene.camera
    this.ellipsoid = viewer.scene.globe.ellipsoid
    this.tooltip = new GlobeTooltip(viewer.container)
    this.GlobeMessageBox = new GlobeMessageBox(viewer.container, actionTitle)
    this.entity = null
    this.position = null
    this.drawHandler = null
    this.modifyHandler = null
    this.okHandler = null
    this.cancelHandler = null
    this.image = 'images/circle_red.png'
    this.toolBarIndex = null
    this.layerId = 'globeEntityDrawerLayer'
    this.actionTitle = actionTitle
  }

  clear() {
    if (this.drawHandler) {
      this.drawHandler.destroy()
      this.drawHandler = null
    }
    if (this.modifyHandler) {
      this.modifyHandler.destroy()
      this.modifyHandler = null
    }
    this.entity = null
    this._clearMarkers(this.layerId)
    this.tooltip.setVisible(false)
  }

  showModifyPoint(position, okHandler, cancelHandler) {
    this.position = position
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler
    this.entity = null
    this._createPoint()
    this._startModify()
  }

  startDrawPoint(okHandler, cancelHandler) {
    this.okHandler = okHandler
    this.cancelHandler = cancelHandler
    this.entity = null
    this.position = null
    this.drawHandler = new Cesium.ScreenSpaceEventHandler(this.canvas)

    this.drawHandler.setInputAction(event => {
      let wp = event.position
      if (!Cesium.defined(wp)) {
        return
      }
      let ray = this.camera.getPickRay(wp)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      this.position = cartesian
      this.setPrimitiveHeight(cartesian)
      this.tooltip.setVisible(false)
      this._startModify()
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.drawHandler.setInputAction(event => {
      let wp = event.endPosition
      if (!Cesium.defined(wp)) {
        return
      }
      if (this.position === null) {
        this.tooltip.showAt(wp, '<p>选择位置</p>')
      }
      let ray = this.camera.getPickRay(wp)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      this.position = cartesian
      if (this.entity === null) {
        this._createPoint()
      } else {
        this.setPrimitiveHeight(cartesian)
        this.tooltip.showAt(wp, '<p>移动位置</p>')
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }
  
  // 动态改变位置
  setPrimitiveHeight(cartesian, pickedAnchor) {
    if(pickedAnchor){
      return pickedAnchor._billboards[0].position = cartesian
    }
    this.entity._billboards[0].position = cartesian
  }

  _startModify() {
    let isMoving = false
    let pickedAnchor = null
    if (this.drawHandler) {
      this.drawHandler.destroy()
      this.drawHandler = null
    }
    this._createToolBar()

    this.modifyHandler = new Cesium.ScreenSpaceEventHandler(this.canvas)

    this.modifyHandler.setInputAction(event => {
      let wp = event.position
      if (!Cesium.defined(wp)) {
        return
      }
      let ray = this.camera.getPickRay(wp)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      
      if (isMoving) {
        isMoving = false
        // pickedAnchor.position.setValue(cartesian)
        this.setPrimitiveHeight(cartesian, pickedAnchor)
        this.position = cartesian
        this.tooltip.setVisible(false)
      } else {
        let pickedObject = this.scene.pick(wp)
        if (!Cesium.defined(pickedObject)) {
          return
        }
        if (!Cesium.defined(pickedObject.collection)) {
          return
        }
        let entity = pickedObject.collection
        if (entity.layerId !== this.layerId || entity.flag !== 'anchor') {
          return
        }
        pickedAnchor = entity
        isMoving = true
        this.tooltip.showAt(wp, '<p>移动位置</p>')
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.modifyHandler.setInputAction(event => {
      if (!isMoving) {
        return
      }
      let wp = event.endPosition
      if (!Cesium.defined(wp)) {
        return
      }
      this.tooltip.showAt(wp, '<p>移动位置</p>')

      let ray = this.camera.getPickRay(wp)
      if (!Cesium.defined(ray)) {
        return
      }
      let cartesian = this.scene.globe.pick(ray, this.scene)
      if (!Cesium.defined(cartesian)) {
        return
      }
      this.setPrimitiveHeight(cartesian)
      this.position = cartesian
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  _createPoint() {    
    let point = this.viewer.scene.primitives.add(new Cesium.BillboardCollection())
    let entity = {
      shapeType: 'Point',
      position: this.position,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      image: this.image
    }      
    point.oid = 0
    point.layerId = this.layerId
    point.flag = 'anchor'    
    point.add(entity)
    this.entity = point
    return point
  }

  _createToolBar() {
    this.GlobeMessageBox.showAt({
      okClick: () =>{
        this.clear()
        if (this.okHandler) {
          let lonLat = this._getLonLat(this.position)
          this.okHandler(this.position, lonLat)
        }
      },
      cancelClick: () =>{
        this.clear()
        if (this.cancelHandler) {
          this.cancelHandler()
        }
      }
    })
  }

  _getLonLat(cartesian) {
    let cartographic = this.ellipsoid.cartesianToCartographic(cartesian)
    cartographic.height = this.viewer.scene.globe.getHeight(cartographic)
    let pos = {
      lon: cartographic.longitude,
      lat: cartographic.latitude,
      alt: cartographic.height,
      height: cartographic.height
    }
    pos.lon = Cesium.Math.toDegrees(pos.lon)
    pos.lat = Cesium.Math.toDegrees(pos.lat)
    return pos
  }

  _clearMarkers(layerName) {
    this.viewer.scene.primitives._primitives.map(e => {
      if (e.layerId === layerName) {
        this.viewer.scene.primitives.remove(e)
      }
    })
  }
}
