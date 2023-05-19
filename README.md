## Install

Using npm:

```
npm install draw-cesium-primitive --save

import drawCesium from 'draw-cesium-primitive';

```

## Usage

初始化:

```
this.tracker = new drawCesium(this.viewer)
this.bindGloveEvent()

```

绑定 Cesium 事件:

```
bindGloveEvent(){
    let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
      handler.setInputAction(movement => {
        let pick = this.viewer.scene.pick(movement.position)
        if (!pick) {
          return
        }
        let obj = pick.id
        if (!obj || !obj.layerId || this.flag == 0) {
          return
        }
        let objId = obj.objId
        //flag为编辑或删除标识,1为编辑，2为删除
        if (this.flag === 1) {
          switch (obj.shapeType) {
            case 'Polygon':
              this.flag = 0
              this.editPolygon(objId)
              break
            case 'Polyline':
              this.flag = 0
              this.editPolyline(objId)
              break
            case 'Rectangle':
              this.flag = 0
              this.editRectangle(objId)
              break
            case 'Circle':
              this.flag = 0
              this.editCircle(objId)
              break
            case 'Point':
              this.flag = 0
              this.editPoint(objId)
              break
            case 'StraightArrow':
              this.flag = 0
              this.editStraightArrow(objId)
              break
            case 'AttackArrow':
              this.flag = 0
              this.editAttackArrow(objId)
              break
            case 'PincerArrow':
              this.flag = 0
              this.editPincerArrow(objId)
              break
            default:
              break
          }
        } else if (this.flag === 2) {
          this.clearEntityById(objId)
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

```

## Usage

所有函数:

```
methods: {
    // 绘制点
    drawPoint() {
      this.flag = 0
      this.tracker.trackPoint(position => {
        let objId = new Date().getTime()
        this.shapeDic[objId] = position
        this.showPoint(objId, position)
      })
    },
    showPoint(objId, position) {
      let billboards = this.viewer.scene.primitives.add(new Cesium.BillboardCollection())
      let entity = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'Point',
        position: position,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        image: 'images/circle_red.png'
      }
      billboards.objId = objId
      billboards.layerId = this.layerId
      billboards.add(entity)
    },
    // 编辑点
    editPoint(objId) {
      let oldPosition = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)
      //进入编辑状态
      this.tracker.pointDrawer.showModifyPoint(
        oldPosition,
        position => {
          this.shapeDic[objId] = position
          this.showPoint(objId, position)
        },
        () => {
          this.showPoint(objId, oldPosition)
        }
      )
    },
    // 清除单体Id
    clearEntityById(objId) {
      this.viewer.scene.primitives._primitives.map(e => {
        if (e.layerId === this.layerId && e.objId === objId) {
          this.viewer.scene.primitives.remove(e)
        }
      })
    },
    // 绘制线
    drawPolyline() {
      this.flag = 0
      this.tracker.trackPolyline(positions => {
        var objId = new Date().getTime()
        this.shapeDic[objId] = positions
        this.showPolyline(objId, positions)
      })
    },
    showPolyline(objId, positions) {
      let polylinePrimitive = this.viewer.scene.primitives.add(new Cesium.PolylineCollection())
      polylinePrimitive.add({
        id: objId,
        positions,
        width: 4,
        loop: true,
        material: new Cesium.Material.fromType('Color', {
          color: Cesium.Color.fromCssColorString('#f00')
        })
      })
      polylinePrimitive.objId = objId
      polylinePrimitive.layerId = this.layerId
      polylinePrimitive = this.setPrimitiveHeight({ primitive: polylinePrimitive, height: 8 })
    },
    // 设置高度
    setPrimitiveHeight({
      primitive,
      height,
      positions = { longitude: 121.39444245258065, latitude: 31.170587645068945 }
    }) {
      let newHeight = height
      let surface = Cesium.Cartesian3.fromRadians(positions.longitude, positions.latitude, 0.0)
      let offset = Cesium.Cartesian3.fromRadians(positions.longitude, positions.latitude, newHeight)
      let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3())
      primitive.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
      return primitive
    },
    // 编辑线
    editPolyline(objId) {
      var oldPositions = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)

      //进入编辑状态
      this.tracker.polylineDrawer.showModifyPolyline(
        oldPositions,
        positions => {
          this.shapeDic[objId] = positions
          this.showPolyline(objId, positions)
        },
        () => {
          this.showPolyline(objId, oldPositions)
        }
      )
    },
    // 绘制矩形
    drawRectangle() {
      this.flag = 0
      this.tracker.trackRectangle(positions => {
        var objId = new Date().getTime()
        this.shapeDic[objId] = positions
        this.showRectangle(objId, positions)
      })
    },
    showRectangle(objId, positions) {
      var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
      var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
      var rect = Cesium.Rectangle.fromCartesianArray(positions)
      var arr = [
        rect.west,
        rect.north,
        rect.east,
        rect.north,
        rect.east,
        rect.south,
        rect.west,
        rect.south,
        rect.west,
        rect.north
      ]
      var outlinePositions = Cesium.Cartesian3.fromRadiansArray(arr)
      var bData = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'Rectangle',
        polyline: {
          positions: outlinePositions,
          clampToGround: true,
          width: 2,
          material: outlineMaterial
        },
        rectangle: {
          coordinates: rect,
          material: material
        }
      }
      var entity = this.viewer.entities.add(bData)
    },
    // 编辑矩形
    editRectangle(objId) {
      var oldPositions = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)

      //进入编辑状态
      this.tracker.rectDrawer.showModifyRectangle(
        oldPositions,
        positions => {
          this.shapeDic[objId] = positions
          this.showRectangle(objId, positions)
        },
        () => {
          this.showRectangle(objId, oldPositions)
        }
      )
    },
    // 绘制多边形
    drawPolygon() {
      this.flag = 0
      this.tracker.trackPolygon(positions => {
        var objId = new Date().getTime()
        this.shapeDic[objId] = positions
        this.showPolygon(objId, positions)
      })
    },
    showPolygon(objId, positions) {
      var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
      var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
      var outlinePositions = [].concat(positions)
      outlinePositions.push(positions[0])
      var bData = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'Polygon',
        polyline: {
          positions: outlinePositions,
          clampToGround: true,
          width: 2,
          material: outlineMaterial
        },
        polygon: new Cesium.PolygonGraphics({
          hierarchy: positions,
          asynchronous: false,
          material: material
        })
      }
      var entity = this.viewer.entities.add(bData)
    },
    // 编辑多边形
    editPolygon(objId) {
      var oldPositions = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)

      //进入编辑状态
      this.tracker.polygonDrawer.showModifyPolygon(
        oldPositions,
        positions => {
          this.shapeDic[objId] = positions
          this.showPolygon(objId, positions)
        },
        () => {
          this.showPolygon(objId, oldPositions)
        }
      )
    },
    // 绘制圆
    drawCircle() {
      this.flag = 0
      this.tracker.trackCircle(positions => {
        var objId = new Date().getTime()
        this.shapeDic[objId] = positions
        this.showCircle(objId, positions)
      })
    },
    showCircle(objId, positions) {
      var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
      var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
      })
      var radiusMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#00f').withAlpha(0.7)
      })
      var pnts = this.tracker.circleDrawer._computeCirclePolygon(positions)
      var dis = this.tracker.circleDrawer._computeCircleRadius3D(positions)
      dis = (dis / 1000).toFixed(3)
      var text = dis + 'km'
      var bData = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'Circle',
        position: positions[0],
        label: {
          text: text,
          font: '16px Helvetica',
          fillColor: Cesium.Color.SKYBLUE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          eyeOffset: new Cesium.ConstantProperty(new Cesium.Cartesian3(0, 0, -9000)),
          pixelOffset: new Cesium.Cartesian2(16, 16)
        },
        billboard: {
          image: 'images/circle_center.png'
        },
        polyline: {
          positions: positions,
          clampToGround: true,
          width: 2,
          material: radiusMaterial
        },
        polygon: new Cesium.PolygonGraphics({
          hierarchy: pnts,
          asynchronous: false,
          material: material
        })
      }
      var entity = this.viewer.entities.add(bData)

      var outlineBdata = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'Circle',
        polyline: {
          positions: pnts,
          clampToGround: true,
          width: 2,
          material: outlineMaterial
        }
      }
      var outlineEntity = this.viewer.entities.add(outlineBdata)
    },
    // 编辑绘制圆
    editCircle(objId) {
      var oldPositions = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)

      //进入编辑状态
      this.tracker.circleDrawer.showModifyCircle(
        oldPositions,
        positions => {
          this.shapeDic[objId] = positions
          this.showCircle(objId, positions)
        },
        () => {
          this.showCircle(objId, oldPositions)
        }
      )
    },
    // 直线箭头
    straightArrow() {
      this.flag = 0
      this.tracker.trackStraightArrow(positions => {
        var objId = new Date().getTime()
        this.shapeDic[objId] = positions
        this.showStraightArrow(objId, positions)
      })
    },
    showStraightArrow(objId, positions) {
      var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
      var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
      })
      var outlinePositions = [].concat(positions)
      outlinePositions.push(positions[0])
      var bData = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'StraightArrow',
        polyline: {
          positions: outlinePositions,
          clampToGround: true,
          width: 2,
          material: outlineMaterial
        },
        polygon: new Cesium.PolygonGraphics({
          hierarchy: positions,
          asynchronous: false,
          material: material
        })
      }
      var entity = this.viewer.entities.add(bData)
    },
    // 编辑直线箭头
    editStraightArrow(objId) {
      var oldPositions = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)

      //进入编辑状态
      this.tracker.straightArrowDrawer.showModifyStraightArrow(
        oldPositions,
        positions => {
          this.shapeDic[objId] = positions
          this.showStraightArrow(objId, positions)
        },
        () => {
          this.showStraightArrow(objId, oldPositions)
        }
      )
    },
    // 攻击箭头
    attackArrow() {
      this.flag = 0
      this.tracker.trackAttackArrow((positions, custom) => {
        var objId = new Date().getTime()
        this.shapeDic[objId] = {
          custom: custom,
          positions: positions
        }
        this.showAttackArrow(objId, positions)
      })
    },
    showAttackArrow(objId, positions) {
      var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
      var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
      })
      var outlinePositions = [].concat(positions)
      outlinePositions.push(positions[0])
      var bData = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'AttackArrow',
        polyline: {
          positions: outlinePositions,
          clampToGround: true,
          width: 2,
          material: outlineMaterial
        },
        polygon: new Cesium.PolygonGraphics({
          hierarchy: positions,
          asynchronous: false,
          material: material
        })
      }
      var entity = this.viewer.entities.add(bData)
    },
    // 编辑攻击箭头
    editAttackArrow(objId) {
      var old = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)

      this.tracker.attackArrowDrawer.showModifyAttackArrow(
        old.custom,
        (positions, custom) => {
          //保存编辑结果
          this.shapeDic[objId] = {
            custom: custom,
            positions: positions
          }
          this.showAttackArrow(objId, positions)
        },
        () => {
          this.showAttackArrow(objId, old.positions)
        }
      )
    },
    // 钳击箭头
    pincerArrow() {
      this.flag = 0
      this.tracker.trackPincerArrow((positions, custom) => {
        var objId = new Date().getTime()
        this.shapeDic[objId] = {
          custom: custom,
          positions: positions
        }
        this.showPincerArrow(objId, positions)
      })
    },
    showPincerArrow(objId, positions) {
      var material = Cesium.Color.fromCssColorString('#ff0').withAlpha(0.5)
      var outlineMaterial = new Cesium.PolylineDashMaterialProperty({
        dashLength: 16,
        color: Cesium.Color.fromCssColorString('#f00').withAlpha(0.7)
      })
      var outlinePositions = [].concat(positions)
      outlinePositions.push(positions[0])
      var bData = {
        layerId: this.layerId,
        objId: objId,
        shapeType: 'PincerArrow',
        polyline: {
          positions: outlinePositions,
          clampToGround: true,
          width: 2,
          material: outlineMaterial
        },
        polygon: new Cesium.PolygonGraphics({
          hierarchy: positions,
          asynchronous: false,
          material: material
        })
      }
      var entity = this.viewer.entities.add(bData)
    },
    // 编辑钳击箭头
    editPincerArrow(objId) {
      var old = this.shapeDic[objId]

      //先移除entity
      this.clearEntityById(objId)

      this.tracker.pincerArrowDrawer.showModifyPincerArrow(
        old.custom,
        (positions, custom) => {
          //保存编辑结果
          this.shapeDic[objId] = {
            custom: custom,
            positions: positions
          }
          this.showPincerArrow(objId, positions)
        },
        () => {
          this.showPincerArrow(objId, old.positions)
        }
      )
    },
    // 坐标查询
    posMeasure() {
      this.flag = 0
      this.tracker.pickPosition((position, lonLat) => {
        console.log('坐标查询', position, lonLat)
      })
    },
    // 空间距离
    spaceDisMeasure() {
      this.flag = 0
      this.tracker.pickSpaceDistance((positions, rlt) => {
        console.log('空间距离', positions, rlt)
      })
    },
    // 贴地距离
    stickDisMeasure() {
      this.flag = 0
      this.tracker.pickStickDistance((positions, rlt) => {
        console.log('贴地距离', positions, rlt)
      })
    },
    // 面积量算
    areaMeasure() {
      this.flag = 0
      this.tracker.pickArea((positions, rlt) => {
        console.log('面积量算', positions, rlt)
      })
    }
}
```

Copyright (c) 2023-02-09, 32237384@qq.com
