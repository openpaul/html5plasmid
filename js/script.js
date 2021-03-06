/*


  Settings


*/

fcolors = {
			'standart'     : '#0073BA',
			'standartHighlight'     : '#0A7500',
			'misc_feature' : '#DA0E3F',
			'terminator'   : '#0F1B21',
			'CDS'          : '#00689C',
			'promoter'     : '#42A600',
			'rep_origin'   : '#581B87',
			'protein_bind' : '#0EC6DA',
			'gene'         : '#DABB0E'
};




/////////////////////////////////////////////////////////////////
// enables fileupload
document.getElementById('fileinput').addEventListener('change', startRead, false);



// hanlder for the fileAPI
function startRead() {  
	// obtain input element through DOM 

	var file = document.getElementById('fileinput').files[0];
	if(file){
		getAsText(file);
	}
	var filename = file.name;
	console.log("We try opening this file:" + filename);
	$('#title').html(filename);
}


// handels the .txt or .gb File
function getAsText(readFile) { 
  var reader = new FileReader();
  
  // Read file into memory as UTF-8     
  reader.readAsText(readFile, "UTF-8");
  
  // Handle progress, success, and errors
  //reader.onprogress = updateProgress;
  reader.onload = loaded;
  reader.onerror = errorHandler;
}

/*
function updateProgress(evt) {
  if (evt.lengthComputable) {
    // evt.loaded and evt.total are ProgressEvent properties
    var loaded = (evt.loaded / evt.total);
    if (loaded < 1) {
      // Increase the prog bar length
      // style.width = (loaded * 200) + "px";
    }
  }
}*/


// this function actually renders the txt file
function loaded(evt) { 

	// Obtain the read file data    
	var fileString = evt.target.result;

	//replace more than one whitespace with just one white space, cause we use the " " as delimiter
	// split string into the lines
	var filearray=fileString.split(/\r\n|\r|\n/g);
	
	var origin      = false;   // at first read features and stuff
	var featurelist = Array(); // one array to rule them all

	// hanlde every line individually
	var length = filearray.length,
		line   = null;
	for (var i = 0; i < length; i++) {
		// this is the line as a string
		line = filearray[i];

		// if the origin mode is on, the rest of the file is DNA, so we can ignore every other action!
		if(origin == true){
			// add the DA-Sqeuenze but remove whitespace and numbers
			origincode = origincode + line.replace(/\s+/g,'').replace(/\d+/g,'').replace(/\/+/,'');
		}else if(line.search("ORIGIN") != -1){
			origin     = true;  // switch into the originMode
			origincode = "";    // crete empty string to save the DNA-Sequence
			//console.log(line);
		}else if(line.search(/\S+\s+\d+\..\d+/) != -1 || line.search(/\S+\d+\..\d+/) != -1){		
			// This is the Featurehandler!!!
			// its very important!!!
			// Exclude lines with / or " from beeing detected as a feature
			if(line.search(/["\/]+/) == -1 && line.search("source") == -1 ){
				//find the type of the feature and from where to where it goes
				//TRIM THE STRING
				feature     = line.replace(/\s+/g,' ').trim();
				featurepart = feature.split(" ");
				fName       = featurepart[0]; //that should be the name of the feature
				//now check the location. ignore the complimanrtary feature first
				var re      = /\d+/g;				
				startar     = re.exec(featurepart[1]);
				stopar      = re.exec(featurepart[1]);
				start       = parseInt(startar[0]);
				stop        = parseInt(stopar[0]);

				if(stop > start){
					fLength  = stop - start;				
				}else{
					fLength  = "recalc"; //needs to be recalculated, as soon as we know how long the whole plasmid is!
				}

				// check if it is a complementary feature
				if(line.search(/complement/) != -1){
					complement = "true";
				}else{
					complement = "false";				
				}	
				//console.log(complement + line);
				// here we have to improve it a bit in the feature!!!
				
				//store the information in a new array:
				temparray = {"type"       : fName,
							 "start"      : start,
							 "stop"       : stop,
							 "fLength"    : fLength,
							 "complement" : complement}
				featurelist.push(temparray);				
				temparray = null; // make a new array possible

			}
		//  check if this is a featuremode
		}else if(line.search("\label") != -1 && featurelist.length){
			if(line.search(/\"\S+\"/) != -1){
				// this label has ""
				//console.log(line);
				var re      = /\"\S+\"/g;				
				labelar       = re.exec(line);
				label       = labelar[0].substr(1,labelar[0].length - 2);
			}else{
				// without ""
				labelparts = line.split("=");
				label      = labelparts[1];
			}
			console.log("LABEL: " + label);
			featurelist[featurelist.length-1]["label"] = label;
		
		//  else check is its one of the standart elements as title and so
		}else if(line.search("LOCUS") != -1){
			locus = line.replace(/\s+/g,' ').replace("LOCUS", '').trim();
			//console.log("LOCUS: " + locus);
			
		}else if(line.search("DEFINITION") != -1){
			definitition = line.replace(/\s+/g,' ').replace("DEFINITION", '').trim();
			//console.log("DEFINITION: " + definitition)
		}else{
			//console.log("Either there is nothing in this line or I do not know what it means!");
			//console.log("I'm talking about this:");
			//console.log(line);
		}

	}

	origincode = origincode.toUpperCase();
	console.log("Length of the DNA: " + origincode.length);
	$('#dnaseq').html(origincode);
	$('#dnaseqinter').html(origincode);


	//reorganize feature by size!!
	// create arrray with : array(){length: key}
	var sortarray = {}; // {} will create an object
	for (f in featurelist){
		//add svg-id!! So it wont mess our whole thing up
		featurelist[f]["svgid"] = "featurenr" + f;
		fLength = featurelist[f]["fLength"];
		if(fLength == "recalc"){
			start = featurelist[f]["start"];
			stop  = featurelist[f]["stop"];
			fLength = stop + origincode.length - start;
			featurelist[f]["fLength"] = fLength;
			console.log(fLength +"rec" + start + " + "+origincode.length +" -"+stop);
		}
		sortarray[fLength] = f;
	}
	sortetfeaturelist = new Array();
	for(i in sortarray){
		sortetfeaturelist.push(featurelist[sortarray[i]]);
		console.log(i + ": "+  sortarray[i]);
	}
	sortetfeaturelist.reverse();


	

//var myarray=[25, 8, 7, 41]
//myarray.sort(function(a,b){return a - b}) //Array now becomes [7, 8, 25, 41]
  
//print all freatures:



drawDNA(origincode.length, sortetfeaturelist);
printFeatureList(featurelist);

addRestrict(origincode);
}




function errorHandler(evt) {
  if(evt.target.error.name == "NotReadableError") {
    // The file could not be read
  }
}

function printFeatureList(featurelist){
	$('#featurelist').html("");
	for(f in featurelist){
		type    = featurelist[f]["type"];
		label   = featurelist[f]["label"];
		start   = featurelist[f]["start"];
		stop    = featurelist[f]["stop"];
		length  = featurelist[f]["fLength"];
		svgid   = featurelist[f]["svgid"];
		// get the color:
		if ($.inArray(featurelist[f]["type"],fcolors)){
			fcolor = fcolors[featurelist[f]["type"]];
		}else{
			fcolor = fcolors["standart"];
		}

		$('#featurelist').append('<div class="feature" data-color="'+ fcolor +'" data-type="'+ type +'" data-svg="'+ svgid +'" data-start="'+start+'" data-stop="'+stop+'"><h3><strong>' + label + '</strong> <span class="frange">('+start+'-'+stop+')</span></h3><div class="featureplus">type:   '+ type +'<br />start:   '+start+'<br />stop:   '+stop+'<br />length: ' + length + 'bp</div></div>');
		
	}
}

function drawDNA(length, featurelist){
	$('#canvas').empty().removeClass("hasSVG");    
	$('#canvas').svg({onLoad: drawInitial});

	var svg = $('#canvas').svg('get');
	drawFeatures(svg, length, featurelist);
}



function drawInitial(svg) {
	svg.circle(350, 350, 150, {fill: 'none', stroke: '#cecece', 'stroke-width': 3});
	//var g = svg.group({stroke: 'black', 'stroke-width': 2});
	//svg.line(g, 15, 75, 135, 75);
	//svg.line(g, 75, 15, 75, 135);
	//svg.text(null, 370, 260, 'Plasmid');
}

function drawFeatures(svg, length, featurelist){
	radius      = 150;
	radiusc     = 150;
	extraradius = 15;

	groups = new Array();
	var featuregroup = svg.group("featuregroup");
		var text = svg.text('',{fontFamily: 'Verdana, Helvetica, san-serif',fontSize: '12', fill: 'black',dy: -10}); 


	//first caluclate the x,y from the polar coordinates
	for (f in featurelist){
		if(featurelist[f]["complement"] == "true"){
			radiusc   = radiusc - extraradius;
			radiususe = radiusc;
		}else{
			radius = radius + extraradius;
			radiususe = radius;
		}
		drawlong = false; //check if the long path should be drawn		
		if(featurelist[f]["fLength"]/length > 0.5){
			drawlong = true;		
		}
		label = featurelist[f]["label"];

		// get the color:
		if ($.inArray(featurelist[f]["type"],fcolors)){
			fcolor = fcolors[featurelist[f]["type"]];
		}else{
			fcolor = fcolors["standart"];
		}

		//make a group
		groups.push(svg.group(featuregroup,"undergroup" + f)); // can be used like this: groups[groups.length-1]

		acoord = polarToCartesian(350,350,radiususe,featurelist[f]["start"]*360/length);
		bcoord = polarToCartesian(350,350,radiususe,featurelist[f]["stop"]*360/length);

		asmallcoord = polarToCartesian(350,350,150,featurelist[f]["start"]*360/length);
		bsmallcoord = polarToCartesian(350,350,150,featurelist[f]["stop"]*360/length);

		//console.log(acoord[0] +  " " + acoord[1] + "-" + featurelist[f]["stop"]);
		var path = svg.createPath(); 
		svg.path(groups[groups.length-1], path.move(acoord[0], acoord[1]).arc(radiususe,radiususe, 0, drawlong, true, bcoord[0], bcoord[1]),{fill: 'none', stroke: fcolor, strokeWidth: 10,id: featurelist[f]["svgid"]});
	

	var pathe = svg.createPath(); 
		svg.path(groups[groups.length-1], pathe.move(asmallcoord[0], asmallcoord[1]).arc(150,150, 0, drawlong, true, bsmallcoord[0], bsmallcoord[1]),{fill: 'none', stroke: 'transparent', strokeWidth: 6,id: "small" + featurelist[f]["svgid"]});

	// just add text if there is some space
	if(Math.abs(featurelist[f]["stop"]*360/length - featurelist[f]["start"]*360/length) > 10){
		console.log();
		var texts = svg.createText(); 
		svg.textpath(text, "#"+featurelist[f]["svgid"], texts.string(label)); 
		}
	}

}


function random(range) {
	return Math.floor(Math.random() * range);
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = angleInDegrees * Math.PI / 180.0;
  var x = centerX + radius * Math.cos(angleInRadians-0.5* Math.PI);
  var y = centerY + radius * Math.sin(angleInRadians-0.5* Math.PI);
  return [x,y];
}


drawDNA(null, null);




/*interaktivity*/

$('#featurelist').on("mouseover",'.feature', function(){
	highlightdna($(this));
});

function highlightdna(element){
	//console.log("hover");
	code  = $('#dnaseq').html();
	$('#dnaseqinter').hide();
	start  = parseInt(element.attr("data-start"));
	stop   = parseInt(element.attr("data-stop"));
	svgid  = element.attr("data-svg");
	type   = element.attr("data-type");
	fcolor = element.attr("data-color");

	if(stop > start){
		before = code.substr(0,start-1);
		inside = code.substr(start-1,stop-start+1);
		after  = code.substr(stop);
		interactiveDNA = before + '<span class="dnahighlight" style="background-color: ' + fcolor +'">' + inside +'</span>' + after;
	}else{
		first   = code.substr(0,stop-1);
		outside = code.substr(stop-1,start-1);
		last    = code.substr(start+stop-2);
		interactiveDNA = '<span class="dnahighlight" style="background-color: ' + fcolor +'">' + first +'</span>'+  outside  + '<span class="dnahighlight" style="background-color: ' + fcolor +'">' + last + '</span>';
		console.log(last+first);
	}

	$('#dnaseqinter').html(interactiveDNA).show();
	$('#dnaseq').hide();
	$("path[id^=small]").attr("stroke","transparent");
	$('#small'+svgid).attr("stroke",fcolor);
}

$('#featurelist').on("click",'.feature', function(){
	highlightdna($(this));
	$('.featureplus').hide();
	$('.feature').removeClass('fSelected')
	$('.featureplus', this).show();
	$(this).addClass('fSelected');

});

$('#featurelist').on("mouseout",'.feature', function(){
	if($('.feature.fSelected').length > 0 ){
		highlightdna($('.feature.fSelected'));
	}else{
		$('#dnaseq').show();
		$('#dnaseqinter').hide();
	}

});


/*
         R = G or A
                                Y = C or T
                                M = A or C
                                K = G or T
                                S = G or C
                                W = A or T
                                B = not A (C or G or T)
                                D = not C (A or G or T)
                                H = not G (A or C or T)
                                V = not T (A or C or G)
                                N = A or C or G or T*/
// sonderbuchstaben NNN und so werden nicht behandelt! --> regex
function addRestrict(text){
	
	//get width of a character
	cwidth = $('#fontwidth-helper').css("width");
	ccount = $('#fontwidth-helper').attr("data-length");
	charwidth = Math.floor(parseInt(cwidth)/parseInt(ccount));

	//calc the amount of chars in a row:
	rwidth    = $('#dnaseq').css("width");
	charcount = Math.floor(parseInt(rwidth)/parseInt(charwidth));
	
	console.log("Char per row: " + charcount);


	//now search for the places to cut

	var found = {}; // array to save the found
	//rec      = /TTAA/;
	/*if(text.search(rec) != -1){
			found["TTAA"] = "TTAA";
			console.log("TTAAAAS");
	}*/
	//console.log(rebase.BamHI);
	$.each(rebase, function(i, item) {
		rec = new RegExp(item.regex, 'gi');
		//console.log(item);
		found[item] = item;
		/*if(text.search(new RegExp(rec)) != -1){
			found[item.recognition] = item;
		}*/
	
		//console.log(item);
	 	var match;
		while((match = rec.exec(text))) {

			charperwor = charcount;
			rowhight = 25; //px
			rwosdown = Math.floor(match.index/charcount);
	
			
			//append span
			csstop = 18 + (rwosdown-1) *25;
			cssleft = charwidth * (match.index - Math.floor(match.index/charcount) * charcount);
			$('#dnarestriction').append('<span data-restriction="'+item.enzname+'" style="top: '+csstop+'px; left: '+cssleft+'px; display: none" class="restenz restrictionsite'+item.enzname+'">'+item.enzname+'</span>');
			console.log(item.enzname);
			//console.log(match.index);
			console.log("Left:");
			console.log((match.index - Math.floor(match.index/charcount) * charcount));

		}

		//either way append an field to the select box
		
		$('#restrictionselector').append('<input id="rest'+item.enzname+'" type="checkbox" name="'+item.enzname+'" class="restcheckbox" value="'+item.enzname+'" /><label for="rest'+item.enzname+'" class="restrictionlabel">'+item.enzname+'</label>')

	});





	//console.log("Found:" + found["GCAGT"]);
	for(enz in found){
		//console.log(enz  + found[enz]);
	}
}


// restrictionenzyme:
$('#restrictionselector').on("change",'.restcheckbox', function(){
	restname = $(this).attr("value");
	//console.log("change" + restname);
	if( $(this).is(':checked')){
		$('span.restrictionsite'+restname).show();
		console.log("Show:" + restname);
	}else{
		$('span.restrictionsite'+restname).hide();
		console.log("Hide:" + restname);
	}

});




function searchStringInArray (str, strArray) {
    for (var j=0; j<strArray.length; j++) {
        if (strArray[j].match(str)) return j;
    }
    return -1;
}







  function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0]; 

    if (f) {
      var r = new FileReader();
      r.onload = function(e) { 
	      var contents = e.target.result;
        console.log( "Got the file.n" 
              +"name: " + f.name + "n"
              +"type: " + f.type + "n"
              +"size: " + f.size + " bytesn"
              + "starts with: " + contents.substr(1, contents.indexOf("n"))
        ); 

				


		console.log("");

		console.log("Der File:");
		console.log(contents);
		 
      }
      r.readAsText(f);
    } else { 
      alert("Failed to load file");
    }
  }
