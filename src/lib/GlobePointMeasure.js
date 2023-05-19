export default class GlobePointMeasure {
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
    this.callback = null
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
  showModifyPoint(position, callback) {
    this.position = position
    this.callback = callback
    this.entity = null
    this._createPoint()
    this._startModify()
  }
  startDrawPoint(callback) {
    this.callback = callback
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

      let text = this._getMeasureTip(this.position)
      this.setPrimitiveHeight(cartesian, text)

      this.tooltip.setVisible(false)
      this._startModify()
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    this.drawHandler.setInputAction(event => {
      let wp = event.endPosition
      if (!Cesium.defined(wp)) {
        return
      }
      if (this.position == null) {
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
      if (this.entity == null) {
        this._createPoint()
      } else {
        let text = this._getMeasureTip(this.position)
        this.setPrimitiveHeight(cartesian, text)
        this.tooltip.showAt(wp, '<p>选择位置</p>')
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }
  // 动态改变位置
  setPrimitiveHeight(cartesian, text) {
    this.entity._labels[0].position = cartesian
    if(text){
      this.entity._labels[0].text = text
    }    
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
        this.setPrimitiveHeight(cartesian)
        this.position = cartesian
        this.tooltip.setVisible(false)
      } else {
        let pickedObject = this.scene.pick(wp)
        if (!Cesium.defined(pickedObject)) {
          return
        }
        if (!Cesium.defined(pickedObject.layerId)) {
          return
        }
        let entity = pickedObject
        if (entity.layerId != this.layerId || entity.flag != 'anchor') {
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
      this.position = cartesian
      let text = this._getMeasureTip(this.position)
      this.setPrimitiveHeight(cartesian, text)
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }
  _createPoint() {
    
    let point = this.viewer.scene.primitives.add(new Cesium.LabelCollection())
    let text = this._getMeasureTip(this.position)
    let entity = {
      position: this.position,
      text: text,
        font: '18px "微软雅黑", Arial, Helvetica, sans-serif, Helvetica',
        fillColor: Cesium.Color.RED,
        outlineColor: Cesium.Color.SKYBLUE,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
    point.oid = 0
    point.layerId = this.layerId
    point.flag = 'anchor'
    
    point.add(entity)
    this.entity = point
    return point
  }
  _getMeasureTip(cartesian) {
    let pos = this._getLonLat(cartesian)
    if (!pos.alt) {
      pos.alt = ''
    } else {
      pos.alt = pos.alt.toFixed(1)
    }
    pos.lon = pos.lon.toFixed(3)
    pos.lat = pos.lat.toFixed(3)
    let tip = '经度：' + pos.lon + '，纬度：' + pos.lat + '\n 海拔=' + pos.alt + '米'
    return tip
  }
  _getLonLat(cartesian) {
    let cartographic = this.ellipsoid.cartesianToCartographic(cartesian)
    cartographic.height = this.viewer.scene.globe.getHeight(cartographic)
    let pos = {
      lon: cartographic.longitude,
      lat: cartographic.latitude,
      alt: cartographic.height
    }
    pos.lon = Cesium.Math.toDegrees(pos.lon)
    pos.lat = Cesium.Math.toDegrees(pos.lat)
    return pos
  }
  _createToolBar() {
    this.GlobeMessageBox.showAt({
      okClick: () =>{
        if (this.callback) {
          let lonLat = this._getLonLat(this.position)
          this.clear()
          this.callback(this.position, lonLat)
        }
      },
      cancelClick: () =>{
        this.clear()
      }
    })
  }
  _clearMarkers(layerName) {
    this.viewer.scene.primitives._primitives.map(e => {
      if (e.layerId === layerName) {
        this.viewer.scene.primitives.remove(e)
      }
    })
  }
}
