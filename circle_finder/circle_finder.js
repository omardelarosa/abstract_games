var app = {

	name: "circle.finder",

	initialize: function(){
		
		//set name of game at the top.
		app.name.$el = $("#game_name").text(app.name);

		//clear old state or start empty new one.
		app.circles = [];
		app.collisions.circle_ids = [];

		//options
		app.movement.rate = 2;
		app.movement.step = 3;

		app.board.$el = app.board.$el || $('#game_board');
		app.board.start_size = (function(){
			var size_input = $('#puzzle_size_input').val();

			if (size_input && size_input !== "") {
				return parseInt(size_input)
			} else {
				return false;
			}
		}()) || 100;

		app.board.width = app.board.$el.width();
		app.board.height = app.board.$el.height();
		app.player.radius = 20;

		app.player.start_x = aux.get_random_x()-100;
		app.player.start_y = aux.get_random_y()-100;
		app.player.start_inner_color = "#f00";
		app.player.start_stroke_color = "#000";
		app.player.start_stroke_width = 5
		app.board.score = 0;
		
		//render based on options
		app.board.canvas = Raphael("game_board", app.board.width, app.board.height);
		app.player.avatar = app.board.canvas.circle(app.player.start_x, app.player.start_y, app.player.radius)
		//set colors
		app.player.avatar.attr("fill",app.player.start_inner_color)
						 .attr("stroke",app.player.start_stroke_color)
						 .attr("stroke-width",app.player.start_stroke_width)

		

		$(document).on('keydown',app.keydown_callback);

		//make a bunch of circles
		for(var i = 0; i < app.board.start_size; i++) {
			app.action.shoot();
			$('#current_score').text("0");
			$('#max_score').text("/ "+(i+1));
		}
	},
	board: {
		size: function(){
			return app.circles.length;
		},
		reset: function(){
			app.board.$el.empty();
			app.initialize();
		},
		render: function(){

			app.board.canvas = Raphael("game_board", app.board.width, app.board.height);
			app.player.avatar = app.board.canvas.circle(app.player.start_x, app.player.start_y, app.player.radius)
			//set colors
			app.player.avatar.attr("fill",app.player.start_inner_color)
							 .attr("stroke",app.player.start_stroke_color)
							 .attr("stroke-width",app.player.start_stroke_width)

			app.name.$el = $("#game_name").text(app.name);
			app.board.$el = $('#game_board');

			$(document).on('keydown',app.keydown_callback);

			//make a bunch of circles

			for(var i = 0; i < app.board.size(); i++) {
				app.action.shoot();
				$('#score_display').text("0 / "+(i+1));
			}

		},
		updateScore: function(){
			app.board.score = app.collisions.getTotal()
			$('#current_score').text(app.board.score)
			$('#max_score').text(" / "+app.board.size())
		},
		changeColors: function(score){
			switch (score){
				case 50:
					_.map(app.collisions.circle_ids,function(circle){
						// console.log(circle)
						circle[2].animate({ fill: "#00f"},1000);
					});
					break;
				case 100:
					_.map(app.collisions.circle_ids,function(circle){
						circle[2].animate({fill: "#f00"},1000);
					});
			}
		}
	},
	collisions: { 
		getTotal: function(){
			var new_total = app.collisions.circle_ids.length;
			// need to debug/add eventually
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
		toggleOptions: function(e){
			e.preventDefault();
			var $button = $('#more_button'),
				$options = $('#game_options');

			if ($button.text() === "+") {
				$button.text("-")
				$options.show()
			} else {
				$button.text("+")
				$options.hide()
			}
		},
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
			app.circles.push([new_circle.id, random_x, random_y, new_circle])
			app.board.updateScore()
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
				if(is_close(circle[1],player_pos.x)){
					return true;
				}
			});

			//check if close to any y's in result of previous check
			var y_matches = _.select(x_matches,function(circle){
				if(is_close(circle[2],player_pos.y)){
					return true
				}
			})
			
			if(y_matches.length !== 0){
				_.each(y_matches,function(circle){
					var circle_x = toString(circle[1]),
						circle_y = toString(circle[2]),
						circle_el = circle[3];

					circle_el.animate({fill: "#0f0"},1000);

					if ( _.indexOf(app.collisions.circle_ids,circle[0]) === -1 ) {
						app.collisions.circle_ids.push(circle[0])
					}
					//need to run this waaaaay less frequently
					app.board.updateScore();
				})
			}
			return true
		}
	},
	movement: {
		//movement steps/rates
		
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

			target.animate(destination, app.movement.rate, function(){
				var pos = app.player.getCurrentPosition()
				app.action.collide(pos);
			})
			
		}
	},
	keydown_callback: function(e){

			var key_num = e.keyCode,
				key_name = aux.key_to_s(key_num),
				key_bindings = ["space","o","up","down","left","right"];

			var command_index = _.indexOf(key_bindings,key_name);

			switch (command_index) {
				case -1:
					break;
				case 0:
					e.preventDefault()
					app.action.shoot();
					break;
				case 1:
					app.action.toggleOptions(e)
				default:
					app.movement.slide(app.player.avatar, key_name, e)
					break;
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
			case 79:
				return "o"
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

	//bind options behavior

	$('#more_button').on('click',app.action.toggleOptions);
	$('#reset_button').on('click',app.board.reset)

})