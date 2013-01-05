var path = require('path'),
	fs = require('fs');

// http://phpjs.org/functions/stripslashes/
function stripslashes (str) {
  return (str + '').replace(/\\(.?)/g, function (s, n1) {
    switch (n1) {
    case '\\':
      return '\\';
    case '0':
      return '\u0000';
    case '':
      return '';
    default:
      return n1;
    }
  });
}

function fulfillRequirements(src, srcPath, dependencyManager, dependencyFinder){
	var dependencyMatch,
		dependencyPath,
		replaceQueue = [];
	
	src = src.toString();

	while(dependencyMatch = dependencyFinder.exec(src)){
		dependencyPath = stripslashes(dependencyMatch[1]);
		if(!dependencyPath) continue;

		dependencyPath = path.resolve(path.dirname(srcPath), dependencyPath);
		
		dependencyManager.add(srcPath, dependencyPath);
		
		replaceQueue.push([
			dependencyMatch[0],
			dependencyManager.getId(dependencyPath)
		]);
	}
	
	replaceQueue.forEach(function(replaceObj){
		src = src.replace(replaceObj[0], replaceObj[1]);
	});

	return src;
}

function readModule(path, dependencyManager, callback, options){
	options = options || {};
	var moduleVar = options.moduleVariableName || "module";
	var exportsVar = options.exportsVariableName || "exports";
	var requireFunc = options.requireFunctionName || "require";
	
	var header = "function(" + moduleVar + "," + exportsVar + "){" + moduleVar + "." + exportsVar + "=" + exportsVar + ";\n",
		footer = "\n;return " + moduleVar + "." + exportsVar + ";}({},{});",
		dependencyFinder = new RegExp(requireFunc + "\\([\'|\"](.*)[\'|\"]\\)","gi"),
		moduleId = dependencyManager.getId(path);

	fs.readFile(path, function(err, src){
		src = fulfillRequirements(src, path, dependencyManager, dependencyFinder);
		callback("var " + moduleId + "=" + header + src + footer);
	});
}

module.exports = readModule;