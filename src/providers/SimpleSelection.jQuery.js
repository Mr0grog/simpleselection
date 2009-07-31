// jQuery events provider
SimpleSelection.events.add = function(node, eventName, listener) {
	$(node).bind(eventName, listener);
};
SimpleSelection.events.remove = function(node, eventName, listener) {
	$(node).unbind(eventName, listener);
};