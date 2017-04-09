precision mediump float;
varying vec4 currentColor;
varying vec3 vNormal;
varying vec2 vTexcoord;

void main(void)
{
	vec4 test = vec4(vNormal.xy + vTexcoord.xy, currentColor.x, currentColor.y);
	gl_FragColor = test;
	gl_FragColor = currentColor;
	// gl_FragColor = vec4(vNormal, 1);
}