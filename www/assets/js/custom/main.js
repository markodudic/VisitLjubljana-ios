//mobile-desktop version
var db_type	  	  = 1;
var settings_type = 1;
var local_db	  = 0;

//footer
var footer		  = "";

//filtri
var event_filter  = "";
var poi_filter_template  = "";

//festivali
var is_sub_event  = 0;
var sub_events_id = 0;
var sub_events_title = "";

//map_settings
var map_settings  = "";

//navigation
var current		  = 0;
var active_menu	  = 0;
var group 		  = 0;
var trips   	  = {}; //0-event, 1-info, 2-tour, 4 - voice, 5 - filtered events, 6 - tour list
var trips_title   = {}; //0-event, 1-info, 2-tour
var tours		  = {};  //toure po kategorijah. ID kategorije je key
var poigroups_map = {};  //poigroups. ID grupe je key
var selected_div  = null;
var main_menu     = null;
var swipe		  = 0;
var swipe_group	  = 0;
var swipe_dir 	  = "";
var backstep	  = 0;

//voice guide
var media_status  = 0;
var media_opened  = 0;
//var media_poi_id  = 0;
var voice_guide   = 0;

var my_visit_filter = 0;
var is_poi_filter = 0;
var is_event_filter = 0;

//history
var view_main_menu 	= 1;
var current_div		= "";
var curr_poigroup_id = 0;
var curr_info_id = 0;

//iscroll
var myScroll;

//skip update
var skip_update 	 = 0;
var menu_select_lang = 0;
var update_running 	 = 0;

//analytics
var gaPlugin;

var selected_group = -1;
var offsets = {};

//image sizes
var image_list_w	= 0;
var image_list_h	= 0;
var image_detail_w	= 0;
var image_detail_h	= 0;


document.addEventListener("deviceready", on_device_ready, false);

function on_device_ready() {
	//navigator.splashscreen.show();
	reinit();
	
	db 		= window.sqlitePlugin.openDatabase("Database_3", "1.0", "ztl", -1);
	pOld 	= new Proj4js.Point(0,0);
	
	load_settings();
	init_gps();
	
	skip_update = 0;

	//prvic napolnimo po izbiri jezika
	if (localStorage.getItem(localStorage.key('first_run')) != null) {
		//if (device.platform == "iOS") {
		//	reset_cache();
		//} else {
			get_cache();
		//}
	}

	poigroups_map[POI_ZAMENITOSTI_GROUP] 	= POI_ZAMENITOSTI_POI_GROUPS;
	poigroups_map[POI_KULINARIKA_GROUP] 	= POI_KULINARIKA_POI_GROUPS;
	poigroups_map[POI_ZABAVA_GROUP] 		= POI_ZABAVA_POI_GROUPS;
	poigroups_map[POI_NAKUPOVANJE_GROUP] 	= POI_NAKUPOVANJE_POI_GROUPS;
	poigroups_map[POI_NASTANITVE_GROUP] 	= POI_NASTANITVE_CATEGORY;
    
	document.addEventListener("backbutton", go_back, true);

	//skopiram bazo za backup
	if (develop==1) copyDB(); 
	
	//ponastavim history
	localStorage.setItem('history', JSON.stringify(tmp_history));
	
	//analytics
    gaPlugin = window.plugins.gaPlugin;
    if (device.platform == "iOS") {
    	gaPlugin.init(nativePluginResultHandler, nativePluginErrorHandler, UA_ios, 10);
	} else {
		gaPlugin.init(nativePluginResultHandler, nativePluginErrorHandler, UA_android, 10);
	}
    window.setInterval(set_my_visit_notification, 60000);
    
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
    
    image_list_w	= $(window).width() * 0.35;
    image_list_h	= $(window).width() * 0.35 * 14 / 17;
    image_detail_w	= $(window).width();
    image_detail_h	= $(window).width() * 0.55;
}

function onPause () {
	stop_gps();
}

function onResume () {
	init_gps();
}


function exit(){
	stop_gps();
	navigator.app.exitApp();
}

function nativePluginResultHandler (result) {
	console.log('nativePluginResultHandler: '+result);
}

function nativePluginErrorHandler (error) {
	console.log('nativePluginErrorHandler: '+error);
}

function copy_success(entry) {
    console.log("New Path: " + entry.fullPath);
}

function copy_fail(error) {
	console.log(error.code+":"+FileError.NOT_FOUND_ERR);
}

function copyDB() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
		fileSystem.root.getFile("/data/data/com.innovatif.visitljubljana/databases/Database_3.db", null, function(fileEntry) {
		    
		    var parent = "/mnt/sdcard/Android/data/com.innovatif.visitljubljana";
		    var parentName = parent.substring(parent.lastIndexOf('/')+1);
		    var parentEntry = new DirectoryEntry(parentName, parent);
		    
			fileEntry.copyTo(parentEntry, "Database_3.db", copy_success, copy_fail);
		}, copy_fail);
	} , null);
}
 

function reset_cache() {
	show_spinner();
	//spiner se noce prikazati ce ni zamika pred klicem funkcije za reset
	window.setTimeout(reset_cache_cont,500);
}

//preverjam ali so izvedene vse cache funkcije zato da sele po tem zapisem local storage in grem naprej
var CACHE_ITEMS = 12;
var cache_finished = 0;
var cache_check = 0;
function reset_cache_cont() {
	cache_finished = 0;
	cache_check = 1;
	
	load_main_menu(); 

	//pois
    load_pois(POI_ZAMENITOSTI_GROUP, 3, 0);
    load_pois(POI_KULINARIKA_GROUP, 4, 0);
    load_pois(POI_ZABAVA_GROUP, 8, 0);
    load_pois(POI_NAKUPOVANJE_GROUP, 9, 0);
	load_pois(POI_NASTANITVE_GROUP, 7, 0);	
	
    //ostali podatki
	load_poi_filter();
    load_events(0);
    load_info(0);
    load_tour_list(0);
    load_voice_guide(0);
    load_inspired(0);
    load_poigroup(0);
    
} 

function is_cache_finished() {
	if (cache_check == 0) return;
	
	console.log("CACHE FINISHED="+cache_finished);
	cache_finished++;
	//vsi cachei
	if (cache_finished == CACHE_ITEMS) {
		cache_check = 0;
	    set_cache();
		select_language_cont();
	}
}


function set_cache() {
	window.localStorage.removeItem('trips');
    window.localStorage.removeItem('trips_title');
    window.localStorage.removeItem('event_type');
    window.localStorage.removeItem('poi_filter');
    window.localStorage.clear();

    window.localStorage.setItem('trips', JSON.stringify(trips));
    window.localStorage.setItem('trips_title', JSON.stringify(trips_title));
    window.localStorage.setItem('event_type', JSON.stringify(event_type));
    window.localStorage.setItem('poi_filter', JSON.stringify(poi_filter));
    
}

function get_cache() { 
	/*console.log("VERSIONS="+window.localStorage.getItem('version')+":"+version_code);
	if ((window.localStorage.getItem('version') == null) || (parseInt(window.localStorage.getItem('version')) != version_code)) {
		console.log("NEW VERSION");
		window.localStorage.setItem('version', version_code);
		reset_cache();
	} else {*/
		if (window.localStorage.getItem('trips') == null) {
			reset_cache();
		} else {
			if (window.localStorage.getItem('trips') != null) {
				trips = JSON.parse(window.localStorage.getItem('trips'));
			}
			if (window.localStorage.getItem('trips_title') != null) {
				trips_title = JSON.parse(window.localStorage.getItem('trips_title'));
			}
			if (window.localStorage.getItem('event_type') != null) {
				event_type = JSON.parse(window.localStorage.getItem('event_type'));
			}
			if (window.localStorage.getItem('poi_filter') != null) {
				poi_filter = JSON.parse(window.localStorage.getItem('poi_filter'));
			}
		}
	//}
}


function load_main_screen(save_history) {
	//shrani v localhost
	if (save_history == 1) {
		var history_string = "fun--load_main_screen--empty";
		add_to_history(history_string);
	}

	swipe = 0;
	title_poi_filter = "";
	load_page(template_lang+'main_menu.html', 'main_menu', main_menu, 'fade', false, 0);
}

function swipe_right_handler() {
/*	if (swipe == 1) {
		if (db_type == 1) {
			var j = 0;
			if (trips != null) {
				if (selected_div == 'tour') {
					var res = trips[TOUR_LIST_GROUP].tours[selected_group];
				} else {
					var res = trips[selected_group];
				}

				for (i=0; i<res.items.length; i++) {
					if (res.items[i]['id'] == current) {
						j = i-1;
					}
				}
				
				if (j == -1) {
					j = res.items.length-1;
				}
				
				current = res.items[j]['id'];
				
				if (swipe_group == 1) {
					load_poi(res.items[j]['id'], 'fade', true, 1)
					swipe_dir = "right";
				} else if (swipe_group == 2) {
					swipe_dir = "right";
					load_event(res.items[j].id);
				} else if (swipe_group == 3) {
					swipe_dir = "right";
					load_tour(res.items[j].id);
				} else if (swipe_group == 4) {
					swipe_dir = "right";
					load_single_info(res.items[j].id);
				} else if (swipe_group == 5) {
					swipe_dir = "right";
					load_single_poigroup(res.items[j].id);
				}
			}
		}
	}*/
}

function swipe_left_handler() {
/*	if (swipe == 1) {
		if (db_type == 1) {
			var j = 0;
			if (selected_div == 'tour') {
				var res = trips[TOUR_LIST_GROUP].tours[selected_group];
			} else {
				var res = trips[selected_group];
			}
			
			for (i=0; i<res.items.length; i++) {
				if (res.items[i]['id'] == current) {
					j = i+1;
				}
			}
			
			if (j == res.items.length) {
				j = 0;
			}
			
			current = res.items[j]['id'];

			if (swipe_group == 1) {
				swipe_dir = "left";
				load_poi(res.items[j]['id'], 'fade', true, 1)
			} else if (swipe_group == 2) {
				swipe_dir = "left";
				load_event(res.items[j].id);
			} else if (swipe_group == 3) {
				swipe_dir = "left";
				load_tour(res.items[j].id);
			} else if (swipe_group == 4) {
				swipe_dir = "left";
				load_single_info(res.items[j].id);
			} else if (swipe_group == 5) {
				swipe_dir = "left";
				load_single_poigroup(res.items[j].id);
			}
		}
	}*/
}

function synhronization_prompt() {
	//preverim ce imam data connection
	if (navigator.network.connection.type == Connection.NONE) {
		navigator.notification.confirm(
				no_data_connection_desc_translation[settings.id_lang],
				load_main_screen,
		        synchronization_translation[settings.id_lang],
		        ok_translation[settings.id_lang]
		    );
	} else {
		//ce imam vprasam o syncu	
		navigator.notification.confirm(
				synhronization_desc_translation[settings.id_lang],
		        onConfirm,
		        synchronization_translation[settings.id_lang],
		        confirm_popup_translation[settings.id_lang]
		    );
	}
}

function onConfirm(buttonIndex) {
	if (buttonIndex == 2) {
		synhronize_all = 1;
		do_synhronization();
	} else {
		load_main_screen();
	}
}
 
function load_current_div(){
	console.log("CURR="+selected_div);
	if (selected_div == "events") {
		load_page(template_lang+'events.html', 'events', trips[EVENT_GROUP], 'fade', false, EVENT_GROUP);
	} else if (selected_div == "inspired") {
		load_page(template_lang+'inspired.html', 'inspired', trips[INSPIRED_GROUP], 'fade', false, INSPIRED_GROUP);
	} else if (selected_div == "infos") {
		load_page(template_lang+'infos.html', 'infos', trips[INFO_GROUP], 'fade', false, INFO_GROUP);
	} else if (selected_div == "poigroups") {
		load_page(template_lang+'poigroup.html', 'poigroup', trips[POIGROUP_GROUP], 'fade', false, POIGROUP_GROUP);
	} else if (selected_div == "tour_category") {
		load_page(template_lang+'tour_category.html', 'tour_category', trips[TOUR_LIST_GROUP], 'fade', false, TOUR_LIST_GROUP);
	} else if (selected_div == "ztl_synhronization") {
		load_current_settings();
	}	
}

function synhronization_force() {
	if (navigator.network.connection.type == Connection.NONE) {
		navigator.notification.confirm(
				no_data_connection_desc_translation[settings.id_lang],
				null,
		        synchronization_translation[settings.id_lang],
		        ok_translation[settings.id_lang]
		    );
	} else {
		navigator.notification.confirm(
				synhronization_desc_translation[settings.id_lang],
		        onConfirmForce,
		        synchronization_translation[settings.id_lang],
		        confirm_popup_translation[settings.id_lang]
		    );
	}
}

function onConfirmForce(buttonIndex) {
	if (buttonIndex == 2) {
		synhronize_all = 1;
		do_synhronization();
	}
}

function load_page(template, div, data, transition, reverse, id_group) {
	console.log("load page="+id_group+":"+div+":"+data+":"+voice_guide+":"+selected_div+":"+window.pageYOffset);
	if ((selected_div == "inspired") || 
		(selected_div == "trips") || 
		(selected_div == "main_menu") || 
		(selected_div == "events") || 
		(selected_div == "infos") || 
		(selected_div == "tour_category") || 
		(selected_div == "tours") || 
		(selected_div == "poigroups") || 
		(selected_div == "poigroup") ||
		(selected_div == "my_visit_list") ||
		(selected_div == "events_filtered")) {
		offsets[selected_div] = window.pageYOffset;
	}
	
	if (div == "events") {
		if ((data == undefined) || (data.items == undefined) || (data.items == null) || (data.items.length == 0)) {
			synhronization_prompt();
		};
	}
	
	$('body').css('position','');
	if (((div == "trips") && (voice_guide == 0)) || (div == "events")) { 
		show_spinner();
		//return;
	}
	
	if (footer == "") {
		footer = load_template("ztl_footer.html", "#tpl_ztl_footer");
	}

	if (media == "") {
		media = load_template("ztl_media_player.html", "#tpl_ztl_media_player");
	}
	
	if (event_filter == "") {
		event_filter = load_template("event_filter.html", "#tpl_event_filter");
	}

	if (poi_filter_template == "") {
		poi_filter_template = load_template("poi_filter.html", "#tpl_poi_filter");
	}

	if (map_settings == "") {
		map_settings = load_template("ztl_map_settings.html", "#tpl_ztl_map_settings");
	}

 
	if ((div == "trips") && (voice_guide == 0)) {
		if ((data != undefined) && (current_position_xy != undefined)) {
			data = sort_by_distance(data);
		}
   }
	
	$.ajax({
		type:"GET",
		url:template_root+template,
		cache:false,
		async:true,
		dataType: 'html',
		success:function(temp){
			$('body').html("");
			
			var remove_marquee = 1;
			var menu_icon 	 = 3;
			var extra_div_id = "";
			
			if (div == 'trips') {
				extra_div_id 		= "_"+id_group;
				data.extra_div_id 	= id_group;
				data.filter_label 		= filter_translation[settings.id_lang].toUpperCase();
				if (id_group != INFO_POI_GROUP) {
					data.page_title 	= trips_title[id_group];
				} else {
					data.page_title 	= data.items[0].cat_title;
					curr_info_id 		= data.items[0].cat_id;
					data.info_poi 		= 1;
				}
			    if (id_group == POI_NASTANITVE_GROUP) {
					data.stars="true";
				}
				if ((id_group != POIGROUP_GROUP) &&	(id_group != VOICE_GROUP) && (id_group != INFO_POI_GROUP)) {
					var filter_poigroup 	= poi_filter_poigroup(id_group);
					data.poi_filter 		= filter_poigroup;
					data.poi_filter_title	= trips_title[id_group].toUpperCase();
					data.default_category 	= default_category_translation[settings.id_lang];
					data.potrdi_button 		= confirm_translation[settings.id_lang];
					data.filter				= "true";
					for (var ei=0; ei<filter_poigroup.length; ei++) {
						filter_poigroup[ei].filter_selected = "";
						if (poi_filter_curr == filter_poigroup[ei].id){
							filter_poigroup[ei].filter_selected = "SELECTED";
						}	
					}
				}
				if (title_poi_filter.length > 0) {
					data.poi_filter_title_show = 1;
				} else { 
					data.poi_filter_title_show = 0;
				}
				data.title_poi_filter = title_poi_filter;
			} else if (div == 'trip') {
				data.ztl_item_details_description = description_translation[settings.id_lang];
				data.map_button 				= map_translation[settings.id_lang];
				data.ztl_item_details_title 	= title_translation[settings.id_lang];
				data.guide_button				= voice_guide_translation_full[settings.id_lang];
				data.id_group 					= id_group;
				data.tmi 						= tmi;
				//if (data.title.length>max_dolzina_naslov) {
				//	data.title=data.title.substring(0,max_dolzina_naslov)+"...";
				//}
				if (data.title.length>max_dolzina_naslov) {
					remove_marquee = 0; 
				}
				if (selected_group == POI_NASTANITVE_GROUP) {
					data.stars="true";
				}
				if (voice_guide == 1) {
					data.voice_guide = 1;
				} 
				if (selected_group == POIGROUP_GROUP) {
					data.poigroup 	= 1;
					data.id_poigroup = curr_poigroup_id;
				}
				if (selected_group == INFO_POI_GROUP) {
					data.info_poi 	= 1;
					data.id_info 	= curr_info_id;
				}
				if ((data.address.length>1)||(data.post_number.length>1)||(data.post.length>1)) {
					data.address_title = 1;
				}
				menu_icon 	= 3;
			} else if (div == 'events') {
				//evente vedno osvezim zaradi spremembe datuma
			    load_events(0);
				
				is_sub_event	   	= 0;
				data.categories 	= event_type;
				data.page_title 	= trips_title[id_group];
				data.map_button 	= map_translation[settings.id_lang];
				data.events_title 	= events_translation[settings.id_lang];
				data.default_category = default_category_translation[settings.id_lang];
				data.potrdi_button 	= confirm_translation[settings.id_lang];
				data.filter_label 		= filter_translation[settings.id_lang].toUpperCase();
				voice_guide			= 0;
				$('body').html("");
			} else if (div == 'filtered_events') {
				for (var ei=0; ei<event_type.length; ei++) {
					event_type[ei].filter_selected = "";
					if (event_type_filter == event_type[ei].id){
						event_type[ei].filter_selected = "SELECTED";
					}	
				}

				if (event_date_from_sql == 0) {
					data.event_date_from_sql = "";
				} else {
					data.event_date_from_sql = event_date_from_sql;
				}

				if (event_date_to_sql == 0) {
					data.event_date_to_sql = "";
				} else {
					data.event_date_to_sql = event_date_to_sql;
				} 

				data.event_date_from	= event_date_from;
				data.event_date_to		= event_date_to;
				data.page_title 		= trips_title[id_group];
				data.categories 		= event_type;
				data.events_title 		= events_translation[settings.id_lang];
				data.default_category 	= default_category_translation[settings.id_lang];
				data.potrdi_button 		= confirm_translation[settings.id_lang];
				data.filter_label 		= filter_translation[settings.id_lang].toUpperCase();
				$('body').html("");
			/*} else if (div == 'poi_filter') {
				var filter_poigroup = poi_filter_poigroup();
				
				for (var ei=0; ei<filter_poigroup.length; ei++) {
					filter_poigroup[ei].filter_selected = "";
					if (poi_filter_curr == filter_poigroup[ei].id){
						filter_poigroup[ei].filter_selected = "SELECTED";
					}	
				}

				data.poi_filter 		= filter_poigroup;
				data.poi_filter_title	= trips_title[id_group].toUpperCase();
				data.default_category 	= default_category_translation[settings.id_lang];
				data.potrdi_button 		= confirm_translation[settings.id_lang];
				$('body').html("");*/
			} else if (div == 'event') {
				data.is_sub_event				= is_sub_event;
				data.sub_events_id				= sub_events_id;
				data.categories 				= event_type;
				data.ztl_item_details_title 	= title_translation[settings.id_lang];
				data.events_title 				= events_translation[settings.id_lang];
				data.ztl_item_details_description = description_translation[settings.id_lang];
				data.ztl_item_details_venue 	= venue_translation[settings.id_lang];
				data.ztl_item_details_price 	= price_translation[settings.id_lang];
				data.default_category 			= default_category_translation[settings.id_lang];
				data.guide_button				= voice_guide_translation_full[settings.id_lang];
				data.potrdi_button 				= confirm_translation[settings.id_lang];
				data.map_button 				= map_translation[settings.id_lang];
				data.ztl_item_sub_events		= sub_events_translation[settings.id_lang];
				extra_div_id 					= "_"+data.item.id;
				if (data.item.title.length>max_dolzina_naslov)
					remove_marquee = 0; 
				//if (data.item.title.length>max_dolzina_naslov) {
				//	data.item.title=data.item.title.substring(0,max_dolzina_naslov)+"...";
				//}
			} else 	if (div == 'tour') {
				data.ztl_item_details_description = description_translation[settings.id_lang];
				data.guide_button				= voice_guide_translation_full[settings.id_lang];
				data.tour_category_id 			= selected_group;
				extra_div_id 					= "_"+data.item.id;
				if (data.item.title.length>max_dolzina_naslov) {
					remove_marquee = 0; 
				}
				//if (data.item.title.length>max_dolzina_naslov) {
				//	data.item.title=data.item.title.substring(0,max_dolzina_naslov)+"...";
				//}
			} else if (div == 'tours') {
				data.page_title 	= data.items[id_group].tour_category;
			} else if (div == 'tour_category') {
				data.page_title 	= main_menu['img6'];
			} else if (div == 'infos') {
				data.page_title 	= trips_title[id_group];
			} else if (div == 'info') {
				data.ztl_item_details_description = description_translation[settings.id_lang];
				extra_div_id 		= "_"+data.item.id;
				if (data.item.title.length>max_dolzina_naslov) {
					remove_marquee = 0; 
				}
				//if (data.item.title.length>max_dolzina_naslov) {
				//	data.item.title=data.item.title.substring(0,max_dolzina_naslov)+"...";
				//}
			} else if (div == 'poigroups') {
				data.page_title 	= trips_title[id_group];
				voice_guide			= 0;
			} else if (div == 'poigroup') {
				curr_poigroup_id = data.items[0].poigroup_id;
				data.poigroup = 1;
				data.ztl_item_details_description = description_translation[settings.id_lang];
				data.ztl_item_poigroup_list 	= ztl_item_poigroup_list_translation[settings.id_lang];
				data.poigroup_id 				= data.items[0].poigroup_id;
				data.poigroup_title 			= data.items[0].poigroup_title;
				data.poigroup_desc 				= data.items[0].poigroup_desc;
				data.poigroup_image 			= data.items[0].poigroup_image;
				extra_div_id 					= "_"+data.items[0].poigroup_id;
				voice_guide						= 0;
			} else if (div == 'main_menu') {
				view_main_menu 	= 1;
				voice_guide		= 0;
			} else if (div == 'ztl_settings') {
				menu_icon 	= 5;
				data = {};
				data.title 				= settings_translation[settings.id_lang];
				data.my_visit_account 	= my_visit_account_translation[settings.id_lang];
				data.reminder 			= reminder_translation[settings.id_lang];
				data.set_language		= set_language_translation[settings.id_lang];
				data.synchronization	= synchronization_translation[settings.id_lang];
				data.rate 				= rate_translation[settings.id_lang];
				data.about				= about_translation[settings.id_lang];
				data.exit				= exit_translation[settings.id_lang];
				if (device.platform == "Android") {
					data.android		= "1";
				}
				voice_guide				= 0;
			} else if (div == 'ztl_synhronization') {
				data = {};
				data.synhronization_title 	= synhronization_title_translation[settings.id_lang];
				data.synhronization_desc 	= synhronization_desc_translation[settings.id_lang];
				data.synhronization_button 	= synhronization_button_translation[settings.id_lang];
			} else if (div == 'ztl_about') {
				menu_icon 	= 5;
				data = {};
				data.about_title	= about_translation[settings.id_lang];
				data.copy_right 	= copy_right_translation[settings.id_lang];
				data.version 		= VERSION;
				data.about_version 	= about_version_translation[settings.id_lang];
				data.about_contact 	= about_contact_translation[settings.id_lang];
				data.about_desc		= about_desc_translation[settings.id_lang];
			} else if (div == "my_visit_list") {
				data.reminder 			= reminder_translation[settings.id_lang];
				data.page_title  		= my_visit_page_title_translation[settings.id_lang];
				data.select_view 		= select_view_translation[settings.id_lang];
				data.confirm 	 		= confirm_translation[settings.id_lang];
				data.show_on_map 		= show_on_map_translation[settings.id_lang];
				data.my_visit_sync  	= my_visit_sync_translation[settings.id_lang];
				data.logout 			= logout_translation[settings.id_lang];
				data.clear_my_visit 	= clear_my_visit_translation[settings.id_lang];
				data.default_category 	= default_category_translation[settings.id_lang];
				data.event_date 		= event_date_translation[settings.id_lang]
				data.dots 		 		= 1;
                data.is_android         = is_android; //reinit v global variables
				voice_guide				= 0;
				menu_icon				= 1;
			} else if (div == "guide_buy") {
				//data = {};
				data.title 				= voice_guide_translation[settings.id_lang].toUpperCase();
				data.guide_buy_desc 	= guide_buy_desc_translation[settings.id_lang].toUpperCase();
				data.guide_buy_desc_text= guide_buy_desc_text_translation[settings.id_lang].toUpperCase();
				data.guide_buy_locations= guide_buy_locations_translation[settings.id_lang].toUpperCase();
				data.guide_buy_button	= guide_buy_button_translation[settings.id_lang].toUpperCase();
				menu_icon 				= 2;
			} else if (div == "my_visit_settings") {
				data.page_title 					= my_visit_page_title_translation[settings.id_lang];
				data.my_visit_download_translation 	= my_visit_download_translation[settings.id_lang];
				data.user_name						= user_name_translation[settings.id_lang];
				data.password						= password_translation[settings.id_lang];
				data.login						    = login_translation[settings.id_lang];
				data.my_visit_tours					= my_visit_tours_translation[settings.id_lang];
				data.my_visit_poi					= my_visit_poi_translation[settings.id_lang];
				data.download 						= download_translation[settings.id_lang];
				data.logout 						= logout_translation[settings.id_lang];
				data.dots 							= 0;
				menu_icon							= 1;
			} else if (div == "ztl_map") {
				data = {};
				data.title 				= map_translation[settings.id_lang];
				data.voice_guide 		= voice_guide_translation[settings.id_lang];
				data.inspired			= inspired_translation[settings.id_lang];
				data.prikaz_title		= prikaz_title_translation[settings.id_lang];
				data.prikazi_button		= prikazi_button_translation[settings.id_lang];
				data.tour_list_group	= TOUR_LIST_GROUP;
				data.voice_group		= VOICE_GROUP;
				data.inspired_group		= INSPIRED_GROUP;
			} else if (div == "inspired") {
				data.page_title 		= main_menu['img1'];
				data.my_visit_inspired  = my_visit_inspired_translation[settings.id_lang];
			} else if (div == "ztl_guide_settings") {
				data = {};
				data.show_on_map 		= show_on_map_translation[settings.id_lang];
				data.add_to_myvisit		= add_to_myvisit_translation[settings.id_lang];
			} else if (div == "select_language") {
				data = {};
				if (settings.id_lang != undefined) {
					data.set_language 		= set_language_translation[settings.id_lang].toUpperCase();
				} else {
					data.set_language 		= set_language_translation[2].toUpperCase();					
				}
				
			}
			
			if (voice_guide == 1)  {
				if (div == 'trips') {
					extra_div_id 		= "_voice_guide";
					data.extra_div_id 	= "voice_guide";
					data.page_title 	= voice_guide_translation[settings.id_lang];
				}
				data.dots 			= 1;
				data.id_group 		= VOICE_GROUP;
				menu_icon 			= 2;
			} 

			if (id_group != undefined) {
				selected_group = id_group;
			}
			selected_div = div;
			

			var res = $(temp).filter('#tpl_'+div).html();

			if (data != null) {
				var html = Mustache.to_html(res, data);
			} else {
				var html = res;
			}
			
			html = html.replace('[[[ztl_footer]]]', footer);
			
			if ((div == 'events') || (div == 'event') || (div == 'filtered_events')) {
				html = html.replace('[[[event_filter]]]', Mustache.to_html(event_filter, data));
			}
			if ((div == 'trips') || (div == 'trip')) {
				html = html.replace('[[[poi_filter]]]', Mustache.to_html(poi_filter_template, data));
			}
			if (div == 'ztl_map') {
				html = html.replace('[[[map_settings]]]', Mustache.to_html(map_settings, data));
			}

			$('body').html(html);
			
			if (remove_marquee == 1) $('.marquee').removeClass('marquee');


			if (swipe == 1) {
				if ((div == "trip") || 
						(div == "event") || 
						(div == "info") || 
						(div == "tour") || 
						(div == "poigroup")) {
					//var ts_div = "";
					if (div == 'trip') {
						//ts_div 		= div+"_"+data['id'];
						div 		= div+"_"+data['id'];
						//swipe_group = 1;
					/*} else if (div == 'event') {
						ts_div  = div+extra_div_id;
						swipe_group = 2;
					} else if (div == 'tour') {
						ts_div  = div+extra_div_id;
						swipe_group = 3;
					} else if (div == 'info') {
						ts_div  = div+extra_div_id;
						swipe_group = 4;
					} else if (div == 'poigroup') {
						ts_div  = div+extra_div_id;
						swipe_group = 5;
					*/}

					/*$("#"+ts_div).on('touchstart', function(e) {
					     var d = new Date();
					     touchStartTime     = d.getTime();
					     touchStartLocation = e.originalEvent.targetTouches[0].pageX;
					});

					$("#"+ts_div).on('touchmove', function(e) {
						touchEndLocation    = e.originalEvent.targetTouches[0].pageX;
					});
					
					$("#"+ts_div).on('touchend', function(e) {
					     var d = new Date();
					     touchEndTime       = d.getTime();
					     doTouchLogic();
					});*/
				}
			}

			/*if (swipe == 1) {
				animate_div(div+extra_div_id, transition, reverse);
			} */

			//ce so karte inicializiram skripto. sele po nalaganju 
			if (div == "ztl_map") {
				voice_guide=0;
				menu_icon=4;
				init_map();
			}
			
			if (div == 'my_visit_list') {
				reminder_toggle();
			}

			
			$('.icon_'+menu_icon).attr("src","assets/css/ztl_images/icon_"+menu_icon+"_red.png");
			
			
			/*if ((div == "main_menu") || 
				(div == "trip") || 
				(div == "event") || 
				(div == "info") || 
				(div == "tour")) {
				i_scroll(div+extra_div_id);
			}*/
			
			pOld = new Proj4js.Point(0,0);
			navigator.geolocation.getCurrentPosition(onSuccess_gps, onError_gps);
			
			current_div = div+extra_div_id;

			//ko nalozim my_visit grem se cez case
			if (div == "my_visit_list") {
				render_time();
			}
			
			console.log("load page end");
			hide_spinner();
			
			$('a').on("click", function(e){
				if (this.href.indexOf("mailto")==-1) {
				    e.preventDefault();
				    window.open(this.href,'_system'); return false;
				}
			});

			if (offsets[div] != undefined) {
				window.scrollTo(0,offsets[div]);
			} else {
				window.scrollTo(0,1);				
			}

		}
	});
}

function loadImage (img) {
	alert($(img).parent().width()+":"+$(img).width());
	$(img).css({
        position: "relative",
        left: ($(img).parent().width()/2) - ($(img).width()/2),
        top: ($(img).parent().height()/2) - ($(img).height()/2)
    });
}

var touchStartTime;
var touchStartLocation;
var touchEndTime;
var touchEndLocation;

function doTouchLogic() {
    var direction = touchStartLocation-touchEndLocation;
    var distance  = Math.abs(direction);
    var duration  = touchEndTime - touchStartTime;

    
    if (duration > 250 && distance > 150) {
         if (direction > 0) {
        	 swipe_left_handler();
         } else {
        	 swipe_right_handler();
         }
    }
}

function animate_div(div, transition, reverse) {
	if (transition == "slide") {
		$("#"+div).hide();

		if (reverse == true) {
			$("#"+div).show("slide", { direction: "left" }, 200, function() { /*$("body").swipe("enable");*/ }); 
		} else {
			$("#"+div).show("slide", { direction: "right" }, 200, function() { /*$("body").swipe("enable");*/ }); 
		}
	}
	remove_old_divs(div);
}

function remove_old_divs(div) {
	var loaded_divs = $('body').find('.ztl_remove_from_page');
	loaded_divs.each(function() {
		if (this.id != div) {
			$(this).remove(); 
		}
	});
}

function i_scroll(div_id) {
	myScroll = new iScroll(div_id);
}

function load_template(src, tpl) {
	var tmp;
	$.ajax({
		type:"GET",
		url:template_root+template_lang+src,
		cache:false,
		async:false,
		dataType: 'html',
		success:function(temp){
			tmp = $(temp).filter(tpl).html();
		}
	});
	return tmp;
}

function select_language(id) {
	title_poi_filter = "";
	if (settings.id_lang == id) {
		load_page(template_lang+'main_menu.html', 'main_menu', main_menu, 'fade', false, 0);
	} else {
		settings.id_lang = id;
		
		reset_cache();
	}
}

function select_language_cont() {
	//samo za test sinhronizacije
	//check_updates();
	localStorage.setItem('first_synhronization', 0);
	
	if (settings_type == 1) {
		//nalozim glavni menu
		swipe = 0;
		load_page(template_lang+'main_menu.html', 'main_menu', main_menu, 'fade', false, 0);
	} else {
		save_mobile_settings();
	}
}

function dprun(t) {
	if (device.platform != "iOS") {
		var currentField = $(t);
		var hiddenField  = $("#"+currentField.attr("id")+"_hidden");
		//var myNewDate = Date.parse(currentField.val()) || new Date();
		var myNewDate = new Date();
		window.plugins.datePicker.show({
			date : myNewDate,
			mode : 'date', // date or time or blank for both
			allowOldDates : false
			}, function(returnDate) {
				var date_array = returnDate.split("-");
				var date_obj   = new Date(date_array[0], date_array[1], date_array[2]);
				navigator.globalization.dateToString(
					date_obj,
					function (date) {currentField.val(date.value);},
					function () {currentField.val(returnDate);},
					{formatLength:'short', selector:'date'}
				);
				hiddenField.val(Math.round(date_obj.getTime()/1000));
				currentField.blur();
			}
		);
	}
}

function dpend(t) {
	if (device.platform == "iOS") {
		var currentField = $(t);
		var hiddenField  = $("#"+currentField.attr("id")+"_hidden");
		
		var date_array = currentField.val().split("-");
		var date_obj   = new Date(date_array[0], date_array[1], date_array[2]);
		date_obj = new Date(new Date(date_obj).setMonth(date_obj.getMonth()-1));
		/*navigator.globalization.dateToString(
			date_obj,
			function (date) {},
			function () {},
			{formatLength:'short', selector:'date'}
		);*/
		hiddenField.val(Math.round(date_obj.getTime()/1000));
	}
}

function start_synhronization() {
	if (navigator.network.connection.type == Connection.NONE) {
		navigator.notification.confirm(
				no_data_connection_desc_translation[settings.id_lang],
				null,
		        synchronization_translation[settings.id_lang],
		        ok_translation[settings.id_lang]
		    );
	} else {
		synhronize_all = 0;
		do_synhronization();
	}
}


function do_synhronization() {
	//check_updates();
	update_db();
}

function sort_by_distance(unsorted) {
	var len = unsorted.items.length;
	var cx = current_position_xy[0]-correctionX;
	var cy = current_position_xy[1]-correctionY;
	var keys = [];
	var datas = {};
	for (var i=0; i<len; i++){
		if (unsorted.items[i] == undefined) continue;
		var id = unsorted.items[i].id;
		var x = unsorted.items[i].coord_x;
		var y = unsorted.items[i].coord_y;
		var dist = lineDistanceAll(x, y, cx, cy)+Math.pow(i,-6); //tole je da preprecim enake razdelja istih koordinat
		if ((x==0) || (x='')) dist = 99999-i;
		
		keys.push(dist);
		datas[dist] = id;
	}
	var aa = keys.sort(function(a,b){return a-b});
	
	var sorted = new Array();
	
	var cur = 0;
	$.each(aa, function(index, value){
		sorted[cur] = datas[value]; 
	    cur++;
	})
	
	var data_sorted = {};
	data_sorted.items = [];
	for (var i=0; i<len; i++){
		if (unsorted.items[i] == undefined) continue;
		var id = unsorted.items[i].id;
		var indx = sorted.indexOf(id);
		data_sorted.items[indx] = unsorted.items[i];
	}
	
	return data_sorted;
}

var spinner; 
	
function show_spinner() {
	var opts = {
			  lines: 25, // The number of lines to draw
			  length: window.innerWidth/24, // The length of each line
			  width: window.innerWidth/48, // The line thickness
			  radius: 40, // The radius of the inner circle
			  corners: 0.5, // Corner roundness (0..1)
			  rotate: 0, // The rotation offset
			  direction: 1, // 1: clockwise, -1: counterclockwise
			  color: '#ff0000', // #rgb or #rrggbb
			  speed: 1, // Rounds per second
			  trail: 60, // Afterglow percentage
			  shadow: false, // Whether to render a shadow
			  hwaccel: false, // Whether to use hardware acceleration
			  className: 'spinner', // The CSS class to assign to the spinner
			  zIndex: 2e9, // The z-index (defaults to 2000000000)
			  top: window.pageYOffset + (window.innerHeight-window.innerWidth/3)/2, // Top position relative to parent in px
			  left: (window.innerWidth-window.innerWidth/3)/2 // Left position relative to parent in px
			};
	
	$(document.createElement('div')).width('120%').height('120%')
	.css({backgroundColor:'black', opacity:0.8, position:'absolute', zIndex:2e8, left:0, top:0})
    .attr("id","overlay").prependTo($('body'));

	
	if ((current_div == 'select_language') || (current_div == 'ztl_synhronization') || (current_div == 'guide_buy') || (current_div == 'events')) {
		$('body').css('position','');
		var target = document.getElementById("body");
	} else {
		$('body').css('position','relative');
		var target = document.getElementById("overlay");
	}

	spinner = new Spinner(opts).spin(target);
	
	$('body').on('touchmove', function(evt) {
	    evt.preventDefault(); 
	})

}

function hide_spinner() {
	$('body').unbind('touchmove');
	if (spinner != undefined) spinner.stop();
}

function format_date(date_string, id, hide_time) {
    var date_obj = new Date(date_string*1000);
    
    var selector = "date and time";
    if (hide_time == 1) {
    	selector = "date";
    }

    navigator.globalization.dateToString(
        date_obj,
    function (date) {
        $("#"+id).html(date.value);
    },
    function () {},
    {formatLength:'short', selector:selector}
    );
}

function opacity(el) {
	el.css({ opacity: 0.3 });
}

function un_opacity(el) {
	el.css({ opacity: 1 });
}