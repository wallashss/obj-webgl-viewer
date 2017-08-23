
window.addEventListener("load", function()
{
	 init();
});

var renderer = undefined;

function init()
{
	let viewController = document.getElementById("view_controller");
	
	// Init renderer	
	let canvas = document.getElementById("canvas");
	renderer = new Renderer();
	renderer.load(canvas);
	
	
	// Initialize cameracontroller
	let cameraController = new CameraController();
	cameraController.installCamera(canvas, function(viewMatrix, dt)
	{
		renderer.setViewMatrix(viewMatrix);
		renderer.draw(dt);
	});
	
	
	// Init obj uploader
	let objUploader = document.getElementById("obj_file");
		
	objUploader.addEventListener("change", function(e)
	{
		let files = e.target.files;
		var objreader = new ObjReader();

		
		if(files.length > 0)
		{
			let file = files[0];		
			let reader = new FileReader();
			
			reader.onload = function(e)
			{
				let obj = objreader.readObjects(e.target.result);
				
				if(obj.needcalculateNormals)
				{
					console.log("Calculating normals...");
					calculateNormals(obj.vertices, obj.elements);
				}
				
				if(obj.hasTexcoords)
				{
					renderer.addObject(obj.vertices, obj.elements, "default");
				}
				else
				{
					renderer.addObject(obj.vertices, obj.elements);
				}
			};
			
			reader.readAsText(file);
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
