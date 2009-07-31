

getEdge: function(which) {
	var container, offset;
	if (this._rangeType === "DOM") {
		container = this._nativeRange[which === "start" ? "startContainer":"endContainer"];
		offset = this._nativeRange[which === "start" ? "startOffset":"endOffset"];
	}
	else {
		var rangeEdge = this._nativeRange.duplicate();
		rangeEdge.collapse(which === "start");
		var parent = rangeEdge.parentElement();
		var candidates = parent.childNodes;
		container = candidates[candidates.length - 1];
		
		var rangeTest = SimpleRange.createNativeRange(parent);
		for (var i=1, len=candidates.length; i < len; i++) {
			if (candidates[i].nodeType === 1) {
				rangeTest.moveToElementText(candidates[i]);
				var rel = rangeEdge.compareEndPoints("StartToStart", rangeTest);
				if (rel < 0) {
					container = candidates[i - 1];
					break;
				}
			}
		}
		
		rangeTest.moveToElementText(container.previousSibling || container.parentNode);
		rangeTest.collapse(!container.previousSibling);
		rangeTest.setEndPoint("EndToStart", rangeEdge);
		offset = rangeTest.text.length;
	}
	return {
		container: container,
		offset: offset
	};
},

getEdge2: function(which) {
	var container, offset;
	if (this._rangeType === "DOM") {
		container = this._nativeRange[which === "start" ? "startContainer":"endContainer"];
		offset = this._nativeRange[which === "start" ? "startOffset":"endOffset"];
	}
	else {
		var rangeEdge = this._nativeRange.duplicate();
		rangeEdge.collapse(which === "start");
		rangeEdge.pasteHTML("<span id='SimpleRange_marker'></span>");
		var marker = document.getElementById("SimpleRange_marker");
		if (marker.previousSibling && marker.previousSibling.nodeType === 3) {
			offset = marker.previousSibling.nodeValue.length;
			container = marker.previousSibling;
		}
		else {
			offset = 0;
			container = marker.nextSibling;
		}
		var prev = marker.previousSibling;
		var next = marker.nextSibling;
		marker.parentNode.removeChild(marker);
		if (prev && prev.nodeType === 3
		 && next && next.nodeType === 3) {
			prev.data = prev.data + next.data;
			next.parentNode.removeChild(next);
		}
		
		return {
			container: container,
			offset: offset
		};
	}
},

getEdge3: function(which) {
	var container, offset;
	if (this._rangeType === "DOM") {
		container = this._nativeRange[which === "start" ? "startContainer":"endContainer"];
		offset = this._nativeRange[which === "start" ? "startOffset":"endOffset"];
	}
	else {
		var rangeEdge = this._nativeRange.duplicate();
		rangeEdge.collapse(which === "start");
		var parent = rangeEdge.parentElement();
		var candidates = parent.childNodes;
		container = candidates[candidates.length - 1];
		
		var rangeTest = SimpleRange.createNativeRange(parent);
		rangeTest.collapse(true);
		for (var i=1, len=candidates.length; i < len; i++) {
			if (candidates[i].nodeType === 1) {
				rangeTest.move("character", candidates[i].innerText);
			}
			else {
				rangeTest.move("character", candidates[i].nodeValue.length);
				var rel = rangeEdge.compareEndPoints("StartToStart", rangeTest);
				if (rel < 0) {
					container = candidates[i];
					break;
				}
			}
		}
		
		rangeTest.moveToElementText(container.previousSibling || container.parentNode);
		rangeTest.collapse(!container.previousSibling);
		rangeTest.setEndPoint("EndToStart", rangeEdge);
		offset = rangeTest.text.length;
	}
	return {
		container: container,
		offset: offset
	};
},

getEdge4: function(which) {
	var container, offset;
	if (this._rangeType === "DOM") {
		container = this._nativeRange[which === "start" ? "startContainer":"endContainer"];
		offset = this._nativeRange[which === "start" ? "startOffset":"endOffset"];
	}
	else {
		var rangeEdge = this._nativeRange.duplicate();
		rangeEdge.collapse(which === "start");
		var parent = rangeEdge.parentElement();
		var candidates = parent.childNodes;
		container = candidates[candidates.length - 1];
		
		var marker = document.createElement("a");
		parent.appendChild(marker);
		var rangeTest = document.body.createTextRange();
		for (var i=candidates.length - 1; i > -1; i--) {
			// if (candidates[i].nodeType !== 1) {
				var testNode = marker.previousSibling;
				parent.insertBefore(marker,testNode);
				rangeTest.moveToElementText(marker);
				var rel = rangeTest.compareEndPoints("StartToStart", rangeEdge);
				if (rel <= 0) {
					container = testNode;
					break;
				}
			// }
		}
		
		// rangeTest.moveToElementText(container.previousSibling || container.parentNode);
		// rangeTest.collapse(!container.previousSibling);
		rangeTest.setEndPoint("EndToStart", rangeEdge);
		offset = rangeTest.text.length;
		parent.removeChild(marker);
	}
	return {
		container: container,
		offset: offset
	};
},