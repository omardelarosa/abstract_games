var AppRouter = Backbone.Router.extend({

  routes: {

    "" : "home"

  },

  home: function(){
    console.log("home")
  }

})

$(function(){

  var app_router = new AppRouter()

  Backbone.history.start()

  window.b = new Board()

  // test

  // b.matrix[20][1] = 3
  // b.matrix[20][2] = 3
  // b.matrix[20][3] = 3
  // b.matrix[20][4] = 3
  // b.matrix[20][5] = 3
  // b.matrix[20][6] = 3

  b.matrix[20].forEach(function(col, colIdx){
    // if (col !== 10 || col !== 11 || col !== 12) { 
      b.matrix[20][colIdx] = 3
    // }
  })

  // document.getElementsByClassName('cell 20_6')[0].innerHTML = "<a href='http://google.com' target='_blank'>link</a>"

})