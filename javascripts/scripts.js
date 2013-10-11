var app = {
	initialize: function(){
		
		//could be options
		app.board.width = window.innerWidth;
		app.board.height = window.innerHeight;
		app.player.radius = 10;
		app.player.start_x = 50;
		app.player.start_y = 40;
		app.player.start_inner_color = "#f00";
		app.player.start_stroke_color = "#fff";

		app.board.canvas = Raphael(0, 0, app.board.width, app.board.height);
		app.player.avatar = app.board.canvas.circle(app.player.start_x, app.player.start_y, app.player.radius)
		//set colors
		app.player.avatar.attr("fill",app.player.start_inner_color).attr("stroke",app.player.start_stroke_color)

		$(document).on('keydown',app.keydown_callback);
	},
	board: {},
	circles: [],
	player: {
		getCurrentPosition: function(){
			var pos = {
				x: app.player.avatar.attrs.cx, 
				y: app.player.avatar.attrs.cy
			};
			return pos;
		}

	},
	action: {
		shoot: function(){
			
			var source = app.player.getCurrentPosition();

			var new_circle = app.board.canvas.circle(source.x, source.y, 10)
			
			// app.circles.push(new_circle)
			var random_x = parseInt( ( Math.random()*app.board.width) + 1 );
			var random_y = parseInt( ( Math.random()*app.board.height) + 1 );
			
			// console.log(random_x,random_y);
			new_circle.animate(
				{
					cx: random_x, 
					cy: random_y 
				},1000
				)
		}
	},
	movement: {
		//movement steps/rates
		rate: 10,
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

			target.animate(destination, app.movement.rate)
		
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
	}
}

$(function(){

	app.initialize();

})