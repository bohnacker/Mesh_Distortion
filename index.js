'use strict';

var packageInfo = require('./package.json');
var glm = require('gl-matrix');
var V = glm.vec3;
var M = glm.mat4;
var Q = glm.quat;

// console.log("%c * " + packageInfo.name + " " + packageInfo.version + " * ", "background: #ccc; color: black");

// Constants 
var ORIGINS = 0;
var TARGETS = 1;

var TWO_PI = Math.PI * 2;

/**
 * new StretchTransform() creates an empty StretchTransform. 
 */
function StretchTransform() {

  // Exponent of the weighting function for how the relations from one anchor
  // to all others are cumulated. The closer the other anchor lies, the
  // stronger it is weighted.
  this.weightingExponent1 = 1;
  // Exponent of the weighting function when applying all anchor matrices to a
  // point.
  this.weightingExponent2 = 2;

  this.anchors = [];

  this.matricesUpToDate = false;


  /**
   * Adds an Anchor where origin and target is the same. You can change either of them later on. 
   * @param {Array} p
   *            Array [x, y, z] that will be used for origin and target position. Z coordinate is optional.
   * @return {Anchor} The new anchor
   */

  /**
   * Adds an Anchor. pOrigin will be transformed to pTarget.
   * @param {Array} pOrigin
   *            Array [x, y, z] for the origin position. Z coordinate is optional.
   * @param {Array} pTarget
   *            Array [x, y, z] for the target position. Z coordinate is optional.
   * @return {Anchor} The new anchor
   */

  StretchTransform.prototype.addAnchor = function() {
    var pOrigin;
    var pTarget;

    if (arguments.length == 1) {
      arguments[0][2] = arguments[0][2] || 0;
      pOrigin = arguments[0];
      pTarget = arguments[0];
    }
    if (arguments.length == 2) {
      if (arguments[0] instanceof Float32Array || arguments[0] instanceof Array) {
        arguments[0][2] = arguments[0][2] || 0;
        pOrigin = arguments[0];
        arguments[1][2] = arguments[1][2] || 0;
        pTarget = arguments[1];
      } else {
        pOrigin = V.fromValues(arguments[0], arguments[1], 0, 1);
        pTarget = V.fromValues(arguments[0], arguments[1], 0, 1);
      }
    }

    var anchor = new Anchor(pOrigin, pTarget);
    this.anchors.push(anchor);
    this.matricesUpToDate = false;

    return anchor;
  }

  /**
   * Removes an Anchor giving the index of the anchor.
   * @param {Number} i  Index of the anchor
   */

  /**
   * Removes an Anchor giving the anchor
   * @param {Anchor} anchor  Anchor to remove
   */

  StretchTransform.prototype.removeAnchor = function() {
    var a = arguments[0];
    if (a instanceof Anchor) {
      this.anchors.splice(this.anchors.indexOf(a), 1);
    } else {
      this.anchors.splice(a, 1);
    }
    this.matricesUpToDate = false;
  }

  /**
   * @return {Number} of anchors added to the MultiTransform
   */
  StretchTransform.prototype.getAnchorCount = function() {
    return this.anchors.length;
  }

  /**
   * @param {Number} i
   *            Index of the anchor to return.
   */
  StretchTransform.prototype.getAnchor = function(i) {
    return this.anchors[i];
  }

  /**
   * @param {Array} p
   *            point [x, y, z] to search for an anchor (either origin or target position). Z coordinate is optional.
   * @param {Number} tolerance
   *            Radius around Anchor
   * @return {Number} Index of the found anchor or -1 if nothing was found at the specified position
   */

  StretchTransform.prototype.getAnchorByPos = function(p, tolerance) {
    p[2] = p[2] || 0;
    for (var i = this.anchors.length - 1; i >= 0; i--) {
      if (H.dist(p[0], p[1], p[2], this.getAnchorOrigin(i)[0], this.getAnchorOrigin(i)[1], this.getAnchorOrigin(i)[2]) <= tolerance || H.dist(p[0], p[1], p[2], this.getAnchorTarget(i)[0], this.getAnchorTarget(i)[1], this.getAnchorTarget(i)[2]) <= tolerance) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @param {Array} p
   *            point [x, y, z] to search for the origin position of an anchor. Z coordinate is optional.
   * @param {Number} tolerance
   *            Radius around Anchor
   * @return {Number} Index of the found anchor or -1 if nothing was found at the
   *         specified position
   */
  StretchTransform.prototype.getAnchorByOriginPos = function(p, tolerance) {
    p[2] = p[2] || 0;
    for (var i = this.anchors.length - 1; i >= 0; i--) {
      if (H.dist(p[0], p[1], p[2], this.getAnchorOrigin(i)[0], this.getAnchorOrigin(i)[1], this.getAnchorOrigin(i)[2]) <= tolerance) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @param {Array} p
   *            point [x, y, z] to search for the target position of an anchor. Z coordinate is optional.
   * @param {Number} tolerance
   *            Radius around Anchor
   * @return {Number} Index of the found anchor or -1 if nothing was found at the
   *         specified position
   */
  StretchTransform.prototype.getAnchorByTargetPos = function(p, tolerance) {
    p[2] = p[2] || 0;
    for (var i = this.anchors.length - 1; i >= 0; i--) {
      if (H.dist(p[0], p[1], p[2], this.getAnchorTarget(i)[0], this.getAnchorTarget(i)[1], this.getAnchorTarget(i)[2]) <= tolerance) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @param {Number} i
   *            Index of the anchor.
   * @return {Array} 
   *            The origin position.
   */
  StretchTransform.prototype.getAnchorOrigin = function(i) {
    return this.anchors[i].getOriginPosition();
  }


  /**
   * @param {Number} i
   *            Index of the anchor.
   * @param {Array} p
   *            New origin position [x, y, z]. Z coordinate is optional.
   */
  StretchTransform.prototype.setAnchorOrigin = function(i, p) {
    this.anchors[i].setOriginPosition(p);
    this.matricesUpToDate = false;
  }

  /**
   * @param {Number} i
   *            Index of the anchor.
   * @return {Array} 
   *            The target position.
   */
  StretchTransform.prototype.getAnchorTarget = function(i) {
    return this.anchors[i].getTargetPosition();
  }

  /**
   * @param {Number} i
   *            Index of the anchor.
   * @param {Array} p
   *            New target position [x, y, z]. Z coordinate is optional.
   */
  StretchTransform.prototype.setAnchorTarget = function(i, p) {
    this.anchors[i].setTargetPosition(p);
    this.matricesUpToDate = false;
  }

  /**
   * @return {Number} 
   */
  StretchTransform.prototype.getWeightingExponent1 = function() {
    return this.weightingExponent1;
  }

  /**
   * Exponent of the weighting function. Defines how the relations from one anchor to all others are cumulated. The closer the other anchor lies, the stronger it is weighted.
   * 
   * @param {Number} val
   *            Usually something between 0 and 2. Default = 1.
   */
  StretchTransform.prototype.setWeightingExponent1 = function(val) {
    this.weightingExponent1 = val;
    this.matricesUpToDate = false;
  }

  /**
   * @return {Number} 
   */
  StretchTransform.prototype.getWeightingExponent2 = function() {
    return this.weightingExponent2;
  }

  /**
   * Exponent of the weighting function when applying all anchor matrices to a
   * point.
   * 
   * @param {Number} val
   *            Usually 1 or higher. Default = 2.
   */
  StretchTransform.prototype.setWeightingExponent2 = function(val) {
    this.weightingExponent2 = val;
    this.matricesUpToDate = false;
  }


  /**
   * Main function of the class. Transforms a point on the plane and returns
   * its new position.
   * 
   * @param {Array} p
   *            Point given as an Array [x, y, z] to be transformed. Z coordinate is optional.
   * @return {Array} Transformed point as an Array.
   */

  StretchTransform.prototype.transform = function() {
    var p = arguments[0];
    p = V.fromValues(p[0], p[1], p[2] || 0);

    if (this.matricesUpToDate == false) {
      this.updateAnchorMatrices();
    }

    var pTransformed = V.clone(p);
    var weights = this.calcWeights(p, ORIGINS, -1, this.weightingExponent2);

    // apply matrix-transforms to the point
    var dvecOffsetSum = V.create();
    for (var i = 0; i < this.anchors.length; i++) {
      // delta vector from orig-anchor to the point
      var dvec = V.create();
      V.sub(dvec, p, this.anchors[i].getOriginPosition());

      // apply the matrix of this anchor to that delta vector
      var dvecres = V.create();
      V.transformMat4(dvecres, dvec, this.anchors[i].getTransformMatrix());

      // offset between the delta vector and the transformed delta vector
      var dvecOffset = V.create();
      V.sub(dvecOffset, dvecres, dvec);

      // multiply this offset by the weight of this anchor
      V.scale(dvecOffset, dvecOffset, weights[i]);

      // add up all offset
      V.add(dvecOffsetSum, dvecOffsetSum, dvecOffset);
    }
    // add the sum of all offsets to the point
    V.add(pTransformed, pTransformed, dvecOffsetSum);

    return pTransformed;
  }

  /**
   * It's usually not necessary to call this method. If anchors and parameters
   * are always set with the given methods (setAnchorOrigin(), ...), this
   * method will be called automatically. It calculates a transformation
   * matrix for each anchor. This matrix reflects the translation of the
   * anchor and the rotation and scaling depending on the (possibly) changed
   * positions of all other anchors.
   */
  StretchTransform.prototype.updateAnchorMatrices = function() {
    for (var i = 0; i < this.anchors.length; i++) {
      var t = V.fromValues(
        this.anchors[i].targetPosition[0] - this.anchors[i].originPosition[0],
        this.anchors[i].targetPosition[1] - this.anchors[i].originPosition[1],
        this.anchors[i].targetPosition[2] - this.anchors[i].originPosition[2],
        0);
      var matrix = M.create();
      M.fromTranslation(matrix, t);

      // calculate weights for this anchor so that closer anchors have
      // more influence on its rotation and scaling
      // could also be done with the origin positions, but I think that
      // it's far better to do it with the target positions.
      // var weights = this.calcWeights(this.anchors[i].getOriginPosition(), TARGETS, i, this.weightingExponent1);
      var weights = this.calcWeights(this.anchors[i].getTargetPosition(), TARGETS, i, this.weightingExponent1);

      var quaternions = [];

      var sFac = 1;

      for (var jj = 0; jj < 0 + this.anchors.length; jj++) {
        var j = jj % this.anchors.length;
        var fac = weights[j];

        if (i != j) {
          var originI = this.anchors[i].getOriginPosition();
          var originJ = this.anchors[j].getOriginPosition();
          var targetI = this.anchors[i].getTargetPosition();
          var targetJ = this.anchors[j].getTargetPosition();

          var v1 = V.create();
          V.sub(v1, originJ, originI);
          V.normalize(v1, v1);
          var v2 = V.create();
          V.sub(v2, targetJ, targetI);
          V.normalize(v2, v2);

          var q = Q.create();
          Q.rotationTo(q, v1, v2);
          quaternions.push(q);

          var d1 = V.dist(originJ, originI);
          var d2 = V.dist(targetJ, targetI);
          var s = d2 / d1;

          if (d1 == 0 && d2 == 0)
            s = 1;
          else if (d1 == 0)
            s = 10;

          s = Math.pow(s, fac);
          sFac *= s;
        } else {
          quaternions.push(Q.create());
        }
      }

      var quatAv = H.quaternionAverage(quaternions, weights);
      var rotationMatrix = M.create();
      M.fromQuat(rotationMatrix, quatAv);


      M.mul(matrix, matrix, rotationMatrix);
      M.scale(matrix, matrix, [sFac, sFac, sFac]);

      this.anchors[i].setTransformMatrix(matrix);
    }

    this.matricesUpToDate = true;
  }

  StretchTransform.prototype.calcWeights = function(p, mode, excludeIndex, exponent) {

    // calc distances between point and all original anchors
    var dists = [];

    var n = this.anchors.length;

    var k = -1;
    var minDist = Number.MAX_VALUE;

    for (var i = 0; i < n; i++) {
      var otherPoint;
      if (mode == ORIGINS) {
        otherPoint = this.anchors[i].getOriginPosition();
      } else {
        otherPoint = this.anchors[i].getTargetPosition();
      }

      dists[i] = V.dist(p, otherPoint);
      if (dists[i] < minDist && i != excludeIndex) {
        minDist = dists[i];
        k = i;
      }
    }

    // calc attraction weights (sum of all weights must be 1)
    var weights = [];
    weights.length = this.anchors.length;
    weights.fill(0);

    if (minDist == 0) {
      weights[k] = 1;
    } else {
      var distfacs = [];
      var sum = 0;

      for (var i = 0; i < n; i++) {
        if (i != excludeIndex) {
          distfacs[i] = 1 / (Math.pow(dists[i], exponent));
          sum += distfacs[i];
        } else {
          distfacs[i] = 0;
        }
      }

      for (var i = 0; i < n; i++) {
        if (sum == 0) weights[i] = 0;
        else weights[i] = distfacs[i] / sum;
      }
    }

    return weights;
  }


}



// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------


/**
 * An Anchor has an origin an a target position. Usually you won't have to deal with it directly. Still, there are some functions which could come handy.
 */
function Anchor(pOrigin, pTarget) {
  this.originPosition = V.create();
  this.targetPosition = V.create();
  this.transformMatrix = M.create();

  if (pTarget == undefined) pTarget = pOrigin;

  this.originPosition = V.clone(pOrigin);
  this.targetPosition = V.clone(pTarget);


  /**
   * @return {Array} 
   *            The origin position.
   */
  Anchor.prototype.getOriginPosition = function() {
    return V.clone(this.originPosition);
  }

  /**
   * @param {Array} p
   *            New origin position [x, y, z]. Z coordinate is optional.
   */
  Anchor.prototype.setOriginPosition = function() {
    arguments[0][2] = arguments[0][2] || 0;
    this.originPosition = V.clone(arguments[0]);
  }

  /**
   * @return {Array} 
   *            The target position.
   */
  Anchor.prototype.getTargetPosition = function() {
    return V.clone(this.targetPosition);
  }

  /**
   * @param {Array} p
   *            New target position [x, y, z]. Z coordinate is optional.
   */
  Anchor.prototype.setTargetPosition = function() {
    arguments[0][2] = arguments[0][2] || 0;
    this.targetPosition = V.clone(arguments[0]);
  }

  /**
   * @return {Array} 
   *            The transformation matrix of this anchor.
   */
  Anchor.prototype.getTransformMatrix = function() {
    return M.clone(this.transformMatrix);
  }

  Anchor.prototype.setTransformMatrix = function(matrix) {
    this.transformMatrix = matrix;
  }


}



// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------



// Math Helper functions
var H = {

  // calculates the weighted sperical interpolation from a list of quaternions
  quaternionAverage: function(quaternions, weights) {
    var len = weights.length;

    // sumarize weights
    var weightSums = [];
    weightSums[0] = weights[0];
    for (var i = 1; i < len; i++) {
      weightSums[i] = weightSums[i - 1] + weights[i];
    }
    // if all weights are 0, return the first quaternion
    if (weightSums[len - 1] == 0) {
      return quaternions[0];
    }

    // interpolate quaternions
    var res = Q.clone(quaternions[0]);
    for (i = 1; i < len; i++) {
      var amount = weights[i] / parseFloat(weightSums[i]);
      Q.slerp(res, res, quaternions[i], amount);
    }
    return res;
  },

  dist: function() {
    var x1, y1, z1, x2, y2, z2
    if (arguments.length == 4) {
      x1 = arguments[0];
      y1 = arguments[1];
      z1 = 0;
      x2 = arguments[2];
      y2 = arguments[3];
      z2 = 0;
    } else {
      x1 = arguments[0];
      y1 = arguments[1];
      z1 = arguments[2];
      x2 = arguments[3];
      y2 = arguments[4];
      z2 = arguments[5];
    }
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));
  }

}


module.exports = StretchTransform;