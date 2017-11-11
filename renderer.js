// Global gl context... It is nice to debug.
var gl = {};

let TARGET_FPS = 60.0;
let dt = 1.0 / TARGET_FPS;			 

function Renderer()
{
	let self = this;
	let mainShader = null;
	let batches = [];
	let lines = [];
	let textureMap = {};
	let canvas = {width: 0, 
				  height: 0, 
				  element: undefined};
	
	this.translation = vec3.create();
	this.scale = vec3.fromValues(1.0, 1.0, 1.0);
	this.rotation = mat4.create();
	
	let isAnimating = false;

	let backgroundColor = {r: 0.5, g: 0.5, b: 0.5};
	let dummyTexture = null;
	
	let _viewMatrix = mat4.create();
	
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

	this.loadShaders = function(vertexSource, fragmentSource)
	{
		vertexShader = self.buildShader(vertexSource, gl.VERTEX_SHADER);
		fragmentShader = self.buildShader(fragmentSource, gl.FRAGMENT_SHADER);
		if( vertexShader && fragmentShader )
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
			let unlitUniform = gl.getUniformLocation(shaderProgram, "unlit");
			let texSamplerUniform = gl.getUniformLocation(shaderProgram, "texSampler");
			
			mainShader = {program: shaderProgram,
					positionVertex: positionVertex,
					normalVertex: normalVertex,
					texcoord: texcoord,
					viewProjectionUniform: viewProjectionUniform,
					modelViewUniform: modelViewUniform,
					normalMatrixUniform: normalMatrixUniform,
					lightPositionUniform: lightPositionUniform,
					colorUniform: colorUniform,
					useTextureUniform: useTextureUniform,
					unlitUniform: unlitUniform,
					texSamplerUniform : texSamplerUniform
					};
			console.log("succesfully loaded shaders");
		}
		else
		{
			console.log("Error loading shaders");
		}
		
	}

	this.uploadBuffer = function(vertices)
	{
		var newBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, newBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		
		return newBufferId;
	}

	this.addObject = function(vertices, elements, color, textureName)
	{
		var verticesBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	
		
		if(!color)
		{
			color = vec4.fromValues(0.8, 0.8, 0.8, 1.0);
		}
		
		var elementsBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsBufferId);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);	
		
		batches.push({verticesBufferId: verticesBufferId,
				elementsBufferId: elementsBufferId,
				count: elements.length,
				color: color,
				textureName: textureName});
				
		self.draw();
	}
	
	this.addLines = function(vertices, color)
	{
		var verticesBufferId = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	
		
		if(!color)
		{
			color = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
		}
		
		lines.push({verticesBufferId: verticesBufferId,
					count: vertices.length / 3,
					vertexSize: 3 * 4, // 3 components * 4 bytes per float
					color: color});
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
				
		if(batches.length == 0 && lines.length == 0)
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
		// gl.enableVertexAttribArray(shaderProgram.positionVertex);	
		// gl.uniform4fv(mainShader.colorUniform, [0.8, 0.8, 0.8, 1]);
		gl.uniform1f(mainShader.unlitUniform, 0.0);
		gl.uniformMatrix4fv(mainShader.modelViewUniform, false, mv);
		gl.uniformMatrix4fv(mainShader.viewProjectionUniform, false, mvp);
		gl.uniformMatrix4fv(mainShader.normalMatrixUniform, false, normalMatrix);
		gl.uniform3fv(mainShader.lightPositionUniform, eyeLightPosition);
			
		for(let i = 0; i < batches.length; i++)
		{
			let b = batches[i];
			
			// Vertex Size = (2 * (vertex & normal) + 2 * nom) * 3 components (x, y, z) * 4 bytes (float)
			var vertexSize = (3 + 3 + 2) * 4;
			
			gl.bindBuffer(gl.ARRAY_BUFFER, b.verticesBufferId);
			gl.vertexAttribPointer(mainShader.positionVertex, 3, gl.FLOAT, false, vertexSize, 0);
			gl.vertexAttribPointer(mainShader.normalVertex, 3, gl.FLOAT, false, vertexSize, 3 * 4); // 3 components x 4 bytes per float		
			gl.vertexAttribPointer(mainShader.texcoord, 2, gl.FLOAT, false, vertexSize, 3 * 4 + 3 * 4);
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.elementsBufferId);
			
			gl.activeTexture(gl.TEXTURE0);
			if(b.textureName && textureMap.hasOwnProperty(b.textureName))
			{
				gl.uniform1i(shaderProgram.texSamplerUniform, 0);
				gl.bindTexture(gl.TEXTURE_2D, textureMap[b.textureName]);
				gl.uniform1f(mainShader.useTextureUniform, 1.0);
			}
			else
			{
				gl.uniform1i(shaderProgram.texSamplerUniform, 0);
				gl.bindTexture(gl.TEXTURE_2D, dummyTexture);
				gl.uniform1f(mainShader.useTextureUniform, 0.0);
				gl.uniform4fv(mainShader.colorUniform, b.color);
			}
			
			gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_SHORT, 0);
			
			// if(b.textureName != undefined)
			// {
			// 	gl.bindTexture(gl.TEXTURE_2D, null);
			// }
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		gl.uniform1f(mainShader.unlitUniform, 1.0);		
		for(let i =0 ; i < lines.length; i++)
		{
			let l = lines[i];
			
			gl.bindBuffer(gl.ARRAY_BUFFER, l.verticesBufferId);
			gl.vertexAttribPointer(mainShader.positionVertex, 3, gl.FLOAT, false, l.vertexSize, 0);
			gl.vertexAttribPointer(mainShader.normalVertex, 3, gl.FLOAT, false, l.vertexSize, 0); // 3 components x 4 bytes per float		
			gl.vertexAttribPointer(mainShader.texcoord, 2, gl.FLOAT, false, l.vertexSize, 0);
			
			gl.drawArrays(gl.LINES, 0, l.count);
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

	this.setBackgroundColor = function(r, g, b)
	{
		self.backgroundColor.r = r;
		self.backgroundColor.g = g;
		self.backgroundColor.b = b;

		gl.clearColor(r, g, b, 1);
	}

	this.load = function(canvasElement, vertexSource, fragmentSource)
	{
		canvas.element = canvasElement;

		gl = canvasElement.getContext("webgl");

		self.updateViewBounds();

		window.addEventListener("resize", (e)=>
		{
			self.onResize();
		});
		
		self.loadShaders(vertexSource, fragmentSource);
		
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
		dummyTexture = gl.createTexture();
		
		// let textureId = gl.createTexture();
		// // neheTexture.image = new Image();
		// // neheTexture.image.onload = function() {
		//   // handleLoadedTexture(neheTexture)
		// // }
		gl.bindTexture(gl.TEXTURE_2D, dummyTexture);
		// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, null);

		let dummyArray = [];
		let dummySize = 4;
		for(let i = 0; i < dummySize*dummySize; i++)
		{
			dummyArray.push(0);
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2,0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(dummyArray));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
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
