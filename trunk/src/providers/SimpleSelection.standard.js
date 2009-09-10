// standard javascript events provider
// dumb simple since we don't actually need much
(function() {
	var handlers = [];
	
	SimpleSelection.events.add = function(node, eventName, listener) {
		var handler = function(e) { e = e || window.event; listener(e); };
		handlers.push([listener, handler]);
		
		if (node.addEventListener) {
			node.addEventListener(eventName, handler, false);
		}
		else {
			node.attachEvent("on" + eventName, handler);
		}
	};
	
	SimpleSelection.events.remove = function(node, eventName, listener) {
		var handler = listener;
		
		for (var i = handlers.length - 1; i >= 0; i--) {
			if (handlers[i][0] === listener) {
				handler = handlers.splice(i, 1)[0][1];
				break;
			}
		}
		if (node.removeEventListener) {
			node.removeEventListener(eventName, handler, false);
		}
		else {
			node.detachEvent("on" + eventName, handler);
		}
	};
})();