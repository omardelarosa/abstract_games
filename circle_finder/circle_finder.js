var app = {

	name: "circle.finder",

	key: {

		bindings: [ "space",
					"o",
					"b",
					"up",
					"down",
					"left",
					"right",
					"click" ],

		descriptions: [ "shoot circles", 
						"toggle options/instructions", 
						"burn with rage",
						"move up",
						"move down",
						"move left",
						"move right", 
						"teleport to the clicked point" ]
	},

	initialize: function(){
		
		//set name of game at the top.
		app.name.$el = $("#game_name").text(app.name);

		//clear old state or start empty new one.
		app.circles.all = [];
		app.collisions.circle_ids = [];

		//options
		app.movement.rate = 2;
		app.movement.step = 10;

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
		app.player.start_inner_color = "#00f";
		app.player.start_stroke_color = "#000";
		app.player.start_stroke_width = 5
		app.board.other_circle_color = "#f00";
		app.board.score = 0;

		app.board.setBackground();
		
		//render based on options
		app.board.canvas = Raphael("game_board", app.board.width, app.board.height);
		app.player.avatar = app.board.canvas.circle(app.player.start_x, app.player.start_y, app.player.radius)
		//set colors
		app.player.avatar.attr("fill",app.player.start_inner_color)
						 .attr("stroke",app.player.start_stroke_color)
						 .attr("stroke-width",app.player.start_stroke_width)

		
		//event bindings
		$(document).on('keydown',app.keydown_callback);
		$(document).on('click',function(e){
			app.movement.teleport(app.player.avatar,e);
		});

		//make a bunch of circles
		for(var i = 0; i < app.board.start_size; i++) {
			app.action.shoot();
			$('#current_score').text("0");
			$('#max_score').text("/ "+(i+1));
		}

		//
		app.render.instructions();

		
	},
	render: {
		instructions: function(){
			var bindings = app.key.bindings.length,
				i = 0,
				$instructions = $('#instructions'),
				$heading = $('<h2 id="instructions_heading">instructions</h2>');
				$body = $('<ul id="instructions_list"></ul>');


			while(i < bindings) {
				var $li = $("<li class='key_info'></li>"),
					$span1 = $("<span class='key_name'>"+app.key.bindings[i]+":</span>"),
					$span2 = $("<span class='key_desc'>\t"+app.key.descriptions[i]+"</span>");
				$li.append($span1)
				$li.append($span2)
				$body.append($li)

				i++
			}

				$instructions.append($heading).append($body);
		},
		board: function(){
			
			//not in use

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

			//set toggleHandler
			$('#more_button').on('click',app.action.toggleOptions);
			$('#reset_button').on('click',app.board.reset)
		}
	},
	board: {
		size: function(){
			return app.circles.all.length;
		},
		reset: function(){
			app.board.$el.empty();
			app.initialize();
		},
		setBackground: function(hex_string){
			if (hex_string) {
				app.board.$el.css({backgroundColor: hex_string });
			} else {
				app.board.$el.css({backgroundColor: "#fff" });
			}
		},
		getBackgroundColor: function(){
			var obj = Raphael.getRGB(app.board.$el.css('background-color'));
			return obj;
		},
		updateScore: function(){
			app.board.score = app.collisions.getTotal();
			var max = app.board.size();
			$('#current_score').text(app.board.score)
			$('#max_score').text(" / "+max)

			//change bg color to player's color if they win.
			if(app.player.hasWon()){
				app.player.win();
			}
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
	circles: {
		wiggle: function(target) {
			
			var wiggle_range = 50,
				duration = 300;

			if ( target ) {
				var new_y = target.attrs.cy-wiggle_range;
				target.animate({cy: new_y},duration,"bounce",function(){
				  	target.animate({cy: new_y+wiggle_range},duration,"bounce");
				});
			} else {

				_.each(app.circles.all,function(circle){
					var new_y = circle[2]-wiggle_range;
					circle[3].animate({cy: new_y},500,"bounce",function(){
					   	circle[3].animate({cy: new_y+wiggle_range},500,"bounce");
					});
				});
			}
		},
		drop: function(target) {
			var duration = 300;

			if ( target ) {
			
				target.animate({cy: app.board.height},2000,"bounce");
			
			} else {
				_.each(app.circles.all,function(circle){
			   		circle[3].animate({cy: app.board.height},2000,"bounce");
				});
			}
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
		},
		win: function(){

			// app.board.$el.css({backgroundColor: app.player.start_inner_color });
			
			app.board.setBackground("#0f0");
			
			app.circles.wiggle();
			

		},
		lose: function(){
			app.board.setBackground(app.player.start_inner_color);
			app.circles.drop();
		},
		hasWon: function(){
			if ( app.board.score === app.board.size() ) {
				return true;
			} else {
				return false;
			}
		}
	},
	action: {
		burn: function(e) {
			e.preventDefault();
			var blood = app.player.avatar.glow({
								width: 20,
								color: app.player.start_inner_color,
								fill: app.player.start_inner_color
							});
			window.setTimeout(function(){
				blood.animate({stroke: "#fff",fill: "#fff"},1000,function(){
					blood.remove();
				});
			},500)
		},
		bleed: function(target){
			var blood = target.glow({
								width: 20,
								color: "#f00",
								fill: "#f00"
							});
			window.setTimeout(function(){
				blood.animate({stroke: "#fff",fill: "#fff"},1000,function(){
					blood.remove();
				});
			},500)
		},
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
			// app.circles.all.push(new_circle)
			var random_x = aux.get_random_x();
			var random_y = aux.get_random_y();
			
			// console.log(random_x,random_y);
			new_circle.animate(
				{
					cx: random_x, 
					cy: random_y 
				},500,"bounce")

			//adds newly crated circle to circles array.
			app.circles.all.push([new_circle.id, random_x, random_y, new_circle])
			app.board.updateScore()
		},
		collide: function(player_pos){
			//the range of the search
			var tolerance = 30;

			function is_close(p1,p2){
				return (p1 <= (p2+tolerance) && p1 >= (p2-tolerance))
			}

			//check if close to any x's
			var x_matches = _.select(app.circles.all,
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

					circle_el.animate({fill: app.board.other_circle_color },1000);

					if ( _.indexOf(app.collisions.circle_ids,circle[0]) === -1 ) {
						app.collisions.circle_ids.push(circle[0])

						app.board.updateScore();

						if( !app.player.hasWon() ) {
							
							// bleed
							app.action.bleed(circle[3]);
							app.circles.drop(circle[3]);
						}
					}
				})
			}
			return true
		}
	},
	movement: {
		//movement steps/rates
		teleport: function(target, e){
			e.preventDefault();

			// console.log(e, target);

			//adjusted for navbar size

			var old_pos = app.player.getCurrentPosition(),
				new_x = e.clientX,
				// includes adjustment for navbar height;
				new_y = parseInt((e.clientY-(app.board.height*0.1)));

			var destination = {
				cx: new_x,
				cy: new_y
			}

			var points_data = aux.getTwoPointsData(old_pos.x,new_x,old_pos.y,new_y)

			// distance / ms
			var time = parseInt((points_data.distance) / 2)*4;
			var fifth_of_time = parseInt(time/5);

			//disappear
			target.animate({ fill: app.board.getBackgroundColor(), stroke: app.board.getBackgroundColor() },fifth_of_time,function(){
				//reappear
				window.setTimeout(function(){
					app.player.avatar.animate({ fill: app.player.start_inner_color, stroke: app.player.start_stroke_color},fifth_of_time);
				},(fifth_of_time*3));
			});


			target.animate(destination, time, function(){
				var pos = app.player.getCurrentPosition()
				app.action.collide(pos);

				// app.player.avatar.animate({ fill: app.player.start_inner_color, stroke: app.player.start_stroke_color},200);


			})
		},
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

			// check if destination is off the map
			if ( destination.cx < 0 ) {
				destination.cx = app.board.width;
			} else if ( destination.cx > app.board.width ) {
				destination.cx = 0;
			} else if ( destination.cy < 0 ) {
				destination.cy = app.board.height;
			} else if ( destination.cy > app.board.height ) {
				destination.cy = 0;
			}

			target.animate(destination, app.movement.rate, function(){
				var pos = app.player.getCurrentPosition()
				if ( !app.player.hasWon() ) {
					app.action.collide(pos);
				}
			})
		}
	},
	keydown_callback: function(e){
		var key_num = e.keyCode,
			key_name = aux.key_to_s(key_num);

		var command_index = _.indexOf(app.key.bindings,key_name);

		switch (command_index) {
			case -1:
				break;
			case 0:
				e.preventDefault()
				app.action.shoot();
				break;
			case 1:
				app.action.toggleOptions(e)
				break;
			case 2:
				app.action.burn(e)
				break;
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
			case 66:
				return "b"
		}
	},
	get_random_x: function(){
		return parseInt( ( Math.random()*app.board.width) + 1 );
	},
	get_random_y: function(){
		return parseInt( ( Math.random()*app.board.height) + 1 );
	},
	getTwoPointsData: function(x1,x2,y1,y2){
		var data = {}
		data.slope = (y2 - y1) / (x2 - x1);
		data.distance = Math.sqrt( Math.pow((x2 - x1),2) + Math.pow((y2 - y1),2) )
		data.slope_int = parseInt(data.slope);
		data.distance_int = parseInt(data.distance);
		return data;
	}
}

$(function(){

	app.initialize();

	//bind options behavior
	//set toggleHandler
	$('#more_button').on('click',app.action.toggleOptions);
	$('#reset_button').on('click',app.board.reset);
	$('#game_options').on('click',function(e){
		e.stopPropagation();
	})
	$('#navbar').on('click',function(e){
		e.stopPropagation();
	})

})