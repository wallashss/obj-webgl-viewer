
window.addEventListener("load", function()
{
	 init();
});

var renderer = undefined;

function loadShadersSources(callback)
{
	let vertexScript = document.getElementById("vertex-shader");
	let fragmentScript = document.getElementById("fragment-shader");
	
	if(vertexScript && fragmentScript)
	{
		callback(vertexScript.childNodes[0].nodeValue, fragmentScript.childNodes[0].nodeValue);
		return;
	}

	let sources = {vertex: null, fragment: null};

	let invokerCallback = () =>
	{
		invokerCallback.pending--;
		if(invokerCallback.pending !== 0)
		{
			return;
		}
		callback(sources.vertex, sources.fragment);
	};
	invokerCallback.pending = 2;

	// Else read from somewhere... should be used with index-debug
	fetch('shaders/vertex.vsh').then((response) => 
	{
		return response.text();
	}).then((source) =>
	{
		sources.vertex = source;
		invokerCallback();
	});

	fetch('shaders/fragment.fsh').then((response) => 
	{
		return response.text();
	}).then((source) =>
	{
		sources.fragment = source;
		invokerCallback();
	});
}

function init()
{
	let viewController = document.getElementById("view_controller");
	
	// Init renderer	
	let canvas = document.getElementById("canvas");

	let cameraController = new CameraController();

	loadShadersSources((vertexSource, fragmentSource)=>
	{
		renderer = new Renderer();
		renderer.load(canvas, vertexSource, fragmentSource);

		
		cameraController.installCamera(canvas, function(viewMatrix, dt)
		{
			renderer.setViewMatrix(viewMatrix);
			renderer.draw(dt);
		});
	});
	
	
	// Initialize cameracontroller	
	

	// Scene Controller
	let sceneController = new SceneController();
	
	let goToCenter = function()	
	{
		let size =  sceneController.getSize();
		let center = sceneController.getCenter();
		let eye = vec3.fromValues(center[0], center[1], center[2] - size[2] - 1);
		let up = vec3.fromValues(0.0, 1.0, 0.0);

		cameraController.setVelocity(Math.min(Math.min(size[0], size[1]), size[2]));
		cameraController.setCamera(eye, center, up);
	}
	window.addEventListener("keypress", function(e)
	{
		if(e.key === "E" || e.key === "e")
		{
			cameraController.setExamineMode();
		}
		else if(e.key === "F" || e.key === "f")
		{
			cameraController.setFlyMode();
		}
		else if(e.key === "R" || e.key === "r")
		{
			goToCenter();
			cameraController.setExamineMode();
		}
	});
	// Init obj uploader
	let objUploader = document.getElementById("obj_file");
		
	objUploader.addEventListener("change", function(e)
	{
		let files = e.target.files;
		var objreader = new ObjReader();
		
		if(files.length > 0)
		{
			for(let f = 0; f < files.length; f++)
			{
				let file = files[f];		
				let reader = new FileReader();
				
				reader.onload = function(e)
				{
					if(file.name.endsWith(".lines"))
					{
						let lineArray = e.target.result.replace("\n", " ").split(" ");
						let lines = [];
						for(let i = 0; i < lineArray.length; i++)
						{
							lines.push(parseFloat(lineArray[i]));
						}
						sceneController.addMesh(lines, 3);
						renderer.addLines(lines);
					}
					else
					{
						let obj = objreader.readObjects(e.target.result);
					
						if(obj.needcalculateNormals)
						{
							console.log("Calculating normals...");
							calculateNormals(obj.vertices, obj.elements, true);
							console.log("Done.");
						}
						
						sceneController.addMesh(obj.vertices, 8);
						if(obj.hasTexcoords)
						{
							renderer.addObject(obj.vertices, obj.elements, vec4.fromValues(0.8, 0.8, 0.8, 1.0), null, "default");
						}
						else
						{
							renderer.addObject(obj.vertices, obj.elements, vec4.fromValues(0.8, 0.8, 0.8, 1.0));
						}
					}
									
					goToCenter();
					
				};
				
				reader.readAsText(file);
			}
			
		}
	});
	

	// Upload texture
	let imgUploader = document.getElementById("img_file");
	
	imgUploader.addEventListener("change", function(e)
	{
		let files = e.target.files;
		let file = files[0];		
		let reader = new FileReader();
		
		reader.onload = function(e)
		{
			let img = new Image();
			img.width = "150";
			img.height = "150";
			img.src = e.target.result;
			
			img.onload = function(e)
			{
				renderer.addTexture("default", img);
				viewController.appendChild(img);
			}
			// let obj = objreader.readObjects(e.target.result);
		};
		
		reader.readAsDataURL(file);
	});
	
	// let button = document.getElementById("animate_button");
// 	button.addEventListener("click", function()
// 	{
// 		// UGLIEST EVER =D
// 		if(button.value == "Start")
// 		{
// 			button.value = "Stop";
// 			renderer.startAnimation();
// 		}
// 		else
// 		{
// 			button.value = "Start"; // =DDDDD
// 			renderer.stopAnimation();
// 		}
// 	});
}
