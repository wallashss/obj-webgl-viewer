// Global gl context... It is nice to debug.
var gl = {};

var TARGET_FPS = 60.0;
var dt = 1.0 / TARGET_FPS;			 

function Renderer()
{
	var self = this;
	var mainShader = null;
	var batches = [];
	var textureMap = {};
	var canvas = {width: 0, 
				  height: 0, 
				  element: undefined};
	
	this.translation = vec3.create();
	this.scale = vec3.fromValues(1.0, 1.0, 1.0);
	this.rotation = mat4.create();
	
	var isAnimating = false;

	
	
	var _viewMatrix = mat4.create();
	
	this.buildShader = function(source, type)
	{
		var shader = gl.createShader(type);
		
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		{
			console.log(gl.getShaderInfoLog(shader));
			return undefined;
		}
		
		return shader;
	}

	this.loadShaders = function()
	{
		let vertexShader;
		let fragmentShader;

		let linkShaders = () =>
		{
			// Trick to call function after async calls
			linkShaders.pendingCount--;
			if(linkShaders.pendingCount > 0)
			{				
				return;
			}

			if( vertexShader != undefined && fragmentShader != undefined)
			{
				let shaderProgram = gl.createProgram();
				gl.attachShader(shaderProgram, vertexShader);
				gl.attachShader(shaderProgram, fragmentShader);
				gl.linkProgram(shaderProgram);
				
				if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
				{
					window.alert("Error initing shader program");
				}
				gl.useProgram(shaderProgram);
				
				let positionVertex = gl.getAttribLocation(shaderProgram, "position");
				gl.enableVertexAttribArray(positionVertex);
				
				let normalVertex = gl.getAttribLocation(shaderProgram, "normal");
				gl.enableVertexAttribArray(normalVertex);
				
				let texcoord = gl.getAttribLocation(shaderProgram, "texcoord");
				gl.enableVertexAttribArray(texcoord);
				
				let viewProjectionUniform = gl.getUniformLocation(shaderProgram, "viewProjection");
				let modelViewUniform = gl.getUniformLocation(shaderProgram, "modelView");
				let normalMatrixUniform = gl.getUniformLocation(shaderProgram, "normalMatrix");
				let lightPositionUniform = gl.getUniformLocation(shaderProgram, "lightPosition");
				let colorUniform = gl.getUniformLocation(shaderProgram, "color");
				let useTextureUniform = gl.getUniformLocation(shaderProgram, "useTexture");
				let texSamplerUniform = gl.getUniformLocation(shaderProgram, "texSampler");
				
				
				
				mainShader=  {	program: shaderProgram,
								positionVertex: positionVertex,
								normalVertex: normalVertex,
								texcoord: texcoord,
								viewProjectionUniform: viewProjectionUniform,
								modelViewUniform: modelViewUniform,
								normalMatrixUniform: normalMatrixUniform,
								lightPositionUniform: lightPositionUniform,
								colorUniform: colorUniform,
								useTextureUniform: useTextureUniform,
								texSamplerUniform : texSamplerUniform
							 };
				console.log("succesfully loaded shaders");
			}
			else
			{
				console.log("Error loading shaders");
			}
		};

		// Trick to call function after async calls
		linkShaders.pendingCount = 2;


		fetch('shaders/vertex.vsh').then((response) => 
		{
			return response.text();
		}).then((source) =>
		{
			vertexShader = self.buildShader(source, gl.VERTEX_SHADER);
			if(vertexShader)
			{
				console.log("Vertex shader successfully build.");
			}
			else
			{
				console.log("Failed to build vertex shader.");
			}
			linkShaders();
		});

		fetch('shaders/fragment.fsh').then((response) => 
		{
			return response.text();
		}).then((source) =>
		{
			fragmentShader = self.buildShader(source, gl.FRAGMENT_SHADER);
			if(fragmentShader)
			{
				console.log("Fragment shader successfully build.");
			}
			else
			{
				console.log("Failed to build fragment shader.");
			}
			linkShaders();
		});

	}

	this.uploadBuffer = function(vertices)
	{
		var newBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, newBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		
		return newBufferId;
	}

	this.addObject = function(vertices, elements, textureName)
	{
		var verticesBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	
		
		
		var elementsBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsBufferId);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);	
		
		batches.push({verticesBufferId: verticesBufferId,
				elementsBufferId: elementsBufferId,
				count: elements.length,
				textureName: textureName});
				
		self.draw();
	}
	
	this.addTexture = function(textureName, texture)
	{
		let textureId = gl.createTexture();
		// neheTexture.image = new Image();
		// neheTexture.image.onload = function() {
		  // handleLoadedTexture(neheTexture)
		// }
		gl.bindTexture(gl.TEXTURE_2D, textureId);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		textureMap[textureName] = textureId;
		
		self.draw();
	}

	this.draw = function()
	{
		// Clear screen
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				
		if(batches.length == 0)
		{
			return;
		}
		
		// Matrices
		let m = mat4.create();
		let v = mat4.create();
		let p = mat4.create();
		let mv = mat4.create();
		let mvp = mat4.create();
		let normalMatrix = mat4.create();
		
		// Light in eye space and always at camera position
		let eyeLightPosition = vec3.fromValues(0.0, 0.0, 0.0);
		
		// Model view projection
		v = _viewMatrix;
		mat4.perspective(p, 45, canvas.width / canvas.height, 0.1, 100000.0);
		
		mat4.fromScaling(m, self.scale);
		mat4.multiply(m, self.rotation, m);
		mat4.multiply(mv, v, m);
		mat4.multiply(mvp, p, mv);

		// Normal matrix
		mat4.invert(normalMatrix, mv);
		mat4.transpose(normalMatrix, normalMatrix);
	
		
		// Bind shader
		var shaderProgram = mainShader.program;
		gl.useProgram(shaderProgram);
		gl.enableVertexAttribArray(shaderProgram.positionVertex);	
		
		for(var i = 0; i < batches.length; i++)
		{
			let b = batches[i];
			
			// Vertex Size = (2 * (vertex & normal) + 2 * nom) * 3 components (x, y, z) * 4 bytes (float)
			var vertexSize = (3 + 3 + 2) * 4;
			
			gl.bindBuffer(gl.ARRAY_BUFFER, b.verticesBufferId);
			gl.vertexAttribPointer(mainShader.positionVertex, 3, gl.FLOAT, false, vertexSize, 0);
			gl.vertexAttribPointer(mainShader.normalVertex, 3, gl.FLOAT, false, vertexSize, 3 * 4); // 3 components x 4 bytes per float		
			gl.vertexAttribPointer(mainShader.texcoord, 2, gl.FLOAT, false, vertexSize, 3 * 4 + 3 * 4);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.elementsBufferId);
			
			gl.uniform4fv(mainShader.colorUniform, [0.8, 0.8, 0.8, 1]);
			gl.uniformMatrix4fv(mainShader.modelViewUniform, false, mv);
			gl.uniformMatrix4fv(mainShader.viewProjectionUniform, false, mvp);
			gl.uniformMatrix4fv(mainShader.normalMatrixUniform, false, normalMatrix);
			gl.uniform3fv(mainShader.lightPositionUniform, eyeLightPosition);
			
			if(b.textureName != undefined && textureMap.hasOwnProperty(b.textureName))
			{
				gl.activeTexture(gl.TEXTURE0);
				gl.uniform1f(mainShader.useTextureUniform, 1.0);
				gl.bindTexture(gl.TEXTURE_2D, textureMap[b.textureName]);
				gl.uniform1i(shaderProgram.texSamplerUniform, 0);
			}
			else
			{
				gl.uniform1f(mainShader.useTextureUniform, 0.0);
			}
			
			gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_SHORT, 0);
			
			if(b.textureName != undefined)
			{
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
		}
	}

	this.bindShader = function(shaderProgram, object)
	{
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	}

	this.updateViewBounds = function()
	{
		let bounds = canvas.element.getBoundingClientRect();
		
		canvas.width = bounds.width;
		canvas.height = bounds.height;

		// canvas.element.width = bounds.width;
		// canvas.element.height = bounds.height;
	}

	this.onResize = function()
	{
		if(canvas.element)
		{
			self.updateViewBounds();

			if(mainShader)
			{
				self.draw();
			}
		}
	}

	this.load = function(canvasElement)
	{
		canvas.element = canvasElement;

		gl = canvasElement.getContext("webgl");

		self.updateViewBounds();

		window.addEventListener("resize", (e)=>
		{
			self.onResize();
		});
		
		self.loadShaders();
		
		gl.clearColor(0.5, 0.5, 0.5, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// gl.viewport(0, 0, 500, 100);
		console.log("Init complete");
		
		// self.addObject( [
			 // 1.0,  0.0,  0.0, 	0.0, 0.0, -1.0,		0.0, 0.0,
			 // 0.0, 1.0,  0.0,	0.0, 0.0, -1.0,		0.0, 0.0,
			 // 0.0, 0.0,  0.0,	0.0, 0.0, -1.0,		0.0, 0.0
		// ], [0, 1, 2]);
		
		gl.enable(gl.DEPTH_TEST);
// 		self.draw();
		// window.setInterval(self.draw, dt)
	}
	
	
	this.setViewMatrix = function(viewMatrix)
	{
		_viewMatrix = mat4.clone(viewMatrix);
	}
	
	this.setScale = function(newScale)
	{
		self.scale = vec3.clone(newScale);
	}
}
