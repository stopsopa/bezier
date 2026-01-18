/**
 * Common utilities shared between Bézier curve editors.
 * Pure functions with no DOM dependencies - fully testable in Node.js.
 * @module common
 */

// ============================================================================
// URL SERIALIZATION - Coordinate & Point
// ============================================================================

/**
 * Serialize a number to URL-safe string.
 * Uses 'n' prefix for negatives to avoid conflict with '-' delimiter.
 * @param {number} n - The number to serialize
 * @returns {string} Serialized coordinate
 */
export function serializeCoord(n) {
  const rounded = Math.round(n * 10) / 10;
  return rounded < 0 ? 'n' + Math.abs(rounded) : String(rounded);
}

/**
 * Parse a coordinate string back to number.
 * @param {string} c - The string to parse (may have 'n' prefix for negative)
 * @returns {number} Parsed number
 */
export function parseCoord(c) {
  return c.startsWith('n') ? -parseFloat(c.slice(1)) : parseFloat(c);
}

/**
 * Serialize a point to "x~y" format.
 * @param {{x: number, y: number}} p - Point object
 * @returns {string} Serialized point
 */
export function serializePoint(p) {
  return serializeCoord(p.x) + '~' + serializeCoord(p.y);
}

/**
 * Parse a "x~y" string back to point object.
 * @param {string} str - Serialized point string
 * @returns {{x: number, y: number}} Point object
 */
export function parsePoint(str) {
  const [x, y] = str.split('~').map(parseCoord);
  return { x, y };
}

// ============================================================================
// URL SERIALIZATION - Segment
// ============================================================================

/**
 * Serialize a Bézier segment to "p0_p1_p2_p3" format.
 * @param {{p0: Object, p1: Object, p2: Object, p3: Object}} seg - Segment
 * @returns {string} Serialized segment
 */
export function serializeSegment(seg) {
  return [seg.p0, seg.p1, seg.p2, seg.p3].map(serializePoint).join('_');
}

/**
 * Parse a segment string back to segment object.
 * @param {string} str - Serialized segment string
 * @returns {{p0: Object, p1: Object, p2: Object, p3: Object}} Segment object
 */
export function parseSegment(str) {
  const points = str.split('_').map(parsePoint);
  return { p0: points[0], p1: points[1], p2: points[2], p3: points[3] };
}

// ============================================================================
// URL SERIALIZATION - Continuity
// ============================================================================

/**
 * Convert continuity mode to single letter for URL.
 * @param {string} mode - 'c1', 'c2', or 'independent'
 * @returns {string} 't', 'c', or 'i'
 */
export function continuityToLetter(mode) {
  if (mode === 'c1') return 't';
  if (mode === 'c2') return 'c';
  return 'i';
}

/**
 * Convert single letter back to continuity mode.
 * @param {string} letter - 't', 'c', or 'i'
 * @returns {string} 'c1', 'c2', or 'independent'
 */
export function letterToContinuity(letter) {
  if (letter === 't') return 'c1';
  if (letter === 'c') return 'c2';
  return 'independent';
}

// ============================================================================
// URL SERIALIZATION - Curve
// ============================================================================

/**
 * Serialize a curve (array of segments + continuity) to string.
 * @param {{segments: Array, continuity: Array}} curve - Curve object
 * @returns {string} Serialized curve
 */
export function serializeCurve(curve) {
  let result = '';
  curve.segments.forEach((seg, i) => {
    if (i > 0) {
      const cont = curve.continuity[i - 1] || 'independent';
      result += '-' + continuityToLetter(cont);
    }
    result += serializeSegment(seg);
  });
  return result;
}

/**
 * Parse a curve string back to curve object.
 * @param {string} str - Serialized curve string
 * @returns {{segments: Array, continuity: Array}} Curve object
 */
export function parseCurve(str) {
  const segments = [];
  const continuity = [];
  const parts = str.split(/-(i|t|c)/);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    if (part === 'i' || part === 't' || part === 'c') {
      continuity.push(letterToContinuity(part));
    } else {
      segments.push(parseSegment(part));
    }
  }
  return { segments, continuity };
}

// ============================================================================
// URL SERIALIZATION - Multiple Curves
// ============================================================================

/**
 * Serialize multiple curves to URL hash string.
 * @param {Array} curves - Array of curve objects
 * @returns {string} URL-safe hash string (without '#')
 */
export function serializeCurves(curves) {
  if (curves.length === 0) return '';
  return curves.map(serializeCurve).join('!');
}

/**
 * Parse URL hash string back to array of curves.
 * @param {string} str - Hash string (without '#')
 * @returns {Array} Array of curve objects
 */
export function parseCurvesFromURL(str) {
  if (!str) return [];
  return str.split('!').filter(s => s).map(parseCurve);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create a debounced version of a function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

// ============================================================================
// NODE DELETION
// ============================================================================

/**
 * Delete a node from curves array (pure function).
 * Returns new curves array and updated activeCurveIndex.
 * 
 * @param {Array} curves - Array of curve objects
 * @param {number} activeCurveIndex - Current active curve index
 * @param {number} curveIndex - Index of curve containing node
 * @param {number} segmentIndex - Index of segment containing node
 * @param {string} pointType - 'p0' or 'p3' (only anchors can be deleted)
 * @returns {{curves: Array, activeCurveIndex: number}} Updated state
 */
export function deleteNodeFromCurves(curves, activeCurveIndex, curveIndex, segmentIndex, pointType) {
  // Only anchor points can be deleted
  if (pointType !== 'p0' && pointType !== 'p3') {
    return { curves, activeCurveIndex };
  }
  if (curveIndex < 0 || curveIndex >= curves.length) {
    return { curves, activeCurveIndex };
  }

  // Deep clone curves to avoid mutation
  const newCurves = curves.map(c => ({
    segments: c.segments.map(s => ({
      p0: { ...s.p0 },
      p1: { ...s.p1 },
      p2: { ...s.p2 },
      p3: { ...s.p3 },
    })),
    continuity: [...c.continuity],
  }));

  const curve = newCurves[curveIndex];
  const numSegments = curve.segments.length;
  
  if (numSegments === 0) {
    return { curves: newCurves, activeCurveIndex };
  }

  let newActiveCurveIndex = activeCurveIndex;

  if (numSegments === 1) {
    // Only one segment - delete entire curve
    newCurves.splice(curveIndex, 1);
    if (newActiveCurveIndex >= newCurves.length) {
      newActiveCurveIndex = newCurves.length - 1;
    }
    return { curves: newCurves, activeCurveIndex: newActiveCurveIndex };
  }

  if (pointType === 'p0' && segmentIndex === 0) {
    // Deleting first anchor - remove first segment
    curve.segments.shift();
    if (curve.continuity.length > 0) curve.continuity.shift();
    return { curves: newCurves, activeCurveIndex: newActiveCurveIndex };
  }

  if (pointType === 'p3' && segmentIndex === numSegments - 1) {
    // Deleting last anchor - remove last segment
    curve.segments.pop();
    if (curve.continuity.length > 0) curve.continuity.pop();
    return { curves: newCurves, activeCurveIndex: newActiveCurveIndex };
  }

  // Deleting middle anchor - merge two adjacent segments
  const deleteIndex = pointType === 'p3' ? segmentIndex : segmentIndex - 1;
  const seg1 = curve.segments[deleteIndex];
  const seg2 = curve.segments[deleteIndex + 1];

  const mergedSegment = {
    p0: { ...seg1.p0 },
    p1: { ...seg1.p1 },
    p2: { ...seg2.p2 },
    p3: { ...seg2.p3 },
  };

  curve.segments.splice(deleteIndex, 2, mergedSegment);
  if (curve.continuity.length > deleteIndex) {
    curve.continuity.splice(deleteIndex, 1);
  }

  return { curves: newCurves, activeCurveIndex: newActiveCurveIndex };
}
