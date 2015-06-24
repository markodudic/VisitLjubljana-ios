function init_gps() {
    //WGS84
	  Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    //GK
    Proj4js.defs["EPSG:31469"] = "+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=5500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs";

    //timeout pomeni kolk casa caka na novo pozicijo, enableHighAccuracy ali naj uporabi gps ali samo wifi
    var options = { timeout: 10000, enableHighAccuracy: true };
    navigator.geolocation.getCurrentPosition(onSuccess_gps, onError_gps);
    watchID = navigator.geolocation.watchPosition(onSuccess_gps, onError_gps, options);
}

function stop_gps() {
	navigator.geolocation.clearWatch(watchID);
}

function onError_gps(error) {
	console.log("error");
}



function onSuccess_gps(position) {
	if (position==undefined) return;
    source = new Proj4js.Proj('EPSG:4326');	//WGS84
    dest = new Proj4js.Proj('EPSG:31469');	//GK

    var p = new Proj4js.Point(position.coords.longitude, position.coords.latitude); 
    Proj4js.transform(source, dest, p); 
    
    //current location
    current_position_xy = new Array(p.x, p.y);
    
	//gremo crez vse elemente na pregledu, ki imajo kooridinate
    if ((Math.abs(p.x - pOld.x) > minDistance) || (Math.abs(p.y - pOld.y) > minDistance)) {
    	$('input[name^="ztl_cord_"]').each(function( index ) {
	   	   pOld = p;
		   var geo_stuff = $(this).val().split("#");
		   var px=p.x-correctionX;
	       var py=p.y-correctionY;
	       if (geo_stuff[1] != "0" && geo_stuff[2] != "0" && 
	    	   geo_stuff[1] != "" && geo_stuff[2] != "" && 
	    	   geo_stuff[1] != undefined  && geo_stuff[2] != undefined) {
	    	   $("div.ztl_img_distance_container").show();
	    	   var dist = lineDistance(px, py, geo_stuff[1], geo_stuff[2]);
	    	   if (dist >= 1) {
	    		   $("div#ztl_distance_value_"+geo_stuff[0]).html(dist+" km");
	    	   } else {
	    		   $("div#ztl_distance_value_"+geo_stuff[0]).html(dist*1000+" m");	    		   
	    	   }
	       } else {
   	   			$("div#map_button").attr('class','ztl_grey_button ztl_grey_button_map ztl_item_left_button');
   	   			$("div#map_button").removeAttr('onclick');
   	   			$("div.ztl_img_distance_container").hide();
	       }
	       
	       /*var bbox = (geo_stuff[1] > x0) && (geo_stuff[1] < x1) && (geo_stuff[2] > y0) && (geo_stuff[2] < y1);
	       if (bbox) {
	    	   $("div#map_button").attr('class','ztl_red_button ztl_item_left_button');;
	       } else {
	    	   $("div#map_button").attr('class','ztl_grey_button ztl_grey_button_map ztl_item_left_button');
	    	   $("div#map_button").removeAttr('onclick');
	       }*/
	   	}); 
    }
}

function lineDistance( p1x, p1y, p2x, p2y ) {
       var xs = p2x - p1x;
       xs = xs * xs;
       var ys = p2y - p1y;
       ys = ys * ys;
       //return Math.round( (Math.floor(Math.sqrt( xs + ys )/1000)) * 10 ) / 10;
       var num = Math.sqrt( xs + ys )/1000;
       //num = Math.round(num*Math.pow(10,1))/Math.pow(10,1);
       if (num >= 1)
               return num.toFixed(1);
       else
               return num.toFixed(3);
}

function lineDistanceAll( p1x, p1y, p2x, p2y ) {
    var xs = p2x - p1x;
    xs = xs * xs;
    var ys = p2y - p1y;
    ys = ys * ys;
    //return Math.round( (Math.floor(Math.sqrt( xs + ys )/1000)) * 10 ) / 10;
    return Math.sqrt( xs + ys )/1000;
}