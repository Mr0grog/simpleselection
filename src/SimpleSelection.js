/************************************************
Very simple, high-level selection management.
Compatible with Gecko, Webkit, Trident

Some notes:
SimpleSelection assumes there is only one range 
in the user's selection.

************************************************/


var SimpleSelection = {
	eventThrottle: 500,
	_lastListen: 0,
	
	_selectionListeners: {},
	_lastListenerId: 0,
	_currentSelection: null,
	
	/**
	 * Gets the current selection as a SimpleRange.
	 * @return {SimpleRange}
	 */
	getRange: function() {
		// IE
		if (document.selection) {
			return new SimpleRange(document.selection.createRange());
		}
		// DOM
		else {
			var sel = window.getSelection();
			// NOTE: in FIREFOX in editable areas (input, textarea, contentEditable) 
			// shift+arrow keys actually *mutates* the selection's range instead 
			// of creating a new range. For simplicity's sake to keep everything
			// simple and sane, we'll clone the range so that grabbing the 
			// selection's range always produces a new result.
			return new SimpleRange(sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null);
		}
	},
	
	/**
	 * Collapses the selection to a single point.
	 * @param {Boolean} [toStart=false] If true, collapses the selection 
	 * 		to its start point. Otherwise, collapses to the end point.
	 */
	collapse: function(toStart) {
		var range = this.getRange();
		range.collapse(toStart);
		this.select(range);
	},
	
	/**
	 * Selects a node or range.
	 * @param {HTML Element|SimpleRange|Range} range The node or range to select
	 */
	select: function(range) {
		if (range.nodeName) {
			range = SimpleRange.fromNode(range);
		}
		if (range instanceof SimpleRange) {
			range = range._nativeRange;
		}
		if (range) {
			SimpleSelection.selectNativeRange(range);
		}
	},
	
	/**
	 * Selects the _content_ of a node.
	 * @param {HTML Element} node The node whose contents should be selected 
	 */
	selectInside: function(node) {
		var range = SimpleRange.fromNode(node)._nativeRange;
		if (range.selectNodeContents) {
			range.selectNodeContents(node);
		}
		this.selectNativeRange(range);
	},
	
	/**
	 * Selects a range (the browser's native range implementation, not a SimpleRange instance).
	 * @param {Range|TextRange} range The browser native range to select.
	 */
	selectNativeRange: function(range) {
		if (window.getSelection) {
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range.cloneRange());
		}
		else {
			range.select();
		}
		
		this._currentSelection = new SimpleRange(range);
		// TODO: fire event?
		// this.fireEvent("selection");
	},
	
	getText: function() {
		return this.getRange().getText();
	},
	getHTML: function() {
		return this.getRange().getHTML();
	},
	cloneContents: function() {
		return this.getRange().cloneContents();
	},
	isCollapsed: function() {
		return this.getRange().isCollapsed();
	},
	equals: function(range) {
		return this.getRange().equals(range);
	},
	getContainingNode: function() {
		return this.getRange().getContainingNode();
	},
	isIn: function(node) {
		return this.getRange().isIn(node);
	},
	isElement: function(normalize, outermost) {
		var range = this.getRange();
		var result = range.isElement(normalize, outermost);
		if (normalize || normalize == null) {
			this.select(range);
		}
		return result;
	},
	wrapWith: function(node) {
		node = this.getRange().wrapWith(node);
		this.select(node);
		return node;
	},
	replaceWith: function(node) {
		var range = this.getRange();
		node = range.replaceWith(node);
		this.select(range);
		return node;
	},
	
	_listenToSelections: function() {
		var func = function(e) { SimpleSelection._evtSelection(e); };
		this.events.add(document.body, "mouseup", func);
		this.events.add(document, "keyup", func);
		this.events.add(document, "mouseout", func);
	},
	
	_evtSelection: function(e) {
		// Throttle the selection event
		var now = (new Date()).getTime();
		var diff = now - this._lastListen;
		if (diff < this.eventThrottle) {
			if (!arguments.callee.timer) {
				arguments.callee.timer = setTimeout(function() { SimpleSelection._evtSelection(e); }, (this.eventThrottle - diff));
			}
			return;
		}
		arguments.callee.timer = false;
		this._lastListen = now;
		
		// Trap mouseout events only on the document/window 
		// (so we register a selection when mouseup happens outside of window)
		if (e.type !== "mouseout" || e.target === document.documentElement) {
			var newSel = SimpleSelection.getRange();
			if (!this._currentSelection || !this._currentSelection.equals(newSel)) {
				this._currentSelection = newSel;
				this.fireEvent("selection", newSel.getContainingNode());
			}
		}
	},
	
	/**
	 * Add a listener for the selection event.
	 * Note: currently, "eventType"  is superfluous, but exists in case of future event types (unselect?)
	 * @param {HTML Element} node HTML Element to listen to selections on
	 * @param {String} eventType Should be "selection", but currently ignored, as there is only one event type
	 * @param {Function} callback Listener callback function
	 */
	addEventListener: function(node, eventType, callback) {
		// Start listening...
		if (this._lastListenerId === 0) { this._listenToSelections(); }
		
		var selectid = node.selectid;
		if (!selectid) {
			selectid = node.selectid = this._lastListenerId++;
			this._selectionListeners[selectid] = [];
		}
		this._selectionListeners[selectid].push(callback);
	},
	
	/**
	 * Remove an event listener. 
	 * Note: currently, "eventType"  is superfluous, but exists in case of future event types (unselect?)
	 * @param {HTML Element} node HTML Element to stop listening to selections on
	 * @param {String} eventType Should be "selection", but currently ignored, as there is only one event type
	 * @param {Function} callback Listener callback function to remove
	 */
	removeEventListener: function(node, eventType, callback) {
		// TODO: should remove all listeners if no callback specified
		var candidates = this._selectionListeners[node.selectid];
		var idx = candidates.indexOf(callback);
		if (idx !== -1) {
			candidates.splice(idx, 1);
		}
	},
	
	/**
	 * Fire a selection event on a node.
	 * @param {String} eventType Type of event to fire. Should be "selection", but currently ignored, as there is only one event type
	 * @param {HTML Element} [node] Node to fire the selection event on. 
	 * 		If not specified, the current selection will be queried to find the selected node.
	 */
	fireEvent: function(eventType, node) {
		if (!node) {
			this._currentSelection = this.getRange();
			node = this._currentSelection.getContainingNode();
		}
		
		var bubble = true;
		var evt = {
			selection: this._currentSelection,
			target: node,
			stopPropagation: function() { bubble = false; }
		};
		
		// Fire listeners
		while (node && bubble) {
			var listeners = this._selectionListeners[node.selectid];
			if (listeners) {
				for (var i=0, len=listeners.length; i < len; i++) {
					listeners[i](evt);
				}
			}
			node = node.parentNode;
		}
	},
	
	// Providers from other libs
	events: {
		add: function(node, eventName, listener) { throw "No SimpleSelection.events provider!"; },
		remove: function(node, eventName, listner) { throw "No SimpleSelection.events provider!"; }
	}
};