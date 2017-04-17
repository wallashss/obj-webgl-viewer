function calculateNormals(vertices, elements)
{
	let verticeSize = 8 ; // 3 vertices, 3 normals, 2 texcoords
	let normalsMap = {};
	let triangleMap = {};
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
	
	let elementCount = elements.length/3;
	

	// Calculate normals for triangles surfaces
	for(let i = 0; i < elementCount; i++)
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
	
	
	let newTriangles = [];
	let newTriangleMap = {};
	
	for(let i = 0; i < vertices.length / 8; i++)
	{	
		let normals = normalsMap[i];
		let triangles = triangleMap[i];
		
		let toRemove = [];
		let toUpdate = [];
		let newVertices = [];
		let newNormals = [];
		
		// Searching for flat surfaces
		for(let j =0; j < normals.length -1; j++)
		{
			for(let k = j+1; k < normals.length; k++)
			{
				let angle = dot(normals[j], normals[k]);
				if(angle < 0.2)
				{
					// Split vertex 
					let v0 = i;
					let v1 = triangles[j][0];
					let v2 = triangles[j][1];
					
					toRemove.push(j);
					toUpdate.push([v0, v1, v2]);
					newNormals.push(normals[j]);
					
					let newIdx = vertices.length / 8;
					
					vertices.push(vertices[i * verticeSize+0]);
					vertices.push(vertices[i * verticeSize+1]);
					vertices.push(vertices[i * verticeSize+2]);
		
					vertices.push(normals[j].x);
					vertices.push(normals[j].y);
					vertices.push(normals[j].z);
			
					vertices.push(vertices[i * verticeSize+6]);
					vertices.push(vertices[i * verticeSize+7]);
					
					normalsMap[newIdx] = [normals[j]];
					triangleMap[newIdx] = [v1, v2];
					elementOffset[newIdx] = elementOffset[i];
					newVertices.push(newIdx);

					break;
				}
			}
		}
		
		// Remove current old normal

		
		console.log("Update " + i);
		for(let j =0; j < toUpdate.length; j++)
		{
			let v0 = toUpdate[j][0];
			let v1 = toUpdate[j][1];
			let v2 = toUpdate[j][2];
			
			console.log("v: " + v0 + " " + v1 + " " + v2);
			console.log(newVertices[j]);
			console.log(elementOffset[v0]);
			
			// for(let k = 0 ; k < elementOffset[v0].length; k++)
			{
				let k =  toRemove[j];
				console.log(elements[elementOffset[v0][k]*3+0] + " " + elements[elementOffset[v0][k]*3 +1 ] + " " + elements[elementOffset[v0][k]*3 +2 ]);
				
				for(let l = 0 ; l < 3; l++)
				{
					if(elements[elementOffset[v0][k]*3+l] == v0)
					{
						elements[elementOffset[v0][k]*3+l] = newVertices[j];
					}
				}
			}
			
		}
		
		for(let j = toRemove.length - 1; j >= 0; j--)
		{
			normals.splice(toRemove[j], 1);
		}


		// Remove normal from other shared vertices
		// for(let j =0; j < toUpdate.length; j++)
// 		{
// 			let v0 = toUpdate[j][0];
// 			let v1 = toUpdate[j][1];
// 			let v2 = toUpdate[j][2];
// 			
// 			let removeNormals = function(idx)
// 			{
// 				let idxToRemove = [];
// 				let normalsToRemove = normalsMap[idx];
// 				let triangleToRemove = triangleMap[idx];
// 				
// 				for(let k = 0; k < normalsToRemove.length; k++)
// 				{
// 					if(triangleToRemove[k][0] == v0 || triangleToRemove[k][1] == v0 || triangleToRemove[k][2] == v0)
// 					{
// 						idxToRemove.unshift(k);
// 					}
// 				}
// 				
// 				for(let k =0; k < idxToRemove.length; k++)
// 				{
// 					normalsToRemove.splice(idxToRemove[k], 1);
// 				}
// 			}
// 			
// 			removeNormals(v1);
// 			removeNormals(v2);
// 		}

		
		// for(let i = 0; i < newTriangles.length; i++)
// 		{
// 			let newTriangle = newTriangles[i];
// 			let newNormal = newNormals[i];
// 		
// 			for(let j = 0; j < 3; j++)
// 			{
// 				let e = newTriangle[j];
// 				vertices.push(vertices[e * verticeSize+0]);
// 				vertices.push(vertices[e * verticeSize+1]);
// 				vertices.push(vertices[e * verticeSize+2]);
// 		
// 				vertices.push(newNormal.x);
// 				vertices.push(newNormal.y);
// 				vertices.push(newNormal.z);
// 			
// 				vertices.push(vertices[e * verticeSize+6]);
// 				vertices.push(vertices[e * verticeSize+7]);
// 			}		
// 		}
		
		
	}
		
	let verticeCount = vertices.length / 8;
	
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
	
	
	// New flat vertices
	// for(let i = 0; i < newTriangles.length; i++)
// 	{
// 		let newTriangle = newTriangles[i];
// 		let newNormal = newNormals[i];
// 		
// 		for(let j = 0; j < 3; j++)
// 		{
// 			let e = newTriangle[j];
// 			vertices.push(vertices[e * verticeSize+0]);
// 			vertices.push(vertices[e * verticeSize+1]);
// 			vertices.push(vertices[e * verticeSize+2]);
// 		
// 			vertices.push(newNormal.x);
// 			vertices.push(newNormal.y);
// 			vertices.push(newNormal.z);
// 			
// 			vertices.push(vertices[e * verticeSize+6]);
// 			vertices.push(vertices[e * verticeSize+7]);
// 		}
// 				
// // 		vertic	es.push(newVertex[0][0]);
// 		
// 	}
	console.log(vertices);
	
	
}