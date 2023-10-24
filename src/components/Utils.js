
export function getPolygonPoints(item) {
    // item is a marinaItem object
    // returns an array of points that define the polygon
    var x = item.defaultPosition.x + item.newPosition.x
    var y = item.defaultPosition.y + item.newPosition.y
    var angle = item.angle
    var length = item.length
    var width = item.width
  
    // TODO: add logic to calculate boats at an angle
  
    var topleft = [x - width / 2, y - length / 2]
    var topright = [x + width / 2, y - length / 2]
    var bottomright = [x + width / 2, y + length / 2]
    var bottomleft = [x - width / 2, y + length / 2]
    return [topleft, topright, bottomright, bottomleft]
  }