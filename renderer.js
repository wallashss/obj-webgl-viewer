var gl = {};

var TARGET_FPS = 30.0;
var dt = 1.0 / TARGET_FPS;

var canvas = {width: 0, 
			 height: 0, 
			 element: undefined};
			 
var batches = [];

var mainShader = undefined;

function buildShader(source, type)
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

function loadShaders()
{
	var vertexShader;
	var fragmentShader;
	
	ajax.get("shaders/vertex.vsh", {}, function(source)
	{
		vertexShader = buildShader(source, gl.VERTEX_SHADER);
		if(vertexShader != undefined)
		{
			console.log("Vertex shader successfully build.");
		}
		else
		{
			console.log("Failed to build vertex shader.");
		}
	}, false);
	
	ajax.get("shaders/fragment.fsh", {}, function(source)
	{
		fragmentShader = buildShader(source, gl.FRAGMENT_SHADER);
		if(fragmentShader != undefined)
		{
			console.log("Fragment shader successfully build.");
		}
		else
		{
			console.log("Failed to build fragment shader.");
		}
	}, false);
	if( vertexShader != undefined && fragmentShader != undefined)
	{
		var shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
		
		if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
		{
			window.alert("Error initing shader program");
		}
		gl.useProgram(shaderProgram);
		
		var positionVertex = gl.getAttribLocation(shaderProgram, "position");
		gl.enableVertexAttribArray(positionVertex);
		
		var normalVertex = gl.getAttribLocation(shaderProgram, "normal");
		gl.enableVertexAttribArray(normalVertex);
		
		var texcoord = gl.getAttribLocation(shaderProgram, "texcoord");
		gl.enableVertexAttribArray(texcoord);
		
		var viewProjectionUniform = gl.getUniformLocation(shaderProgram, "viewProjection");
		var colorUniform = gl.getUniformLocation(shaderProgram, "color");
		
		return {program: shaderProgram,
				positionVertex: positionVertex,
				normalVertex: normalVertex,
				texcoord: texcoord,
				viewProjectionUniform: viewProjectionUniform,
				colorUniform: colorUniform
				};
	}
	else
	{
		console.log("Error loading shaders");
	}
	return undefined;
}

function uploadBuffer(vertices)
{
	var newBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	return newBufferId;
}


function addObject(vertices, elements)
{
	var verticesBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferId);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);	
	
	
	var elementsBufferId = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementsBufferId);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);	
	
	batches.push({verticesBufferId: verticesBufferId,
			elementsBufferId: elementsBufferId,
			count: elements.length});
	
}
function draw()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var shaderProgram = mainShader.program;
	
	gl.useProgram(shaderProgram);
	gl.enableVertexAttribArray(shaderProgram.positionVertex);
	
	var mvp = mat4.create();
	var mv = mat4.create();
	var p = mat4.create();
	mat4.identity(mvp);
	mat4.identity(mv);
	mat4.identity(p);
	mat4.translate(mv, [-0.5, -0.5, -7.0]);
	mat4.perspective(45, canvas.width / canvas.height, 0.1, 100.0, p);
	mat4.multiply(p, mv, mvp);
	
	for(var i = 0; i < batches.length; i++)
	{
		var b = batches[i];
		
		// Vertex Size = (2 * (vertex & normal) + 2 * nom) * 3 components (x, y, z) * 4 bytes (float)
		var vertexSize = (3 + 3 + 2) * 4;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, b.verticesBufferId);
		gl.vertexAttribPointer(mainShader.positionVertex, 3, gl.FLOAT, false, vertexSize, 0);
		gl.vertexAttribPointer(mainShader.normalVertex, 3, gl.FLOAT, false, vertexSize, 3 * 4); // 3 components x 4 bytes per float		
		gl.vertexAttribPointer(mainShader.texcoord, 2, gl.FLOAT, false, vertexSize, 3 * 4 + 3 * 4);
		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.elementsBufferId);
		
		
		gl.uniform4fv(mainShader.colorUniform, [1, 0, 0, 1]);
		gl.uniformMatrix4fv(mainShader.viewProjectionUniform, false, mvp);
		
		gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_SHORT, 0);
	}
}

function bindShader(shaderProgram, object)
{
	 gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
}

function init()
{
	console.log("Begin Init");
	var e = document.getElementById("canvas");
	canvas.element = e;
	let bounds = e.getBoundingClientRect();
	console.log(bounds);
	canvas.width = e.width;
	canvas.height = e.height;

	console.log(canvas);
	gl = e.getContext("webgl");
	
	mainShader = loadShaders();
	
	gl.clearColor(0.5, 0.5, 0.5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, canvas.width, canvas.height);
	console.log("Init complete");
	
	addObject( [
         1.0,  0.0,  0.0, 	0.0, 0.0, 1.0,		0.0, 0.0,
         0.0, 1.0,  0.0,	0.0, 0.0, 1.0,		0.0, 0.0,
         0.0, 0.0,  0.0,	0.0, 0.0, 1.0,		0.0, 0.0
    ], [0, 1, 2]);
	window.setInterval(draw, dt)
}

window.addEventListener("load", function()
{
	init();
});


