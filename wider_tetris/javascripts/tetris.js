var Board = function(options) {

  // initialize logic
  var options = options || {}
  var self = this

  // number of rows and columns (height, width)

  this.deviceWidth = window.innerWidth
  this.deviceHeight = window.innerHeight

  this.sliceSize = Math.floor( 200*(80/this.deviceWidth) ) || 1
  if (this.sliceSize < 18)  { 
    this.sliceSize = 18 
  } else if (this.sliceSize > 25) {
    this.sliceSize = 25
  }
  // console.log("sliceSize", this.sliceSize)

  this.width = options.width || Math.floor(this.deviceWidth/this.sliceSize)
  this.height = options.height || Math.floor(this.deviceHeight/this.sliceSize)
  this.refreshRate = options.refreshRate || 300
  this.id = options.id || "main-container"

  // events

  this.events = {
    "keydown": function(ev){
      self.move.bind(self)
      return self.move(ev)
    },
    "keyup": function(ev){
      self.actions.bind(self)
      return self.actions(ev)
    },
    "click": function(ev){
      console.log("clicked!", ev)
      if ( ev.target.classList.contains("filled") ) {
        self.actions.bind(self)
        return self.actions({
            keyIdentifier: "Up",
            preventDefault: function(){ return true }
          })
      }
    },
    "touchmove" : function(ev){
      console.log(ev, "touch move!")
    },
    "touchstart" : function(ev){
      self.lastTouchPosition = {
        x: ev.changedTouches[0].clientX,
        y: ev.changedTouches[0].clientY
      }
      // console.log(ev, "touch start!", self.lastTouchPosition)

    },
    "touchmove" : function(ev){
      ev.preventDefault()
      var currentTouchPosition = {
        x: ev.changedTouches[0].clientX,
        y: ev.changedTouches[0].clientY
      }
      var changeIn = function(pos1, pos2){
        var change = {
          x: pos2.x-pos1.x,
          y: pos2.y-pos1.y
        }
        if (Math.abs(change.x) < 100 && change.y > 0) {
          // down
          console.log("moving down!")
          self.move({
            keyIdentifier: "Down",
            preventDefault: function(){ return true }
          })
        } else if (Math.abs(change.x) == 0 && change.y < 0) {
          console.log("moving up!")
          self.actions({
            keyIdentifier: "Up",
            preventDefault: function(){ return true }
          })
        } else if ( change.x < 0) {
          console.log("moving left!")
          self.move({
            keyIdentifier: "Left",
            preventDefault: function(){ return true }
          })
        } else if ( change.x > 0 ) {
          console.log("moving right!")
          self.move({
            keyIdentifier: "Right",
            preventDefault: function(){ return true }
          })

        }
        return change
      }
      // console.log(ev, "touch move", currentTouchPosition, self.lastTouchPosition)
      console.log("change", changeIn(self.lastTouchPosition, currentTouchPosition))
    }
  }

  this.errorCounter = 0

  this.activeCells = []

  var dynamicStyle = document.createElement('style')

  // speed improvement over dynamically adding style
  dynamicStyle.innerText = [
    ".row {",
      "height: ", self.sliceSize, ";",
    "}",
    ".cell {",
      "width: ", self.sliceSize, ";",
    "}",
    "#main-container {",
      "width: ", self.deviceWidth+"px",
    "}"
  ].join("")

  document.head.appendChild(dynamicStyle)

  this.el = document.getElementById(this.id)

  // clear contents if any
  while (this.el.firstChild) {
    this.el.removeChild(this.el.firstChild)
  }

  // clear Timers if any
  this.stopGame()

  // this.currentRowIndex = 0

  this.currentPosition = {
    y: 0,
    // start mid-board
    x: Math.floor(this.width/2)
  }



  // set to random starting shape
  self.currentShape = new Shape()
  self.currentRotationIndex = 0


  this.matrix = []

  for (var row = 0; row < this.height; row += 1) {
    this.matrix.push([])
    for (var col = 0; col < this.width; col += 1) {
      this.matrix[row].push(0)
    }
  }

  
  this.gridEl = document.createElement('div')
  this.gridEl.id = "grid"
  this.el.appendChild(this.gridEl)
  // document.getElementById('main-container').appendChild(this.el)

  // creates DOM grid
  this.buildGrid()

  // sets refresh logic
  this.refresh = setInterval(function(){
    self.updateBoard()
  }, 66)

  this.startGame()


  // bind Events

  this.bindEvents()

}

Board.prototype.toString = function(){
  var height = ""
  this.matrix.forEach(function(row, idx){
    // console.log("row:", idx)
    height += row.toString()+"</br>"
  })
  return height
}

Board.prototype.startGame = function(){
  var self = this
  self.game = setInterval(
    (function(){
      // initialize i
      self.currentRowIndex = 0
      // set start position
      self.changeCurrentPostion()

      return function() {
        // reset last row

        self.move({
          keyIdentifier: "Down",
          preventDefault: function(){ return true }
        })

        // self.changeCurrentPostion(nextPosition)

        if (self.currentRowIndex < self.height-1) {
          self.currentRowIndex += 1
        } else {
          // self.reset()
          // stamp current position
          // self.changeCurrentPostion(self.currentPosition, "stamp")

          // self.changeCurrentPostion({y: 0, x: self.currentPosition.x}, "stamp")
          // self.currentShape = new Shape()
          // self.renderShape(self.currentShape.name)


          self.stampAndMakeNewShape()
          // self.stopGame()
          // self.currentRowIndex = 0
        }
        
      }

    })(),this.refreshRate
  )

  return self.game
}

Board.prototype.currentPositions = function(){
  var self = this
  var positions = []

  positions.push(this.currentPosition)

  this.currentShape.rotations[this.currentRotationIndex].forEach(function(rotationMod){
    positions.push({
      x: self.currentPosition.x+rotationMod.x,
      y: self.currentPosition.y+rotationMod.y
    })
  })
  return positions
}

Board.prototype.buildGrid = function(){
  var self = this

  while (this.gridEl.firstChild) {
    this.gridEl.removeChild(this.gridEl.firstChild)
  }

  this.matrix.forEach(function(value, rowIdx){
    
    var row = document.createElement('div')
    row.classList.add('row')
    row.classList.add('r'+rowIdx)
    self.matrix[rowIdx].forEach(function(value, colIdx){

      var cell = document.createElement('span')
      cell.className = 'cell '+rowIdx+'_'+colIdx
      if (value > 0) {
        cell.classList.add("filled")
        self.activeBoxes.push(cell)
      }

      cell.innerHTML = "&nbsp;"

      row.appendChild(cell)

    })

    self.gridEl.appendChild(row)

  })
}

Board.prototype.updateBoard = function(){
  // plain 0s and 1s
  // this.el.innerHTML = this.toString()

  var self = this

  // remove any existing filled boxes

  while (self.activeCells.length > 0) {
    var oldCell = self.activeCells.pop()
    // comment this out for cool trails effect
    oldCell.classList.remove("filled")
  }

  this.matrix.forEach(function(value, rowIdx){
    self.matrix[rowIdx].forEach(function(value, colIdx){

      if (value > 0) {
        // debugger
        var activeCell = document.getElementsByClassName('cell '+rowIdx+'_'+colIdx)[0]
        // debugger
        if (activeCell !== undefined) { 
          activeCell.classList.add("filled")
          self.activeCells.push(activeCell)
        }
      }

    })

  })

}

Board.prototype.removeTrails = function(){

  var self = this

  self.currentPositions().forEach(function(position){
    var cell = document.getElementsByClassName("cell "+position.y+"_"+position.x)[0]
    // console.log(cell, "cell!")
    if (cell) cell.classList.remove("filled")
    if (self.matrix[position.y]) self.matrix[position.y][position.x] = 0
  })

}

Board.prototype.stopGame = function(){
  clearInterval(this.game)
  clearInterval(this.refresh)
  this.unbindEvents()
}

Board.prototype.resetGame = function(){

  this.stopGame()

  setTimeout(function(){
    window.b = new Board()
  }, 1000)

}

Board.prototype.reset = function(){
  // console.log(this.matrix)
  // debugger
  var self = this
  self.matrix.forEach(function(value, y){
    self.matrix[y].forEach(function(value, x){
      // if (self.matrix[y][x] !== 3 ) {
        self.matrix[y][x] = 0
      // }
    })
  })
}

Board.prototype.clearRow = function(rowNum){
  var self = this
  // debugger
  this.matrix[rowNum-1].forEach(function(column, colIdx){
    // column.forEach(function(cell){
      self.matrix[rowNum-1][colIdx] = 0

      // clear lingering player position
      setTimeout(function(){
        self.matrix[rowNum-1][colIdx] = 0
      }, 500)
    // })
  })
}

Board.prototype.stampAndMakeNewShape = function(){

  var self = this

  // validate future position
  var futurePositions = this.currentShape.previewMove(self, {y: 0, x: parseInt(this.width/2)})
  if ( !this.isValidPosition({}, futurePositions) ) {
    // console.log("invalid future position!")
    // debugger
    // console.log("you lose!")
    if (this.errorCounter > 3) {
      console.log("you lose!")
      this.resetGame()
    } else {
      console.log("invalid future position!")
      // debugger
      // this.clearRow(1)
      this.errorCounter += 1
    }
    
    // this.resetGame()
  }

  // check for Tetris?
  this.checkForTetris()

  this.changeCurrentPostion({y: 0, x: parseInt(this.width/2)}, "stamp")
  this.removeTrails()
  this.currentShape = new Shape()
  this.renderShape(this.currentShape.name)
  this.currentRowIndex = 0

  

}

Board.prototype.actions = function(ev){
  var direction = ev.keyIdentifier
  // console.log("key", keyName, ev)
  switch( direction ) {
    case "Up":
      // . key
      // rotate right
      ev.preventDefault()
      // TODO: fix wall stopping bug
      this.removeTrails()
      this.currentRotationIndex += 1
      this.renderShape(this.currentShape.name, this.currentRotationIndex)
      break
  } 
  return false
}

Board.prototype.move = function(ev){
  
  var direction = ev.keyIdentifier
  switch ( direction ) {
    case "Down":
      ev.preventDefault()
      var newPosition = { y: this.currentPosition.y+1, x: this.currentPosition.x }
      break
    case "Left":
      ev.preventDefault()
      var newPosition = { y: this.currentPosition.y, x: this.currentPosition.x-1 }
      break
    case "Right":
      ev.preventDefault()
      var newPosition = { y: this.currentPosition.y, x: this.currentPosition.x+1 }
      break
      // console.log("no movement", ev)
  }

  // TODO: figure out way preview future positions without doing this
  if (newPosition && this.isValidPosition({}, this.currentShape.previewMove(this, newPosition)) ) {
    // console.log("old positions", this.currentPositions() )
    this.removeTrails()
    this.changeCurrentPostion(newPosition)
    this.updateBoard()

    // console.log("new postions", this.currentPositions() )
  } else if (direction == "Down" && !this.isValidPosition({}, this.currentShape.previewMove(this, newPosition)) ) {
  // this.setCurrentPostion()
    // console.log("invalid down!", this.currentRowIndex)
    // this.stampAndMakeNewShape()
    if (this.currentRowIndex !== 0 ) {
      // this.removeTrails()
      this.renderShape(this.currentShape.name, this.currentRotationIndex, "stamp")
      this.updateBoard()
      this.stampAndMakeNewShape()
      // this.updateBoard()
    } else {
      // debugger
      console.log("you lose!")
      this.resetGame()
    }
    
  }
  return false

}

Board.prototype.changeCurrentPostion = function(newPosition, mode){
  var self = this
  // this.reset()

  // console.log("currentPosition x:", self.currentPosition.x, " y:", self.currentPosition.y)
  // if (newPosition) console.log("newPosition x:", newPosition.x, " y:", newPosition.y)
  var mode = mode || "default"

  if (newPosition !== undefined && self.isValidPosition(newPosition) ) {
    if (mode === "stamp") {
      // debugger
      this.matrix[this.currentPosition.y][this.currentPosition.x] = 3
    } else {
      this.matrix[this.currentPosition.y][this.currentPosition.x] = 0
    }
    // this.removeTrails()
    this.currentPosition = newPosition
    this.matrix[newPosition.y][newPosition.x] = 1
    
  } else {
    // console.log("blocked!")
    // debugger
  }
  
  self.renderShape()
  this.updateBoard()
  

}

Board.prototype.renderShape = function(name, rotationIndex, mode){
  var self = this
  var mode = mode || "default"
  
  var shapeName = name || self.currentShape.name
  var rotationIndex = rotationIndex || self.currentRotationIndex || 0

  if ( Shape.prototype.shapes[shapeName][rotationIndex] ) {
    var rotation = Shape.prototype.shapes[shapeName][rotationIndex]
  } else {
    // reset current rotation
    self.currentRotationIndex = 0
    var rotation = Shape.prototype.shapes[shapeName][self.currentRotationIndex]
  }

  rotation.forEach(function(piece){

    // console.log(piece)
    var newPieceY = self.currentPosition.y+piece.y
    var newPieceX = self.currentPosition.x+piece.x
    if ( self.matrix[newPieceY] && self.isValidPosition({y: newPieceY, x: newPieceX})) {
      if (mode === "stamp") {
        // debugger
        // self.matrix[self.currentPosition.y][self.currentPosition.x] = 3
        self.matrix[newPieceY][newPieceX] = 3
        document.getElementsByClassName('cell '+newPieceY+'_'+newPieceX)[0].classList.add("filled")
        // stamp center
        self.matrix[self.currentPosition.y][self.currentPosition.x] = 3
        document.getElementsByClassName('cell '+self.currentPosition.y+'_'+self.currentPosition.x)[0].classList.add("filled")
      } else {
        self.matrix[newPieceY][newPieceX] = 1
      }
    } else {
      // handle case of piece not fitting the dimensions of the space here

      // console.log("invalid piece!")
    }
    

  })
}

Board.prototype.checkForTetris = function(){
  var self = this
  var winningSum = this.width*3
  // console.log(winningSum, "winningSum")
  var currentHighestSum = 0
  this.matrix.forEach(function(rowArray, rowIdx){
    var rowSum = 0
    rowArray.forEach(function(cell){
      // console.log("rowSum", rowSum, cell)

      rowSum += parseInt(cell)
      // console.log("rowSum", rowSum)
    })
    if (rowSum === winningSum) {
      var maxRow = document.getElementsByClassName('r'+(rowIdx) )[0]
      if (maxRow)  {
        maxRow.classList.add('cleared')
        _.each( maxRow.childNodes, function(cell) {
          if (cell) cell.classList.remove("filled")
            self.clearRow(rowIdx+1)
        })
        setTimeout(function(){
          maxRow.classList.remove('cleared')
        },500)
        console.log("cleared", rowSum, rowIdx )
        console.log(self.matrix[rowIdx])
      }
      // currentHighestSum = rowSum
    }
  })
  // console.log(currentHighestSum, "currentHighestSum")
  rowSum = 0
}

// Board EVENTS

Board.prototype.bindEvents = function(){

  var self = this;

  // set keybindings
  document.addEventListener("keydown", this.events.keydown )
  document.addEventListener("keyup", this.events.keyup )

  document.addEventListener("click", this.events.click)

  document.addEventListener("touchstart", this.events.touchstart)
  document.addEventListener("touchmove", this.events.touchmove)
  // document.addEventListener("touchmove", this.events.touchmove)

}

Board.prototype.unbindEvents = function(){
  document.removeEventListener("keydown", this.events.keydown, false)
  document.removeEventListener("keyup", this.events.keyup, false)
}


Board.prototype.isValidPosition = function(newPosition, positionsArray){
  var self = this
  // if (newPosition && newPosition.y == 0) debugger
  if (!positionsArray) {
    // check to see if located above 0th row
    if (newPosition.y < 0 && newPosition.y >= -3) {
      return true
    } else if (newPosition.y < -3) {
      return false
    }
            //validates that new position is within board 
    return newPosition.y < this.height &&
            // clearance of 5 non-existant squares fixes issues with certain longer shapes
           newPosition.y >= -3 && 
           newPosition.x < this.width && 
           newPosition.x >= 0 &&
           (this.matrix[newPosition.y] ? (this.matrix[newPosition.y][newPosition.x] !== 3) : false )
  } else {
    // debugger 
    var result = true
    positionsArray.forEach(function(position){
      if ( !self.isValidPosition(position) ) {
        result = false
      }
    })
    return result
  }
}

// SHAPES

var Shape = function(name){
  if (!name || name === "random") {
    name = this.getShapeNames().sample()
  }
  this.name = name || "dot"
  this.rotations = this.shapes[name]

}

Shape.prototype.isValidMove = function(board){
  var self = this
  var result = true
  var rotation = this.rotations[board.currentRotationIndex] 
  
  rotation.forEach(function(positionModifier){
    var newPosition = {
      x: board.currentPosition.x+positionModifier.x,
      y: board.currentPosition.y+positionModifier.y
    }
    if (!board.isValidPosition({
      x: newPosition.x,
      y: newPosition.y
    })) {
      result = false
    }
  })

  return result
}

Shape.prototype.previewMove = function(board, destinationPosition){
  // returns an array of points that would be made in a move
  // debugger
  var currentRotationModifiers = this.rotations[board.currentRotationIndex]
  var futureOccupiedPositions = []
  currentRotationModifiers.forEach(function(modifiers){
    futureOccupiedPositions.push({
      x: destinationPosition.x+modifiers.x,
      y: destinationPosition.y+modifiers.y
    })
  })
  return futureOccupiedPositions
}

Shape.prototype.shapes = {

    // position modifiers (relative to current post)

    // shape[name][roation][pieceIndex]

    // dot: [
    //   [
    //     {x: 0, y: 0}
    //   ]
    // ]
    pGram1: [
      // first rotation
      [
        {x: 0, y: 0},
        {x: 1, y: 0},
        {x: 1, y: 1},
        {x: 2, y: 1}
      ],
      // second rotation
      [
        {x: 0, y: 0},
        {x: 0, y: -1},
        {x: 1, y: -1},
        {x: 1, y: -2}
      ],
      // third rotation
      [
        {x: 0, y: 0},
        {x: -1, y: 0},
        {x: -1, y: -1},
        {x: -2, y: -1}
      ],
      // fourth rotation
      [
        {x: 0, y: 0},
        {x: 0, y: -1},
        {x: -1, y: -1},
        {x: -1, y: -2}
      ]
    ],
    square: [
      // first rotation
      [
        {x: 0, y: 0},
        {x: 0, y: 1},
        {x: 1, y: 0},
        {x: 1, y: 1}
      ]
    ],
    line: [
      // first rotation
      [
        {y: 0, x: 0},
        {y: 1, x: 0},
        {y: 2, x: 0},
        {y: 3, x: 0}
      ],
      // second rotation
      [
        {y: 0, x: 0},
        {y: 0, x: 1},
        {y: 0, x: 2},
        {y: 0, x: 3}
      ],
      // third rotation
      [
        {y: 0, x: 0},
        {y: -1, x: 0},
        {y: -2, x: 0},
        {y: -3, x: 0}
      ],
      // fourth rotation
      [
        {y: 0, x: 0},
        {y: 0, x: -1},
        {y: 0, x: -2},
        {y: 0, x: -3}
      ]
    ]
}

Shape.prototype.getShapeNames = function(){

  var names = []
  for (key in Shape.prototype.shapes) {
    names.push(key)
  }
  return names
}


// HELPERS

Array.prototype.sample = function() {
  // returns a random element from the array
  return this[Math.floor(Math.random()*this.length)]
}