"use strict";

function CameraController()
{
	var self = this;
	let examineManipulator = new Examine();
	
	let manipulator = examineManipulator;
	
	
	let mouseState = {x: 0, y: 0,
						 mousePress: false};
	let state = {yawIntensity: 0.0,
				pitchIntensity: 0.0,
				pivot: vec3.fromValues(0.0, 0.0, 0.0),
				angularVelocity: 0.0,
				zoomIntensity: 0.0,
				maximumZoom: 0.0};
	
	
	this.rotate = function(yawIntensity, pitchIntensity)
	{
		state.yawIntensity = yawIntensity;
		state.pitchIntensity = pitchIntensity;
	}
	
	this.zoom = function(intensity)
	{
		console.log(intensity);
		state.zoomIntensity = intensity;
	}
	
	this.setViewMatrix = function(viewMatrix)
	{
		manipulator.setViewMatrix(viewMatrix);
	}
	
	this.getViewMatrix = function()
	{
		return manipulator.getViewMatrix();
	}
	
						 
	this.installCamera = function(element, drawcallback)
	{
		let timer = new Timer();
		
		if(element)
		{
			element.addEventListener("mousedown", function(e)
			{
				mouseState.mousePress = true;
				mouseState.x = e.clientX;
				mouseState.y = e.clientY;
				console.log(e);
			});
			
			element.addEventListener("mouseup", function(e)
			{
				mouseState.mousePress = false;
				console.log(e);
			});
			
			element.addEventListener("mousemove", function(e)
			{
				if(mouseState.mousePress)
				{
					self.rotate(-mouseState.x + e.clientX, -mouseState.y + e.clientY);
					mouseState.x = e.clientX;
					mouseState.y = e.clientY;
				}
			});
			
			element.addEventListener("wheel", function(e)
			{
				let delta = 0.0;
				if(e.deltaMode == WheelEvent.DOM_DELTA_PIXEL)
				{
					delta = e.deltaY;
				}
				else if(e.deltaMode == WheelEvent.DOM_DELTA_LINE)
				{
					delta = e.deltaY * 33;
				}
				else
				{
					if(e.deltaY > 0)
					{
						delta = 10;
					}
					else if(e.delta < 0)
					{
						delta = -10;
					}
				}
				self.zoom(delta * 0.001);
			});
		}
		
		let frameCallback = function()
		{
			let dt = timer.elapsedTime();
			if(drawcallback)
			{
				if(manipulator.update(dt, state))
				{
					console.log(dt);
					drawcallback(manipulator.getViewMatrix(), dt);
				}
			}
			window.requestAnimationFrame(frameCallback);
			timer.restart();
		};
		
		frameCallback();
	}
	
	var init = function()
	{
		let eye = vec3.fromValues(0, 0, -5);
		let center = vec3.fromValues(0, 0, 0);
		let up = vec3.fromValues(0, 1, 0);
		
		state.pivot = vec3.clone(center);
		state.worldUp = vec3.clone(up);
		state.angularVelocity = 30.0;
		state.maximumZoom = 1.0;
		
		let v = mat4.create();
		console.log(v);
		mat4.lookAt(v, eye, center, up);
		manipulator.setViewMatrix(v);
	}();
}