function bindEvent(obj,events,fn){
	if(obj.addEventListener){
		obj.addEventListener(events,fn,false);
	}
	else{
		/*obj.attachEvent('on'+events,function(){
			fn.call(obj);
		});*/
		
		obj[events] = obj[events] || [];
		
		obj[events].push(fn);
		
		
		if(!obj.first){
			obj.first = obj.attachEvent('on'+events,function(){
				for(var i=0;i<obj[events].length;i++){
					obj[events][i].call(obj);
				}							 
												 
			});
		}
		

	}
}

function getByClass(oParent,sClass){
	var result = [];
	var aEle = oParent.getElementsByTagName('*');
	var re = new RegExp('\\b'+sClass+'\\b','i');
	for(var i=0;i<aEle.length;i++){
		if(re.test(aEle[i].className)){
			result.push(aEle[i]);
		}
	}
	
	return result;
}

function getStyle(obj,attr){
	if(obj.currentStyle){
		return obj.currentStyle[attr];
	}
	else{
		return getComputedStyle(obj,false)[attr];
	}
}

Array.prototype.addArr = function(arr){
	
	for(var i=0;i<arr.length;i++){
		this.push(arr[i]);
	}
	
	return this;
};


function xQuery(vArg){
	
	this.elements = [];
	
	switch(typeof vArg){
		case 'function':
			bindEvent(window,'load',vArg);
			break;
		case 'string':
			switch(vArg.charAt(0)){
				case '#':   //ID
					this.elements.push(document.getElementById(vArg.substring(1)));
					break;
				case '.':   //class
					this.elements = getByClass(document,vArg.substring(1));
					break;
				default:    //tagName
					this.elements = document.getElementsByTagName(vArg);
					break;
			}
			break;
		case 'object':
			this.elements.push(vArg);
			break;
	}
	
}

xQuery.prototype.bind = function(events,fn){
	for(var i=0;i<this.elements.length;i++){
		bindEvent(this.elements[i],events,fn);
	}
};

xQuery.prototype.click = function(fn){
	
	this.bind('click',fn);
	
};

xQuery.prototype.show = function(){
	for(var i=0;i<this.elements.length;i++){
		this.elements[i].style.display = 'block';
	}	
};

xQuery.prototype.hide = function(){
	for(var i=0;i<this.elements.length;i++){
		this.elements[i].style.display = 'none';
	}	
};

xQuery.prototype.hover = function(fnOver,fnOut){
	
	this.bind('mouseover',fnOver);
	this.bind('mouseout',fnOut);
	
};

xQuery.prototype.css = function(attr,value){
	
	if(arguments.length==2){
		
		for(var i=0;i<this.elements.length;i++){
			this.elements[i].style[attr] = value;
		}
	}
	else{
		return getStyle(this.elements[0],attr);
	}
	
};

xQuery.prototype.attr = function(attr,value){
	
	if(attr == 'class'){
		attr = 'className';
	}
	
	if(arguments.length==2){
		for(var i=0;i<this.elements.length;i++){
			this.elements[i][attr] = value;
		}
	}
	else{
		return this.elements[0][attr];	
	}
};

xQuery.prototype.toggle = function(){
	
	var _arguments = arguments;
	
	for(var i=0;i<this.elements.length;i++){
		addToggle(this.elements[i]);
	}
	
	function addToggle(obj){
		var count = 0;
		
		bindEvent(obj,'click',function(){
			
			_arguments[count%_arguments.length].call(obj);
			
			count++;
			
		});
		
	}
	
};

xQuery.prototype.eq = function(index){
	
	return $(this.elements[index]);
	
};

xQuery.prototype.index = function(){
	
	var borther = this.elements[0].parentNode.children;
	
	for(var i=0;i<borther.length;i++){
		if(borther[i]==this.elements[0]){
			return i;
		}
	}
	
};

xQuery.prototype.find = function(vArg){
	
	var result = [];
	var newResult = $();
	
	for(var i=0;i<this.elements.length;i++){
		
		switch(vArg.charAt(0)){
			case '.':  //class
				var aEle = getByClass(this.elements[i],vArg.substring(1));
				
				result.addArr(aEle);
				
				break;
			default:   //tagName
			
				var aEle = this.elements[i].getElementsByTagName(vArg);
				
				result.addArr(aEle);
				
				break;
		}
		
	}
	
	newResult.elements = result;
	
	return newResult;
};

function $(vArg){
	return new xQuery(vArg);
}