/**
 * Bézier Math Module
 * Core mathematical functions for cubic Bézier curve operations.
 * All functions are individually exported for tree-shaking.
 * @module bezier-math
 */

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} Point
 * @property {number} x - The x-coordinate
 * @property {number} y - The y-coordinate
 */

/**
 * @typedef {Object} Segment
 * @property {Point} p0 - Start anchor point
 * @property {Point} p1 - First control point (outgoing from p0)
 * @property {Point} p2 - Second control point (incoming to p3)
 * @property {Point} p3 - End anchor point
 */

/**
 * @typedef {Object} BoundingBox
 * @property {Point} min - Minimum corner (top-left)
 * @property {Point} max - Maximum corner (bottom-right)
 */

/**
 * @typedef {Object} NearestPointResult
 * @property {Point} point - The closest point on the curve
 * @property {number} t - The parameter value at the closest point (0-1)
 */

// ============================================================================
// 1.1 POINT OPERATIONS
// ============================================================================

/**
 * Creates a 2D point object with x and y coordinates.
 *
 * @param {number} x - The x-coordinate of the point
 * @param {number} y - The y-coordinate of the point
 * @returns {Point} A new point object {x, y}
 * @example
 * const p = createPoint(100, 200);
 * // Returns: { x: 100, y: 200 }
 */
export function createPoint(x, y) {
  return { x, y };
}

/**
 * Performs vector addition of two points.
 * Adds the x and y components of both points together.
 *
 * @param {Point} p1 - The first point (addend)
 * @param {Point} p2 - The second point (addend)
 * @returns {Point} A new point representing p1 + p2
 * @example
 * addPoints({ x: 10, y: 20 }, { x: 5, y: 15 });
 * // Returns: { x: 15, y: 35 }
 */
export function addPoints(p1, p2) {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

/**
 * Performs vector subtraction of two points.
 * Subtracts the x and y components of p2 from p1.
 *
 * @param {Point} p1 - The point to subtract from (minuend)
 * @param {Point} p2 - The point to subtract (subtrahend)
 * @returns {Point} A new point representing p1 - p2
 * @example
 * subtractPoints({ x: 10, y: 20 }, { x: 5, y: 15 });
 * // Returns: { x: 5, y: 5 }
 */
export function subtractPoints(p1, p2) {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

/**
 * Scales a point by a scalar value (scalar multiplication).
 * Multiplies both x and y components by the given scalar.
 *
 * @param {Point} p - The point to scale
 * @param {number} scalar - The scalar multiplier
 * @returns {Point} A new point with scaled coordinates
 * @example
 * scalePoint({ x: 10, y: 20 }, 2);
 * // Returns: { x: 20, y: 40 }
 */
export function scalePoint(p, scalar) {
  return { x: p.x * scalar, y: p.y * scalar };
}

/**
 * Calculates the Euclidean distance between two points.
 * Uses the formula: √((x₂-x₁)² + (y₂-y₁)²)
 *
 * @param {Point} p1 - The first point
 * @param {Point} p2 - The second point
 * @returns {number} The distance between p1 and p2
 * @example
 * distance({ x: 0, y: 0 }, { x: 3, y: 4 });
 * // Returns: 5
 */
export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Performs linear interpolation between two points.
 * When t=0 returns p1, when t=1 returns p2, values between
 * return points along the line segment connecting p1 and p2.
 *
 * @param {Point} p1 - The starting point (t=0)
 * @param {Point} p2 - The ending point (t=1)
 * @param {number} t - Interpolation parameter, typically in range [0, 1]
 * @returns {Point} The interpolated point: p1 + t * (p2 - p1)
 * @example
 * lerp({ x: 0, y: 0 }, { x: 100, y: 100 }, 0.5);
 * // Returns: { x: 50, y: 50 }
 */
export function lerp(p1, p2, t) {
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

// ============================================================================
// 1.2 CUBIC BÉZIER CALCULATIONS
// ============================================================================

/**
 * Evaluates a cubic Bézier curve at parameter t.
 * Uses the cubic Bézier formula:
 * B(t) = (1-t)³·P₀ + 3(1-t)²t·P₁ + 3(1-t)t²·P₂ + t³·P₃
 *
 * @param {Point} p0 - Start anchor point (curve passes through this)
 * @param {Point} p1 - First control point (influences curve direction from p0)
 * @param {Point} p2 - Second control point (influences curve direction to p3)
 * @param {Point} p3 - End anchor point (curve passes through this)
 * @param {number} t - Parameter value in range [0, 1]
 *                     t=0 returns p0, t=1 returns p3
 * @returns {Point} The point on the curve at parameter t
 * @example
 * cubicBezier(
 *   { x: 0, y: 0 },
 *   { x: 50, y: 100 },
 *   { x: 150, y: 100 },
 *   { x: 200, y: 0 },
 *   0.5
 * );
 */
export function cubicBezier(p0, p1, p2, p3, t) {
  const oneMinusT = 1 - t;
  const oneMinusT2 = oneMinusT * oneMinusT;
  const oneMinusT3 = oneMinusT2 * oneMinusT;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x:
      oneMinusT3 * p0.x +
      3 * oneMinusT2 * t * p1.x +
      3 * oneMinusT * t2 * p2.x +
      t3 * p3.x,
    y:
      oneMinusT3 * p0.y +
      3 * oneMinusT2 * t * p1.y +
      3 * oneMinusT * t2 * p2.y +
      t3 * p3.y,
  };
}

/**
 * Computes the first derivative (tangent vector) of a cubic Bézier curve at t.
 * The derivative gives the direction and speed of movement along the curve.
 * Formula: B'(t) = 3(1-t)²(P₁-P₀) + 6(1-t)t(P₂-P₁) + 3t²(P₃-P₂)
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @param {number} t - Parameter value in range [0, 1]
 * @returns {Point} The tangent vector at parameter t (not normalized)
 * @example
 * // Get tangent at midpoint of curve
 * const tangent = cubicBezierDerivative(p0, p1, p2, p3, 0.5);
 * // Normalize for direction: { x: tangent.x / len, y: tangent.y / len }
 */
export function cubicBezierDerivative(p0, p1, p2, p3, t) {
  const oneMinusT = 1 - t;
  const oneMinusT2 = oneMinusT * oneMinusT;
  const t2 = t * t;

  return {
    x:
      3 * oneMinusT2 * (p1.x - p0.x) +
      6 * oneMinusT * t * (p2.x - p1.x) +
      3 * t2 * (p3.x - p2.x),
    y:
      3 * oneMinusT2 * (p1.y - p0.y) +
      6 * oneMinusT * t * (p2.y - p1.y) +
      3 * t2 * (p3.y - p2.y),
  };
}

/**
 * Computes the second derivative of a cubic Bézier curve at t.
 * Indicates how the tangent is changing - related to curvature.
 * Formula: B''(t) = 6(1-t)(P₂-2P₁+P₀) + 6t(P₃-2P₂+P₁)
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @param {number} t - Parameter value in range [0, 1]
 * @returns {Point} The second derivative vector at parameter t
 * @example
 * // Used for curvature calculations
 * const accel = cubicBezierSecondDerivative(p0, p1, p2, p3, 0.5);
 */
export function cubicBezierSecondDerivative(p0, p1, p2, p3, t) {
  const oneMinusT = 1 - t;

  // P₂ - 2P₁ + P₀
  const ax = p2.x - 2 * p1.x + p0.x;
  const ay = p2.y - 2 * p1.y + p0.y;

  // P₃ - 2P₂ + P₁
  const bx = p3.x - 2 * p2.x + p1.x;
  const by = p3.y - 2 * p2.y + p1.y;

  return {
    x: 6 * oneMinusT * ax + 6 * t * bx,
    y: 6 * oneMinusT * ay + 6 * t * by,
  };
}

/**
 * Samples a cubic Bézier curve into an array of points for rendering.
 * Creates evenly-spaced parameter values and evaluates the curve at each.
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @param {number} segments - Number of line segments to divide the curve into
 *                            (returns segments + 1 points)
 * @returns {Point[]} Array of points along the curve
 * @example
 * // Sample curve into 50 segments (51 points)
 * const points = sampleCurve(p0, p1, p2, p3, 50);
 * // points[0] === p0, points[50] === p3
 */
export function sampleCurve(p0, p1, p2, p3, segments) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(cubicBezier(p0, p1, p2, p3, t));
  }
  return points;
}

// ============================================================================
// 1.3 CONTINUITY ENFORCEMENT
// ============================================================================

/**
 * Enforces C⁰ (positional) continuity between two segments.
 * Ensures the end point of the previous segment matches the
 * start point of the next segment.
 *
 * @param {Segment} prevSegment - The preceding Bézier segment
 * @param {Segment} nextSegment - The following Bézier segment to modify
 * @returns {Segment} Modified nextSegment with p0 = prevSegment.p3
 * @example
 * const adjusted = enforceC0(segment1, segment2);
 * // adjusted.p0 === segment1.p3
 */
export function enforceC0(prevSegment, nextSegment) {
  return {
    ...nextSegment,
    p0: { ...prevSegment.p3 },
  };
}

/**
 * Enforces C¹ (tangent) continuity between two segments.
 * The tangent vectors at the junction point are equal in both
 * direction and magnitude, creating a smooth transition.
 * Modifies nextSegment.p0 and nextSegment.p1.
 * Formula: nextP1 = 2 * prevP3 - prevP2
 *
 * @param {Segment} prevSegment - The preceding Bézier segment
 * @param {Segment} nextSegment - The following Bézier segment to modify
 * @returns {Segment} Modified nextSegment with C¹ continuous junction
 * @example
 * const adjusted = enforceC1(segment1, segment2);
 * // adjusted.p1 is positioned to match tangent from segment1
 */
export function enforceC1(prevSegment, nextSegment) {
  const newP1 = calculateC1Handle(prevSegment.p2, prevSegment.p3);
  return {
    ...nextSegment,
    p0: { ...prevSegment.p3 },
    p1: newP1,
  };
}

/**
 * Enforces C² (curvature) continuity between two segments.
 * Both tangent and curvature match at the junction, providing
 * the smoothest possible transition. Modifies nextSegment.p0,
 * nextSegment.p1, and nextSegment.p2.
 * Formulas:
 *   nextP1 = 2 * prevP3 - prevP2
 *   nextP2 = 4 * prevP3 - 4 * prevP2 + prevP1
 *
 * @param {Segment} prevSegment - The preceding Bézier segment
 * @param {Segment} nextSegment - The following Bézier segment to modify
 * @returns {Segment} Modified nextSegment with C² continuous junction
 * @example
 * const adjusted = enforceC2(segment1, segment2);
 * // Both tangent AND curvature match at junction
 */
export function enforceC2(prevSegment, nextSegment) {
  const newP1 = calculateC1Handle(prevSegment.p2, prevSegment.p3);
  const newP2 = calculateC2Handle(
    prevSegment.p1,
    prevSegment.p2,
    prevSegment.p3,
  );
  return {
    ...nextSegment,
    p0: { ...prevSegment.p3 },
    p1: newP1,
    p2: newP2,
  };
}

/**
 * Calculates the position for the next segment's first control point (P1)
 * to achieve C¹ continuity with the previous segment.
 * The new P1 is the reflection of prevP2 across prevP3.
 *
 * @param {Point} prevP2 - The second control point of the previous segment
 * @param {Point} prevP3 - The end anchor of the previous segment
 *                         (which is also the start of the next segment)
 * @returns {Point} The calculated position for nextSegment.p1
 * @example
 * const newP1 = calculateC1Handle(segment.p2, segment.p3);
 * // newP1 creates smooth tangent continuation
 */
export function calculateC1Handle(prevP2, prevP3) {
  return {
    x: 2 * prevP3.x - prevP2.x,
    y: 2 * prevP3.y - prevP2.y,
  };
}

/**
 * Calculates the position for the next segment's first control point (P1)
 * to achieve C² continuity with the previous segment.
 * Ensures both tangent and curvature continuity.
 *
 * @param {Point} prevP1 - The first control point of the previous segment
 * @param {Point} prevP2 - The second control point of the previous segment
 * @param {Point} prevP3 - The end anchor of the previous segment
 * @returns {Point} The calculated position for nextSegment.p1
 * @example
 * const newP1 = calculateC2Handle(seg.p1, seg.p2, seg.p3);
 * // newP1 creates smooth curvature continuation
 */
export function calculateC2Handle(prevP1, prevP2, prevP3) {
  // For C² continuity, we need: nextP2 = 4*prevP3 - 4*prevP2 + prevP1
  // But this function returns the P2 position for C² continuity
  return {
    x: 4 * prevP3.x - 4 * prevP2.x + prevP1.x,
    y: 4 * prevP3.y - 4 * prevP2.y + prevP1.y,
  };
}

// ============================================================================
// 1.4 CURVE UTILITIES
// ============================================================================

/**
 * Approximates the arc length of a cubic Bézier curve.
 * Samples the curve into line segments and sums their lengths.
 * Higher segment count = more accurate but slower.
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @param {number} [segments=100] - Number of segments for approximation
 * @returns {number} Approximate arc length in the same units as coordinates
 * @example
 * const len = curveLength(p0, p1, p2, p3, 100);
 * console.log(`Curve is approximately ${len}px long`);
 */
export function curveLength(p0, p1, p2, p3, segments = 100) {
  let length = 0;
  let prevPoint = p0;

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const currentPoint = cubicBezier(p0, p1, p2, p3, t);
    length += distance(prevPoint, currentPoint);
    prevPoint = currentPoint;
  }

  return length;
}

/**
 * Splits a cubic Bézier curve at parameter t using De Casteljau's algorithm.
 * Returns two new segments that together represent the original curve.
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @param {number} t - Split point parameter in range [0, 1]
 * @returns {[Segment, Segment]} Two segments: [0,t] portion and [t,1] portion
 * @example
 * const [first, second] = splitCurve(p0, p1, p2, p3, 0.5);
 * // first covers the first half, second covers the second half
 */
export function splitCurve(p0, p1, p2, p3, t) {
  // De Casteljau's algorithm
  const p01 = lerp(p0, p1, t);
  const p12 = lerp(p1, p2, t);
  const p23 = lerp(p2, p3, t);

  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);

  const p0123 = lerp(p012, p123, t);

  return [
    { p0: p0, p1: p01, p2: p012, p3: p0123 },
    { p0: p0123, p1: p123, p2: p23, p3: p3 },
  ];
}

/**
 * Computes the axis-aligned bounding box of a cubic Bézier curve.
 * Finds the minimum and maximum x and y values the curve reaches.
 * Considers control points and computes extrema from derivative roots.
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @returns {BoundingBox} Object with min and max corner points
 * @example
 * const { min, max } = boundingBox(p0, p1, p2, p3);
 * // min = { x: leftmost, y: topmost }
 * // max = { x: rightmost, y: bottommost }
 */
export function boundingBox(p0, p1, p2, p3) {
  // Start with endpoints
  let minX = Math.min(p0.x, p3.x);
  let maxX = Math.max(p0.x, p3.x);
  let minY = Math.min(p0.y, p3.y);
  let maxY = Math.max(p0.y, p3.y);

  // Find roots of derivative for x and y to get extrema
  // B'(t) = 3(1-t)²(P₁-P₀) + 6(1-t)t(P₂-P₁) + 3t²(P₃-P₂)
  // This is a quadratic in t, solve for each axis

  const findExtrema = (v0, v1, v2, v3) => {
    // Derivative coefficients: at² + bt + c = 0
    // where derivative is 3[(1-t)²(v1-v0) + 2(1-t)t(v2-v1) + t²(v3-v2)]
    const a = -v0 + 3 * v1 - 3 * v2 + v3;
    const b = 2 * v0 - 4 * v1 + 2 * v2;
    const c = -v0 + v1;

    const roots = [];

    if (Math.abs(a) < 1e-10) {
      // Linear case
      if (Math.abs(b) > 1e-10) {
        const t = -c / b;
        if (t > 0 && t < 1) roots.push(t);
      }
    } else {
      // Quadratic case
      const discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) {
        const sqrtD = Math.sqrt(discriminant);
        const t1 = (-b + sqrtD) / (2 * a);
        const t2 = (-b - sqrtD) / (2 * a);
        if (t1 > 0 && t1 < 1) roots.push(t1);
        if (t2 > 0 && t2 < 1) roots.push(t2);
      }
    }

    return roots;
  };

  // Check x extrema
  const xRoots = findExtrema(p0.x, p1.x, p2.x, p3.x);
  for (const t of xRoots) {
    const pt = cubicBezier(p0, p1, p2, p3, t);
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
  }

  // Check y extrema
  const yRoots = findExtrema(p0.y, p1.y, p2.y, p3.y);
  for (const t of yRoots) {
    const pt = cubicBezier(p0, p1, p2, p3, t);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
  }

  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
  };
}

// ============================================================================
// 1.5 HIT TESTING
// ============================================================================

/**
 * Checks if a point is within a given tolerance distance from the curve.
 * Useful for detecting mouse clicks/hovers on a curve.
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @param {Point} point - The point to test (e.g., mouse position)
 * @param {number} tolerance - Maximum distance in pixels to consider "on curve"
 * @returns {boolean} True if point is within tolerance of the curve
 * @example
 * const isHit = pointOnCurve(p0, p1, p2, p3, mousePos, 5);
 * if (isHit) {
 *   highlightCurve();
 * }
 */
export function pointOnCurve(p0, p1, p2, p3, point, tolerance) {
  const result = nearestPointOnCurve(p0, p1, p2, p3, point);
  return distance(point, result.point) <= tolerance;
}

/**
 * Finds the closest point on the curve to a given point.
 * Returns both the closest point coordinates and the parameter t.
 * Uses sampling to approximate the nearest point.
 *
 * @param {Point} p0 - Start anchor point
 * @param {Point} p1 - First control point
 * @param {Point} p2 - Second control point
 * @param {Point} p3 - End anchor point
 * @param {Point} point - The reference point to find nearest to
 * @param {number} [segments=100] - Number of samples for search accuracy
 * @returns {NearestPointResult} Object with closest point and its t value
 * @example
 * const { point: closest, t } = nearestPointOnCurve(
 *   p0, p1, p2, p3, mousePos, 100
 * );
 * console.log(`Closest point at t=${t}: (${closest.x}, ${closest.y})`);
 */
export function nearestPointOnCurve(p0, p1, p2, p3, point, segments = 100) {
  let minDist = Infinity;
  let closestPoint = p0;
  let closestT = 0;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const curvePoint = cubicBezier(p0, p1, p2, p3, t);
    const dist = distance(point, curvePoint);

    if (dist < minDist) {
      minDist = dist;
      closestPoint = curvePoint;
      closestT = t;
    }
  }

  return { point: closestPoint, t: closestT };
}

// ============================================================================
// 1.6 RENDERING HELPERS (for DIV approach)
// ============================================================================

/**
 * Calculates the angle (in degrees) of the line segment from p1 to p2.
 * Used for CSS transform: rotate() when rendering curve segments as DIVs.
 * Angle is measured clockwise from the positive x-axis.
 *
 * @param {Point} p1 - Starting point of the segment
 * @param {Point} p2 - Ending point of the segment
 * @returns {number} Angle in degrees (0-360), suitable for CSS rotation
 * @example
 * const angle = segmentAngle({ x: 0, y: 0 }, { x: 100, y: 100 });
 * // Returns: 45 (degrees)
 * div.style.transform = `rotate(${angle}deg)`;
 */
export function segmentAngle(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Calculates the length of a line segment between two points.
 * Used for CSS width when rendering curve segments as DIVs.
 * This is a convenience wrapper around the distance function.
 *
 * @param {Point} p1 - Starting point of the segment
 * @param {Point} p2 - Ending point of the segment
 * @returns {number} Length in the same units as coordinates (pixels)
 * @example
 * const len = segmentLength({ x: 0, y: 0 }, { x: 3, y: 4 });
 * // Returns: 5
 * div.style.width = `${len}px`;
 */
export function segmentLength(p1, p2) {
  return distance(p1, p2);
}
