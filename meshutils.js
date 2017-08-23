function calculateNormals(vertices, elements, forceSmooth)
{
	forceSmooth = forceSmooth ? true : false;
	
	let verticeSize = 8 ; // 3 vertices, 3 normals, 2 texcoords
	let normalsMap = {};
	let triangleMap = {};
	
	// Key - Element index
	// Value - Vector of triangles index
	let elementOffset = {};
	
	
	let dot = function(a, b)
	{
		return a.x*b.x + a.y*b.y + a.z * b.z;
	}
	
	let cross = function(a, b)
	{
		return {x: (a.y*b.z - b.y*a.z), y: (a.z*b.x - b.z*a.x), z: (a.x*b.y - b.x*a.y)};
	}
	
	let length = function(a)
	{
		return Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
	}
	
	let normalize = function(a)
	{
		let mag = length(a);
		return {x: a.x/mag, y: a.y/mag, z: a.z/mag};
	}
	
	let trianglesCount = elements.length/3;
	
	// Calculate normals for triangles surfaces
	for(let i = 0; i < trianglesCount; i++)
	{
		let e0 = elements[i*3+0];
		let e1 = elements[i*3+1];
		let e2 = elements[i*3+2];
		
		let v0 = {x : vertices[e0 * verticeSize + 0], y : vertices[e0 * verticeSize + 1], z : vertices[e0 * verticeSize + 2] };
		let v1 = {x : vertices[e1 * verticeSize + 0], y : vertices[e1 * verticeSize + 1], z : vertices[e1 * verticeSize + 2] };
		let v2 = {x : vertices[e2 * verticeSize + 0], y : vertices[e2 * verticeSize + 1], z : vertices[e2 * verticeSize + 2] };
		
		let v0v1 = {x: v0.x - v1.x, y: v0.y - v1.y, z: v0.z - v1.z};
		let v0v2 = {x: v0.x - v2.x, y: v0.y - v2.y, z: v0.z - v2.z};
				
		let normal = cross(v0v1, v0v2);
		normal = normalize(normal);
		
		// 
		let addNormal = function(ele, ele1, ele2)
		{
			if(normalsMap.hasOwnProperty(ele))
			{
				normalsMap[ele].push(normal);
				triangleMap[ele].push([ele1, ele2]);
				elementOffset[ele].push(i);
			}
			else
			{
				normalsMap[ele] = [normal];
				triangleMap[ele] = [[ele1, ele2]];
				elementOffset[ele] = [i];
			}
		}
		addNormal(e0, e1, e2);
		addNormal(e1, e0, e2);
		addNormal(e2, e0, e1);
	}
	
	// For all vertices...
	// Note: the vertices array can increase during the processing
	if(!forceSmooth)
	{
		for(let i = 0; i < vertices.length / 8; i++)
		{	
			let normals = normalsMap[i];
			let triangles = triangleMap[i];
		
			let normalIdxToRemove = [];
			let verticesToReplace = [];
		

			let isRedundant = {};
			// Searching for flat surfaces
			for(let j =0; j < normals.length -1; j++)
			{
				let isRemoved = false;
			
				// Skip redundant idx
				if(isRedundant.hasOwnProperty(j))
				{
					let redudantIdx = isRedundant[j];
					let idxToRemove = normalIdxToRemove.indexOf(redudantIdx);
					if(idxToRemove >= 0)
					{
						normalIdxToRemove.push(j);
						verticesToReplace.push(verticesToReplace[idxToRemove]);
					}
					continue;
				}
				for(let k = j+1; k < normals.length; k++)
				{
					let angle = dot(normals[j], normals[k]);
				
					// Check if angle if normals are near perpendicular
					if(angle < 0.2 && !isRemoved)
					{
						// Split vertex 
						let v0 = i;
						let v1 = triangles[j][0];
						let v2 = triangles[j][1];
					
						let newIdx = vertices.length / 8;
					
						// Position
						vertices.push(vertices[i * verticeSize+0]);
						vertices.push(vertices[i * verticeSize+1]);
						vertices.push(vertices[i * verticeSize+2]);
		
						// Normal
						vertices.push(normals[j].x);
						vertices.push(normals[j].y);
						vertices.push(normals[j].z);
			
						// Tex coord
						vertices.push(vertices[i * verticeSize+6]);
						vertices.push(vertices[i * verticeSize+7]);
					
						normalsMap[newIdx] = [normals[j]];
						triangleMap[newIdx] = [[v1, v2]];
						elementOffset[newIdx] = elementOffset[i];
					
						normalIdxToRemove.push(j);
						verticesToReplace.push(newIdx);

						isRemoved = true;
					}
					else if(angle == 1)
					{
						isRedundant[k] = j;
					}
				}
			}
				
			// Update elements array with the new vertices
			for(let j =0; j < verticesToReplace.length; j++)
			{
				let k = normalIdxToRemove[j];
				let elOffset = elementOffset[i][k]*3;			
				for(let l = 0 ; l < 3; l++)
				{
					if(elements[elOffset+l] == i)
					{
						elements[elOffset+l] = verticesToReplace[j];
						break;
					}
				}
			}
		
			// Remove old normals
			for(let j = normalIdxToRemove.length - 1; j >= 0; j--)
			{
				normals.splice(normalIdxToRemove[j], 1);
			}
		
		}
	}
	
		
	let verticeCount = vertices.length / 8;
	
	// Calculate final normals
	// THis array does not increase during processing
	for(let i = 0; i < verticeCount; i++)
	{
		let normals = normalsMap[i];
		let normalsCount = normals.length;
		let normal = {x: 0, y: 0, z: 0};
		
		// Mean smooth normal
		for(let j =0; j < normals.length; j++)
		{
			normal.x += normals[j].x / normalsCount;
			normal.y += normals[j].y / normalsCount;
			normal.z += normals[j].z / normalsCount;
		}
		
		vertices[i*verticeSize+3] = normal.x;
		vertices[i*verticeSize+3+1] = normal.y;
		vertices[i*verticeSize+3+2] = normal.z;
	}	
	
}