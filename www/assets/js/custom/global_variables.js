//vedno spremeni to vrednost zato da se po instalaciji prepise cache in po potrebi baza
var version_code=12;
var VERSION="1.4.6";

//za deploy - ne izpisujejo se komentarji

var console = {};
console.log = function(){};

 
var server_url = 'http://www.visitljubljana.com/';
var develop = 0;
var populateDB = 0; 
	
//settings
var SETTINGS_FILE           = "settings.js"
var SETTINGS_FOLDER     	= "Android/data/com.innovatif.visitljubljana/";
var ASSETS_FOLDER     		= "/android_asset/www/";

//grupe za cache
var EVENT_GROUP 			= 0;
var INFO_GROUP 				= 1;
var TOUR_GROUP				= 2;
var POI_GROUP				= 3;
var VOICE_GROUP				= 4;
var EVENTS_FILTERED_GROUP	= 5;
var TOUR_LIST_GROUP			= 6;
var INSPIRED_GROUP			= 7;
var POIGROUP_GROUP			= 8;
var SUB_EVENTS_GROUP		= 9;
var INFO_POI_GROUP			= 10;
var POI_ZAMENITOSTI_GROUP	= 217;
var POI_KULINARIKA_GROUP	= 219;
var POI_NASTANITVE_GROUP	= 215;
var POI_NAKUPOVANJE_GROUP	= 220;
var POI_ZABAVA_GROUP		= 222;

var UNUSED_GROUPS 		= ["218","221","224","225","227"];
var USED_POI_GROUPS 	= "215,217,219,220,222";

var POI_ZAMENITOSTI_POI_GROUPS 	= ["34268","15780","15860","15863","15874","15774","15781","15861","15782"];
var POI_KULINARIKA_POI_GROUPS 	= ["15906","15907","15818","15919","43996","43995"];
var POI_ZABAVA_POI_GROUPS 		= ["15927","39095","15931","16756","15782","44001","15815"];
var POI_NAKUPOVANJE_POI_GROUPS 	= ["159212","15969","15848","43997","15922"];
var POI_NASTANITVE_CATEGORY 	= ["366","369","398","401","431","438","456"];
                            	   
//poigroups 13013, 15250, 15269, 15270, 15273, 15274, 15275, 15276, 15277, 15280, 15281, 15282, 15283, 15310, 15284, 15285, 15286, 15298, 15299, 15300, 15301, 15304, 15307, 15308, 15309
var POI_GROUPS 		= [34268, 15780, 15860, 15863, 15874, 15774, 15781, 15861, 15782, 15906, 15907, 15818, 15919, 43996, 43995, 15927, 39095, 15931, 16756, 15782, 44001, 15815, 15921, 15969, 15848, 43997, 15922, 13013, 15250, 15269, 15270, 15273, 15274, 15275, 15276, 15277, 15280, 15281, 15282, 15283, 15310, 15284, 15285, 15286, 15298, 15299, 15300, 15301, 15304, 15307, 15308, 15309];
//nastanitve 366, 369, 398, 401, 431, 438, 456, 496, 497
//tic je 496, 497
var NASTANITEV_TIC_CATS = [366, 369, 398, 401, 431, 438, 456, 496, 497];

//ztl grupe -- my_visit sinhronizacija
var ZTL_EVENT_GROUP = 1;
var ZTL_TOUR_GROUP 	= 10031;
var ZTL_POI_GROUP 	= 10027;

var UPDATE_GROUPS	= 6;

var APP_NAME = "Visit Ljubljana and more";

//gps
var watchID 	= null;
var source  	= null;
var dest    	= null;
var correctionX = 4999750;
var correctionY = 5000550;
var minDistance = 10;
var pOld 		= null;


//media player
var media		 = "";
var my_media 	 = null;
var media_timer  = null;
var media_length = 0;
var file 		 = ASSETS_FOLDER+"uploads/mp3/";
var file_alt 	 = SETTINGS_FOLDER+"audio/"; //lokacija na SD kartici
var file_uploads = "./uploads/images/"; //lokacija slik v instalaciji - tabela ztl_poi se updejta prvem zagonu

//cssless css
var window_width = $(window).width();
/*
var img_width   = window_width*0.35;
var img_height  = ((window_width*14)/17)*0.35;
var ztl_content_width = window_width - img_width;
*/

//db
var db = null;

//settings
var settings			= new Object();
var template_root 		= 'templates/';
var template_lang 		= 'si/';

var tmp_history = ["fun--load_main_screen--empty"];


//text dolzina max
var max_dolzina_kategorija	= 15;
var max_dolzina_naslov 		= 25;
var max_dolzina_poi_title 	= 30;
var max_dolzina_title 		= 28;
var max_dolzina_title_info 	= 100;
var max_dolzina_my_visit_tour_title = 25;
var max_dolzina_short_desc 	= 75;
var max_dolzina_long_desc 	= 100;


//regija
//14.106,45.793 x 15.054,46.269  - staro
//14.01,45.761 x 15.139,46.328
var lon0 = 14.11; 
var lat0 = 45.783; 
var lon1 = 15.04;
var lat1 = 46.428;
/* ljubljana
var lon0 = 14.434;
var lat0 = 46;
var lon1 = 14.587;
var lat1 = 46.1;*/
var x0 = 456516;
var y0 = 95835;
var x1 = 467838;
var y1 = 104993;

//centar ljubljane
var lat=46.052327;
var lon=14.506416;
var zoom=13;

//korekcije projekcij
var correctionX = 4999650;
var correctionY = 5000450;
var myLocationCorrectionX = -100;
var myLocationCorrectionY = -50;

//notification refresh time in seconds
var notification_refresh_time = 60;

//analytics
var UA_android = "UA-4832430-3";
var UA_ios     = "UA-4832430-4";

//device
var is_android = "android";

//iOS overrides
function reinit() {
	if (device.platform == "iOS") {
        is_android              = ""; //za mustache
		SETTINGS_FOLDER     	= "com.innovatif.visitljubljana/";
		ASSETS_FOLDER     		= "/";
		
		file 		 			= ASSETS_FOLDER+"uploads/mp3/";
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemInit, null);
	}
}

function onFileSystemInit(fileSystem) {
    fileSystem.root.getDirectory(SETTINGS_FOLDER+"audio", {create:false}, gotDirInit, null);
}

function gotDirInit(d) {
    file_alt = d.fullPath+"/"; //audio guid dl dir
    console.log("***audio dl dir "+file_alt);
}