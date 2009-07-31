/**
 * A simple wrapper around the browser's native range object 
 * that provides common functionality across all browsers.
 * @class SimpleRange 
 * @constructor
 * @param {Range|TextRange} nativeRange An instance of the browser's native range object to wrap.
 */
var SimpleRange = function() { return this.init.apply(this, arguments); };
SimpleRange.prototype = {
	constructor: SimpleRange,
	_nativeRange: null,
	_rangeType: "DOM",
	_stateCache: null,
	
	init: function(nativeRange) {
		if (!nativeRange) {
			return SimpleRange.createDefaultRange();
		}
		
		this._nativeRange = nativeRange;
		if (nativeRange.cloneContents) {
			this._rangeType = "DOM";
		}
		else if (nativeRange.item) {
			this._rangeType = "IEControlRange";
		}
		else {
			this._rangeType = "IETextRange";
		}
	},
	
	/**
	 * Gets the text contained by the range.
	 * @return {String} 
	 */
	getText: function() {
		if (this._rangeType === "DOM") {
			return this._nativeRange.toString();
		}
		else {
			return this._nativeRange.text;
		}
	},
	
	/**
	 * Gets the snippet contained by the range.
	 * Nodes whose end are not included will be closed in the snippet.
	 * @return {String}
	 */
	getHTML: function() {
		if (this._rangeType === "DOM") {
			var node = this._nativeRange.cloneContents();
			var div = document.createElement("div");
			div.appendChild(node);
			var html = div.innerHTML;
			return html;
		}
		else {
			return this._nativeRange.htmlText;
		}
	},
	
	/**
	 * Gets a clone of the DOM nodes contained by the selection.
	 * @return {DocumentFragment} 
	 */
	cloneContents: function() {
		if (this._rangeType === "DOM") {
			return this._nativeRange.cloneContents();
		}
		else {
			// Create fragment from childnodes of span populated with range's HTML
			var fragment = document.createDocumentFragment();
			var div = document.createElement("div");
			div.innerHTML = this._nativeRange.htmlText;
			var nodes = div.childNodes;
			while (nodes.length) {
				fragment.appendChild(nodes[0]);
			}
			return fragment;
		}
	},
	
	/**
	 * Determines whether the range is collapsed (it starts and ends at the same point).
	 * @return {Boolean}
	 */
	isCollapsed: function() {
		if (this._rangeType === "DOM") {
			return this._nativeRange.collapsed;
		}
		else {
			return this._nativeRange.compareEndPoints("StartToEnd", this._nativeRange) === 0;
		}
	},
	
	/**
	 * Gets the deepest element in the document that contains the entire range.
	 * @return {HTML Element} 
	 */
	getContainingNode: function() {
		var range = this._nativeRange;
		if (!range) { return null; }
		// DOM || IE
		try {
			return range.commonAncestorContainer || range.parentElement();
		} catch(ex) {
			return range.item(0).parentNode;
		}
	},
	
	/**
	 * Determines whether the entire range is contained with a given node.
	 * @param {HTML Element} node Check if the range is contained by this element.
	 * @return {Boolean} 
	 */
	isIn: function(node) {
		var contain = this.getContainingNode();
		while (contain) {
			if (contain === node) {
				return true;
			}
			contain = contain.parentNode;
		}
		return false;
	},
	
	/**
	 * Determines whether the range is roughly equivalent to an element.
	 * @param {Boolean} normalize If true, the range will be modified actually be equivalent to the node it is roughly equivalent to.
	 * @param {Boolean} outermost If true, normalizes towards the outermost element, rather than the innermost.
	 * @return {Boolean|HTML Element} Returns the element the range is equivalent to or false.
	 */
	isElement: function(normalize, outermost) {
		if (normalize == null) { normalize = true; }
		
		var range = this._nativeRange;
		if (!range) { return false; }
		
		if (this._rangeType === "IEControlRange") {
			// IE Control Range (not text range)
			// Just return the first element in the range
			return range.item(0);
		}
		else if (this._rangeType === "IETextRange") {
			// IE is always normalized, so we just need to see if the element range == this range
			var elem = range.parentElement();
			var elemRange = SimpleRange.createNativeRange(elem);
			if (range.compareEndPoints("StartToStart", elemRange) === 0
			 && range.compareEndPoints("EndToEnd", elemRange) === 0) {
				return elem;
			}
			else {
				return false;
			}
		}
		else if (range.startContainer && !range.collapsed) {
			// DOM-compatible range
			var left, right;
			
			if (range.startContainer === range.endContainer
			 && (range.startOffset === 0 && range.endOffset === range.startContainer.childNodes.length)) {
			 	left = right = range.startContainer;
			}
			else {
				// Left edge
				if (range.startContainer.nodeType === 1) { // left edge is *on* a node
					left = range.startContainer.childNodes[range.startOffset];
					if (left.nodeType !== 1) {
						if (!left.previousSibling) { left = left.parentNode; }
						else { left = null; }
					}
				}
				else if (range.startContainer.nodeType === 3) {
					if (range.startContainer.length === range.startOffset) {
						var node = range.startContainer;
						while (node) {
							if (node.nextSibling) {
								if (node.nextSibling.nodeType === 1) { left = node.nextSibling; }
								break;
							}
							node = node.parentNode;
						}
					} else if (range.startOffset === 0 
						    && !range.startContainer.previousSibling) {
						left = range.startContainer.parentNode;
					}
				}
				if (left) {
					// Get innermost
					while (left.childNodes[0] && left.childNodes[0].nodeType === 1) {
						left = left.childNodes[0];
					}
				}
			
				// Right edge
				if (range.endContainer.nodeType === 1) {
					right = range.endContainer.childNodes[Math.max(0, range.endOffset - 1)];
					if (right.nodeType !== 1) {
						if (!right.nextSibling) { right = right.parentNode; }
						else { right = null; }
					}
				}
				else if (range.endContainer.nodeType === 3) {
					if (range.endOffset === 0) {
						var node = range.endContainer;
						while (node) {
							if (node.previousSibling) {
								if (node.previousSibling.nodeType === 1) { right = node.previousSibling; }
								break;
							}
							node = node.parentNode;
						}
					}
					else if (range.endContainer.length === range.endOffset
					      && !range.endContainer.nextSibling) {
						right = range.endContainer.parentNode;
					}
				}
				if (right) {
					// Get innermost
					while (right.childNodes.length > 0 && right.lastChild.nodeType === 1) {
						right = right.lastChild;
					}
				}
			}
			
			// Normalize
			if (normalize) {
				if (left && left.firstChild && left.firstChild.nodeType === 3) {
					range.setStart(left.firstChild, 0);
				}
				if (right && right.lastChild && right.lastChild.nodeType === 3) {
					range.setEnd(right.lastChild, right.lastChild.length);
				}
			}
			
			// Test equivalence of edges
			if (left && right && left.nodeType === 1 && right.nodeType === 1) {
				var result    = null,
				    leftEdge  = left,
				    rightEdge = right;
				
				// Test all possible left edges against all possible right edges
				while (leftEdge) {
					rightEdge = right;
					while (rightEdge) {
						// Test each right edge for equivalence against current left Edge
						if (leftEdge === rightEdge) {
							result = leftEdge;
							break;
						}
						else if (rightEdge.parentNode && rightEdge.parentNode.lastChild === rightEdge) {
							rightEdge = rightEdge.parentNode;
						}
						else {
							break;
						}
					}
					if (!result && leftEdge.parentNode && leftEdge.parentNode.firstChild === leftEdge) {
						leftEdge = leftEdge.parentNode;
					}
					else {
						break;
					}
				}
				
				if (result) {
					if (outermost) {
						while (result) {
							if (result === outermost) {
								return true;
							}
							else if (result.parentNode && result.parentNode.firstChild === result && result.parentNode.lastChild === result) {
								result = result.parentNode;
							}
							else {
								break;
							}
						}
					}
					else {
						return result;
					}
				}
			}
			
			return false;
		}
	},
	
	
	// MUTATORS -------------------------------------------
	
	/**
	 * Collapses the range.
	 * @param {Boolean} [toStart=false] If true, collapses to the start of the range.
	 */
	collapse: function(toStart) {
		this._nativeRange.collapse(!!toStart);
	},
	
	/**
	 * Replaces the contents of the range with a string or DOM node.
	 * @param {String|DOM Node|DocumentFragment} node Content to replace the range with.
	 * @return {DOM Node|DocumentFragment} The actual new content.
	 */
	replaceWith: function(node) {
		if (typeof(node) == "string") {
			node = document.createTextNode(node);
		}
		
		var range = this._nativeRange;
		var collapsed = this.isCollapsed();
		if (node.nodeType == 11) {
			// Fragment
			var first = node.firstChild;
			var last = node.lastChild;
		}
		else {
			// Single node
			var first = node;
			var last = node;
		}
		
		if (this._rangeType === "IETextRange") {
			range.pasteHTML("<span id='SimpleSelection_replace_placeholder'></span>");
			var placeholder = document.getElementById("SimpleSelection_replace_placeholder");
			placeholder.parentNode.replaceChild(node, placeholder);
			
			// Update native range
			range.setEndPoint("StartToStart", SimpleRange.createNativeRange(first));
			if (!collapsed) {
				range.setEndPoint("EndToEnd", SimpleRange.createNativeRange(last));
			}
		}
		else {
			range.deleteContents();
			range.insertNode(node);

			// Update native range
			this._nativeRange.setEndAfter(last);
			if (collapsed) {
				this._nativeRange.collapse(false);
			}
		}
	},
	
	/**
	 * Wraps the contents of the range in an HTML Element
	 * @param {HTML Element|String} node HTML Element to wrap the ranges content in or the name of the element to wrap with (e.g. "span")
	 * @return {HTML Element} The actual element that wrapped the range's content
	 */
	wrapWith: function(node) {
		if (typeof(node) == "string") {
			node = document.createElement(node);
		}
		
		var current = this.cloneContents();
		node.appendChild(current);
		this.replaceWith(node);
		return node;
	},
	
	/**
	 * Determines whether another range represents the same content
	 * @param {SimpleRange|BrowserNativeRange} rangeB The range to compare against.
	 *     Can be another SimpleRange or the browser's native range implementation.
	 */
	equals: function(rangeB) {
		if (rangeB._nativeRange) { rangeB = rangeB._nativeRange; }
		return SimpleRange.nativeEquals(this._nativeRange, rangeB);
	}
};
/**
 * Creates a SimpleRange that represents a DOM Node.
 * @param {DOM Node} node DOM Node the range should represent 
 * @return {SimpleRange}
 */
SimpleRange.fromNode = function(node, contentOnly) {
	return new SimpleRange(SimpleRange.createNativeRange(node, contentOnly));
};
/**
 * Creates a browser-native range representing a DOM Node.
 * @param {DOM Node} node DOM Node the range should represent 
 * @return {Range|TextRange}
 */
SimpleRange.createNativeRange = function(node, contentOnly) {
	var newRange;
	if (document.createRange) {
		newRange = document.createRange();
		newRange[contentOnly ? "selectNodeContents" : "selectNode"](node);
	}
	else {
		newRange = document.body.createTextRange();
		if (node.nodeType === 1) {
			newRange.moveToElementText(node);
		}
		else {
			var marker = document.createElement("a");
			node.parentNode.insertBefore(marker, node);
			var edge = SimpleRange.createNativeRange(marker);
			marker.parentNode.removeChild(marker);
			newRange.setEndPoint("StartToStart", edge);
			newRange.collapse(true);
			newRange.moveEnd("character", node.nodeValue.length);
		}
	}
	return newRange;
};
/**
 * Creates the default range (used when constructing a SimpleRange based on null)
 * @return {SimpleRange}
 */
SimpleRange.createDefaultRange = function() {
	var range = SimpleRange.fromNode(document.body);
	range.collapse(true);
	return range;
};
/**
 * Tests whether two browser-native ranges are equivalent (same start and end points).
 * @param {Range|TextRange} a The first range
 * @param {Range|TextRange} b The range to test the first one against
 */
SimpleRange.nativeEquals = function(a,b) {
	if (a && b) {
		if (a.compareEndPoints) {
			try {
				return a.compareEndPoints("StartToStart", b) === 0 && a.compareEndPoints("EndToEnd", b) === 0;
			} catch(ex) {
				return false;
			}
		}
		else {
			return a.compareBoundaryPoints(Range.START_TO_START, b) === 0 && a.compareBoundaryPoints(Range.END_TO_END, b) === 0;
		}
	}
	return false;
};