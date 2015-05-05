/**
 * 
 */

var PieChartDisplay=new Class({
	Implements:Events,
	initialize:function(element,data,options){
		var me=this;
		me.options=Object.merge({},{
			
			classNamePrefix:'PieChart_',
			title:"Pie Chart",
			chartTemplate:PieChartDisplay.DefaultChartTemplate,
			pieceTemplate:PieChartDisplay.DefaultPieceTemplate,
			radius:80,
			inset:8,
			padding:80,
			startAngle:(-Math.PI/2),
			clockwise:true,
			dotIcon:"https://geolive.ca/administrator/components/com_mediamapserver/Viewer/js/Controls/images/dot_pink.png",
			sliceColors:[function(data){
				var me=this;
				return "rgba("+Math.round((256*(me.data.indexOf(data)/me.data.length)))+",16,16,0.4)";
				
				
			}]
			
			
			
			
		},options);
		if(me.options.onAddedBar){
			me.addEvent('onAddedPiece',me.options.onAddedBar);
		}
		me.data=[];
		me.element=element;
		me.options.chartTemplate.bind(me)(element);
		//me.options.titleTemplate.bind(me)(me.options.title);
		me.totalValue=0;
		me.cache={}; //for coordinates...
		me.currentAngle=me.options.startAngle;
		if(data&&data.length){
			Object.each(data,function(d){
				me.totalValue+=d.value;
				me.data.push(d);
			});
	
			Object.each(data,function(d){me.addPiece(d);});
			
		}
		me.isLoaded=true;
		
		
	},
	addPiece:function(d){
		var me=this;
		me.options.pieceTemplate.bind(me)(d);
	},
	getRadius:function(){
		var me=this;
		return me.options.radius;
	},
	getPadding:function(){
		var me=this; 
		return me.options.padding;
	},
	getCenter:function(){
		var me=this;
		var p=me.getPadding();
		var r=me.getRadius();
		return {x:(p+r),y:(p+r)};
	},
	getStartAngle:function(){
		var me=this;
		return me.options.startAngle;
	},
	getClockwise:function(){
		var me=this;
		return me.options.clockwise;	
	},
	getInsetRadius:function(){
		var me=this;
		return me.getRadius()-(me.options.inset);
	},
	getXYFromCenter:function(rad, opts){
		var me=this;
		var config=Object.merge({},{
			center:me.getCenter(),
			radius:me.getRadius(),
			scale:{x:1,y:1}
		},opts);
		
		return {x:config.center.x+config.radius*config.scale.x*Math.cos(rad),y:config.center.y+config.radius*config.scale.y*Math.sin(rad)};
	},
	getItemCenterR:function(index){
		var me=this;
		if(!me.isCached(index))return null; //item is empty has no position.
		var cache=me.cache[index];	
		return (cache.start+cache.end)/2;
	},
	isCached:function(index){
		var me=this;
		if(!me.cache[index])return false;
		return true;
	},
	getTextPosition:function(index){
		var me=this;
	
		if(!me.isCached(index))return null; //item is empty has no position.
		return me.getXYFromCenter(me.getItemCenterR(index), {radius:me.getRadius()+15, scale:{x:1,y:1.2}});
		
	},
	getItemArcLength:function(data){
		//assume totalValue 
		var me=this;
		return 2*Math.PI*data.value/me.totalValue;	
	}	
});

PieChartDisplay.DefaultChartTemplate=function(element){
	
	var me=this;
	var radius=me.getRadius();
	var padding=me.getPadding();
	var length=2*radius+2*padding; 
	var center=me.getCenter();
	var startAngle=me.getStartAngle();
	var canvas=new Element('canvas',{width:length, height:length});
	canvas.innerHTML="<p>your browser sucks.</p>";
	element.appendChild(canvas);
	var context = canvas.getContext('2d');
	context.strokeStyle = "#000000";
	context.beginPath();
	context.arc(center.x,center.y,radius,0,Math.PI*2);
	
	context.closePath();
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowBlur = 6;
	context.shadowColor = "#555555";
	var grd = context.createLinearGradient(0, 0, 0, length);
	grd.addColorStop(0, "white"); // light blue
    grd.addColorStop(1, "lightGray"); // dark blue
    context.fillStyle = grd;
	
    context.stroke();
	context.fill();
	
	me.context=context;
	
	

	
	
};




PieChartDisplay.DefaultPieceTemplate=function(data){
	var me=this;
	if(data.value==0)return; //skip if empty.
	
	var center=me.getCenter();
	var arcLength=me.getItemArcLength(data);
	var cache={arcLength:arcLength,start:me.currentAngle,end:me.currentAngle+(me.getClockwise()?arcLength:-arcLength)};
	me.cache[me.data.indexOf(data)]=cache;
	
	var color=me.options.sliceColors[me.data.indexOf(data)%me.options.sliceColors.length];
	if(typeOf(color)=='function')color=color.bind(me)(data);
	
	var context=me.context;
	context.beginPath();  
	context.arc(center.x,center.y,me.getInsetRadius(),cache.start, cache.end,!me.getClockwise());
	context.lineTo(center.x,center.y);
	context.stroke();
	context.closePath();
	context.fillStyle = color;
	context.fill();
	
	var net=new Element('div',{'class':me.options.classNamePrefix+'DetailsWrap'});
	
	var dot=new Asset.image(me.options.dotIcon,{'class':me.options.classNamePrefix+'dot',onload:function(){
		var i=this;
		dot.setStyle('left',(middle.x-(i.width/2))+"px");
		dot.setStyle('top',(middle.y-(i.height/2))+"px");
		net.appendChild(dot);
		me.element.setStyle('position','relative');
		
	}});
	dot.setStyle('position',"absolute");
	var textPos=me.getTextPosition(me.data.indexOf(data));
	var label=new Element('div',{'class':me.options.classNamePrefix+'label '+me.options.classNamePrefix+'label_'+(textPos.x>=center.x?'right':'left')});
	
	
	var txt=new Element('div');
	txt.innerHTML=(data.title||("Item "+me.data.indexOf(data)))+": <b>"+(Math.round((data.value/me.totalValue)*1000)/10)+"%</b>";
	label.appendChild(txt);
	label.setStyle('position',"absolute");
	label.setStyle('left',(textPos.x)+"px");
	label.setStyle('top',(textPos.y)+"px");
	label.setStyle('width',0);
	label.setStyle('height',0);
	label.setStyle('top',(textPos.y)+"px");
	txt.setStyle('position',"absolute");
	txt.setStyle((textPos.x>=center.x?'left':'right'),0);
	txt.setStyle('top','-5px');
	net.appendChild(label);

	me.element.appendChild(net);
	var middle=me.getXYFromCenter(me.getItemCenterR(me.data.indexOf(data)),{radius:me.getInsetRadius()-15});
	
	/*
	context.beginPath();  
	
	context.arc(middle.x,middle.y,4,0,2*Math.PI);
	context.stroke();
	context.closePath();
	var grd = context.createLinearGradient(0, 0, 0, length);
	grd.addColorStop(0, "white"); // light blue
    grd.addColorStop(1, "lightGray"); // dark blue
    context.fillStyle = grd;
    
	context.fill();// */
	
	me.currentAngle=cache.end;
};

