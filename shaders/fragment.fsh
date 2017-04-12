precision mediump float;
varying vec4 currentColor;
varying vec3 vNormal;
varying vec2 vTexcoord;
varying vec3 vPosition;
uniform vec3 lightPosition;

void main(void)
{
	vec3 lightDir = normalize(lightPosition - vPosition);
	
	// Ambient
	vec3 ambient = vec3(0.1);
	float d = max(0.0, dot(vNormal, lightDir));
	
	// Diffuse
	vec3 diffuse = vec3(d);
	
	vec3 illumination = diffuse + ambient;
	
	gl_FragColor = vec4(illumination * currentColor.xyz, currentColor.a);
	// gl_FragColor = vec4(diffuse, 1);
	
	// gl_FragColor = vec4(vPosition, 1);
}