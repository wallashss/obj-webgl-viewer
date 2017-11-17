"use strict";

function SceneController()
{
    var self = this;
    this.bounds = {min: {x: Number.MAX_VALUE, 
                         y: Number.MAX_VALUE,
                         z: Number.MAX_VALUE},
                    max: {x: -Number.MAX_VALUE, 
                         y: -Number.MAX_VALUE,
                         z: -Number.MAX_VALUE}};

    
    this.addMesh = function(vertices, verticeSize)
    {
        let length = parseInt(vertices.length / verticeSize);
        for(let i = 0; i < length; i++)
        {

            let x = vertices[i*verticeSize];
            let y = vertices[i*verticeSize+1];
            let z = vertices[i*verticeSize+2];
        
            self.expand(x, y, z);
        }
    }

    this.expand = function(x, y, z)
    {
        if(self.bounds.min.x > x)
        {
            self.bounds.min.x = x;
        }
        if(self.bounds.min.y > y)
        {
            self.bounds.min.y = y;
        }
        if(self.bounds.min.z > z)
        {
            self.bounds.min.z = z;
        }
        
        if(self.bounds.max.x < x)
        {
            self.bounds.max.x = x;
        }
        if(self.bounds.max.y < y)
        {
            self.bounds.max.y = y;
        }
        if(self.bounds.max.z < z)
        {
            self.bounds.max.z = z;
        }
    }

    this.reset = function()
    {
        self.bounds = {min: {x: Number.MAX_VALUE, 
            y: Number.MAX_VALUE,
            z: Number.MAX_VALUE},
       max: {x: -Number.MAX_VALUE, 
            y: -Number.MAX_VALUE,
            z: -Number.MAX_VALUE}};
    }
    
    this.getCenter = function()
    {
        return vec3.fromValues((self.bounds.max.x + self.bounds.min.x) * 0.5,
                				(self.bounds.max.y + self.bounds.min.y) * 0.5,
               					(self.bounds.max.z + self.bounds.min.z) * 0.5);
    }
    
    this.getSize = function()
    {
        return vec3.fromValues( (self.bounds.max.x - self.bounds.min.x),
                (self.bounds.max.y - self.bounds.min.y),
                (self.bounds.max.z - self.bounds.min.z));
    }
    
    this.getCamera = function()
    {
        let c = self.getCenter();
        let s = self.getSize();
        
        let center = vec3.fromValues(c.x, c.y, c.z );
        let eye = vec3.fromValues(c.x, c.y, c.z - 2.0);
        let up = vec3.fromValues(0, 1, 0);
        
        return {center: center, eye: eye, up: up};
    }
}