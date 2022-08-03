uniform float uSize;
uniform float uTime;
attribute float scales;
attribute vec3 randomness;
varying vec3 vColor;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  // Animation
  float angle = atan(modelPosition.x, modelPosition.z);
  float distanceToCenter = length(modelPosition.xz);
  float angleOffset = (1.0 / distanceToCenter) * uTime * 0.9;

  angle += angleOffset;
  modelPosition.x = cos(angle) * distanceToCenter;
  modelPosition.z = sin(angle) * distanceToCenter;

  // Apply randomness
  modelPosition.xyz += randomness.xyz;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  // Size of the particles + random scale
  gl_PointSize = uSize * scales;
  // Size attenuation depending on the distance from the camera
  gl_PointSize *= (1.0 / -viewPosition.z);

  vColor = color;
}