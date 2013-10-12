var app = {
	initialize: function(){
		
		//could be options
		app.board.$el = $('#game_board');
		app.board.width = app.board.$el.width();
		app.board.height = app.board.$el.height();
		app.player.radius = 20;
		app.player.start_x = aux.get_random_x()-100;
		app.player.start_y = aux.get_random_y()-100;
		app.player.start_inner_color = "#f00";
		app.player.start_stroke_color = "#000";
		app.player.start_stroke_width = 5
		app.board.score = 0;
		

		app.board.canvas = Raphael("game_board", app.board.width, app.board.height);
		app.player.avatar = app.board.canvas.circle(app.player.start_x, app.player.start_y, app.player.radius)
		//set colors
		app.player.avatar.attr("fill",app.player.start_inner_color)
						 .attr("stroke",app.player.start_stroke_color)
						 .attr("stroke-width",app.player.start_stroke_width)

		$(document).on('keydown',app.keydown_callback);

		//make a bunch of circles

		for(var i = 0; i < 500; i++) {
			app.action.shoot();
		}

	},
	board: {
		updateScore: function(){
			app.board.score = app.collisions.getTotal()
			$('#score_display').text(app.board.score)
		},
		changeColors: function(score){
			switch (score){
				case 50:
					_.map(app.collisions.circles,function(circle){
						// console.log(circle)
						circle[2].animate({ fill: "#00f"},1000);
					});
					break;
				case 100:
					_.map(app.collisions.circles,function(circle){
						circle[2].animate({fill: "#f00"},1000);
					});
			}
		}
	},
	circles: [],
	collisions: { 
		circles: [],
		getTotal: function(){
			var new_total = _.uniq(app.collisions.circles).length;
			// need to debug
			// app.board.changeColors(new_total);
			return new_total
		}
	},
	player: {
		getCurrentPosition: function(){
			
			var pos = {
				x: app.player.avatar.attrs.cx, 
				y: app.player.avatar.attrs.cy
			};
			// console.log(pos)
			return pos;
		}

	},
	action: {
		shoot: function(){
			
			var source = app.player.getCurrentPosition();
			// console.log(source)
			var x = source.x,
				y = source.y,
				stroke_width = 5,
				radius = 20;

			var new_circle = app.board.canvas.circle(x, y, radius)
			
				new_circle.attr("stroke-width",stroke_width);

			// var new_circle = new app.Bubble(source)
			// app.circles.push(new_circle)
			var random_x = aux.get_random_x();
			var random_y = aux.get_random_y();
			
			// console.log(random_x,random_y);
			new_circle.animate(
				{
					cx: random_x, 
					cy: random_y 
				},500,"bounce")

			//adds newly crated circle to circles array.
			app.circles.push([random_x,random_y,new_circle])
		},
		collide: function(player_pos){
			//the range of the search
			var tolerance = 30;

			function is_close(p1,p2){
				return (p1 <= (p2+tolerance) && p1 >= (p2-tolerance))
			}

			//check if close to any x's
			var x_matches = _.select(app.circles,
				function(circle) {
				if(is_close(circle[0],player_pos.x)){
					return true;
				}
			});

			//check if close to any y's in result of previous check
			var y_matches = _.select(x_matches,function(circle){
				if(is_close(circle[1],player_pos.y)){
					return true
				}
			})
			
			if(y_matches.length !== 0){
				_.each(y_matches,function(circle){
					var circle_x = toString(circle[0]),
						circle_y = toString(circle[1]),
						circle_el = circle[2];

					circle_el.animate({fill: "#0f0"},1000);

					app.collisions.circles.push(circle)

					//need to run this waaaaay less frequently
					app.board.updateScore();
				})
			}
			return true
		}
	},
	movement: {
		//movement steps/rates
		rate: 2,
		step: 3,
		//Targets are Raphael Elements
		slide: function(target, direction_name, e){
			
			var old_val, 
				new_val, 
				keyname,
				destination = {};

			switch(direction_name) {
				case "up":
					e.preventDefault();
					keyname = "cy";
					old_val = target.attrs[keyname];
					new_val = old_val += app.movement.step;
					destination[keyname] = new_val
					break;
				case "left":
					e.preventDefault();
					keyname = "cx";
					old_val = target.attrs[keyname]
					new_val = old_val -= app.movement.step;
					destination[keyname] = new_val
					break;
				case "right":
					e.preventDefault();
					keyname = "cx";
					old_val = target.attrs[keyname]
					new_val = old_val += app.movement.step;
					destination[keyname] = new_val
					break;
				case "down":
					e.preventDefault();
					keyname = "cy";
					old_val = target.attrs[keyname];
					new_val = old_val -= app.movement.step;
					destination[keyname] = new_val
					break;
			}

			target.animate(destination, app.movement.rate, "bounce", function(){
				var pos = app.player.getCurrentPosition()
				app.action.collide(pos);
			})
			
		}
	},
	keydown_callback: function(e){

			var key_num = e.keyCode,
				key_name = aux.key_to_s(key_num)
			
			if(key_name === "space") {
				e.preventDefault()
				app.action.shoot();
			
			} else {

				app.movement.slide(app.player.avatar, key_name, e)
			
			}
			
		}
};

var aux = {
	key_to_s: function (key_code){
		switch(key_code){
			case 40:
				return "up"
			case 38:
				return "down"
			case 37:
				return "left"
			case 39:
				return "right"
			case 32:
				return "space"
		}
	},
	get_random_x: function(){
		return parseInt( ( Math.random()*app.board.width) + 1 );
	},
	get_random_y: function(){
		return parseInt( ( Math.random()*app.board.height) + 1 );
	}
}

$(function(){

	app.initialize();

})