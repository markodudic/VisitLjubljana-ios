//events filter
var date_from      = "";
var date_to 	   = "";
var event_category = 0;

//tmp --
var sound_file 	= "";
var trip_id 	= 0;
//tmp -- end

var tmi = 0;
function load_settings() {
	swipe = 0;
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
		settings_type 		= 2;
		
		var tmp_query 		= "SELECT name FROM sqlite_master WHERE type='table' AND name='ztl_updates'";
		var tmp_callback	= "check_db_success";
			
		generate_query(tmp_query, tmp_callback);
	} else {
		settings_type = 1;
		load_desktop();
		
		$.getScript('./assets/tmp_settings/db.js', function () {
			db.transaction(populateDB, errorCB);
		});
	}
}


function load_pois(id, trips_menu_id, save_history) {
	swipe = 0;
	
	//shrani v localhost
	if (save_history == 1)  {
		var history_string = "fun--load_pois--"+id+"__"+trips_menu_id;
		add_to_history(history_string);
	}

	if (trips_menu_id > 0) {
		tmi = trips_menu_id;
	}
	
	trips_title[id] = main_menu['img'+tmi];
	
	if (id == 0) {
	} else {
		group = id;
		//samo za test
		var limit = "";
		if (group == POI_NASTANITVE_GROUP) {
			var tmp_query 		= 	"SELECT zp.*, zpt.title, "+group+" id_group, zpt.description " + 
									"FROM ztl_poi zp " +
									"LEFT JOIN ztl_poi_category zpc ON zpc.id_poi = zp.id  " + 
									"LEFT JOIN ztl_category_group zcg ON zcg.id_category = zpc.id_category " +
									"LEFT JOIN ztl_poi_translation zpt ON zpt.id_poi = zp.id  " + 
									"WHERE zcg.id_group = "+group+" AND zpt.id_language = "+settings.id_lang+" AND zp.record_status = 1 " + 
									"GROUP BY zp.id " +
									"ORDER BY zpt.title";
		} else {
			var tmp_query 		= 	"SELECT zp.*, zpt.title, "+group+" id_group, zpt.description " + 
									"FROM ztl_poi zp " + 
									"LEFT JOIN ztl_poi_translation zpt ON zpt.id_poi = zp.id " +
									"WHERE zpt.id_language = "+settings.id_lang+" AND zp.record_status = 1 " + 
									"GROUP BY zp.id " +
									"ORDER BY zpt.title";
		}
		/*
			var tmp_query 		= 	"SELECT zp.*, zpt.title title, "+group+" id_group, zpt.description description " +
									"FROM (select * from ztl_poi WHERE record_status = 1) zp " +
									"LEFT JOIN ztl_poi_category zpc ON zpc.id_poi = zp.id  " +
									"INNER JOIN (select * from ztl_category_group WHERE id_group = "+group+") zcg ON zcg.id_category = zpc.id_category " +  
									"LEFT JOIN (select * from ztl_poi_translation where id_language = "+settings.id_lang+") zpt ON zpt.id_poi = zp.id " +  
									"GROUP BY zp.id " +
									"ORDER BY zpt.title ";
		*/
		var tmp_callback	= "load_pois_success";
		generate_query(tmp_query, tmp_callback);
    }
}


function load_poi_filter() {
	var tmp_query 	 = 	"SELECT id, title " +
						"FROM ztl_poi_filter " +
						"WHERE id_language = "+settings.id_lang+" " +
						"union  " +
						"select id, title   " +
						"from ztl_category_group " +
						"left join ztl_category on (id = id_category) " +
						"where id_group = " + POI_NASTANITVE_GROUP + " and id_language = "+settings.id_lang+" " +
						"ORDER BY title";
	var tmp_callback = "poi_filter_success";
	generate_query(tmp_query, tmp_callback);
}

function load_poi(id, transition, reverse, save_history) {
	if (save_history == 1)  {
		var history_string = "fun--load_poi--"+id+"__"+transition+"__"+reverse;
		add_to_history(history_string);
	}

	trip_id 	= id;
	sound_file 	= "";

	var tmp_query 		= 	'SELECT zp.id, zp.address, zp.post_number, zp.post, zp.phone, zp.email, zp.www, zp.coord_x, zp.coord_y, zp.image, zp.image_w, zp.image_h, zp.star, ' +
							' 	zpt.title, zpt.description, '+selected_group+' id_group, zpt.sound, zpt.media_duration_value, zpt.media_duration_string '+
							'FROM ztl_poi zp '+
							'LEFT JOIN ztl_poi_category zpc ON zpc.id_poi = zp.id  '+
							'LEFT JOIN ztl_category_group zcg ON zcg.id_category = zpc.id_category  '+
							'LEFT JOIN ztl_poi_translation zpt ON (zpt.id_poi = zp.id AND zpt.id_language = '+settings.id_lang+') '+
							'WHERE zp.id = '+id+' '+
							'GROUP BY zp.id '+
							'ORDER BY zpt.title';
	var tmp_callback	= "load_poi_success";

	generate_query(tmp_query, tmp_callback);
}


function play_voice_guide(id) {
	if (is_purchased_and_stored() == 0) {
		load_page(template_lang+'guide_buy.html', 'guide_buy', trips[VOICE_GROUP], 'fade', false);
	} else {
		
		$(".media_payer").toggle();
		
		$(".ztl_content").toggle();
		$(".header").toggle();
		$(".footer").toggle();
	
		my_media = null;
		load_media_file(sound_file);

		current_position = 0;
		tmp_pos 		 = 0;
		canvas  		 = document.getElementById('myCanvas');
		context			 = canvas.getContext('2d');
		x 			 	 = canvas.width / 2;
		y 			 	 = canvas.height / 2;
		endPercent   	 = media_length+1;
		curPerc      	 = 0;
		media_koef 	 	 = media_length/100;
		current 	 	 = 0;

		context.lineWidth   = 15;
		context.strokeStyle = '#ccc';

		context.beginPath();
		context.arc(x, y, radius, -(quart), ((circ) * 100) - quart, false);
		context.stroke();

		context.lineWidth   = 15;
		context.strokeStyle = '#ed1b24';
	}
}

function  load_media_file(file) {
	my_media = new Media(file,
        function() {
            console.log("Audio Success *************************************");
        },
            function(err) {
                console.log(err);
        }
    );

}

function set_media_state(value) {
	media_opened = value;
}

function load_events(save_history) {
	swipe_dir 	   = "";
	date_from      = "";
	date_to 	   = "";
	event_category = 0;
	is_sub_event	   = 0;
	
	swipe = 0;
	if (save_history == 1)  {
		var history_string = "fun--load_events--empty";
		add_to_history(history_string);
	}

	load_event_type();

	trips_title[0] = main_menu['img2'];
	
	var tmp_query    = "SELECT e.id, e.featured, e.important, e.sub_events, et.title, ett.venue_id, " +
						"	(select date  " +
						"	from ztl_event_timetable as ztt2,  " +
						"	    (select min(date_first) as df  " +
						"	    from ztl_event_timetable  " +
						"	    where id_event = e.id AND date_last >= CAST(strftime('%s',date('now'),'utc') as integer)) as ett1  " +
						"	where ztt2.id_event = e.id and ztt2.date_first = ett1.df) as date,  " +
						"	ett.date_first, ett.date_last, p.coord_x, p.coord_y, ett.venue as poi_title, e.image, e.image_w, e.image_h, " +
						"	(SELECT min(date_first) " +
						"	FROM ztl_event_timetable et  " +
						"	WHERE et.id_language = "+settings.id_lang+" AND et.id_event = e.id AND date_first >=  CAST(strftime('%s',date('now'),'utc') as integer)) as date_next, " +
						"	(SELECT count(*)  " +
						"	FROM ztl_event_timetable et  " +
						"	WHERE et.id_language = "+settings.id_lang+" AND et.id_event = e.id) as venue_cnt " +
						"FROM ztl_event e " +
						"LEFT JOIN ztl_event_translation et ON et.id_event = e.id " +
						"LEFT JOIN ztl_event_timetable ett ON ett.id_event = e.id " +
						"LEFT JOIN ztl_poi p ON p.id = ett.venue_id " +
						"WHERE et.id_language = "+settings.id_lang+" AND ett.id_language = "+settings.id_lang+" AND e.record_status = 1 AND ett.date_last >=  CAST(strftime('%s',date('now'),'utc') as integer) " +
						"GROUP BY e.id " +
						"ORDER BY e.featured desc, ett.date_first";

	var tmp_callback = "events_success";
    generate_query(tmp_query, tmp_callback);
}
/*
function load_sub_events(sub_events_array) {
	swipe_dir 	   = "";
	swipe = 0;
	sub_events=1;

	load_event_type();

	var tmp_query    = "SELECT e.id, e.featured, e.important, e.sub_events, et.title, ett.venue_id, ett.date, ett.date_first, p.coord_x, p.coord_y, ett.venue as poi_title, e.image " +
						"FROM ztl_event e " +
						"LEFT JOIN ztl_event_translation et ON et.id_event = e.id " +
						"LEFT JOIN  ztl_event_timetable ett ON ett.id_event = e.id " +
						"LEFT JOIN ztl_poi p ON p.id = ett.venue_id " +
						"WHERE et.id_language = "+settings.id_lang+" AND e.record_status = 1 and e.id in (" + sub_events_array + ") " +
						"GROUP BY e.id ";
						"ORDER BY e.featured desc, ett.date_first";
	var tmp_callback = "sub_events_success";
    generate_query(tmp_query, tmp_callback);
}
*/
function load_tour_list(save_history)  {
	swipe 			= 0;
	var tmp_query    = "SELECT * " +
						"FROM ztl_tour_category " +
						"WHERE id_language = "+settings.id_lang+" AND record_status = 1";
	var tmp_callback = "tour_list_success";

	generate_query(tmp_query, tmp_callback); 
}

function load_tours(id_tour_category, save_history)  {
	swipe_dir 	= "";
    swipe 		= 0;
    if (save_history == 1)  {
        var history_string = "fun--load_tours--empty";
        add_to_history(history_string);
    }

    trips_title[2] = main_menu['img6'];

    var tmp_query = "SELECT t.id, tt.title, tt.short_description, ti.image, ti.image_w, ti.image_h, tc.id as tour_category_id, tc.title as tour_category " +
    				"FROM ztl_tour t " +
    				"LEFT JOIN ztl_tour_translation tt ON tt.id_tour = t.id " +
    				"LEFT JOIN ztl_tour_tour_category ttc ON ttc.id_tour = t.id " +
    				"LEFT JOIN ztl_tour_category tc ON ttc.id_tour_category = tc.id " +
    				"LEFT JOIN ztl_tour_images ti ON t.id = ti.id_tour " +
    				"WHERE tt.id_language = "+settings.id_lang+" AND tc.id_language = 1 AND ttc.id_tour_category = "+id_tour_category+" AND t.record_status = 1 " +
    				"GROUP BY t.id "+
    				"ORDER BY tt.title";
    var tmp_callback   = "tour_success";
    generate_query(tmp_query, tmp_callback);
}

function load_info(save_history)  {
	swipe_dir 	= "";
    swipe 		= 0;
    if (save_history == 1)  {
        var history_string = "fun--load_info--empty";
        add_to_history(history_string);
    }

    trips_title[1] = main_menu['img5'];

    var tmp_query      = "SELECT i.* " +
    					"FROM ztl_info i " +
    					"WHERE i.id_language = "+settings.id_lang+" AND i.record_status = 1 " +
    					"GROUP BY i.id "+
    					"ORDER BY title";
    var tmp_callback   = "info_success";
    generate_query(tmp_query, tmp_callback);
}

function load_poigroup(save_history)  {
	swipe_dir 	= "";
    swipe 		= 0;
    if (save_history == 1)  {
        var history_string = "fun--load_poigroup--empty";
        add_to_history(history_string);
    }

    trips_title[8] = main_menu['img10'];

    var tmp_query      = "SELECT pg.* " +
    					"FROM ztl_poigroup pg " +
    					"WHERE pg.id_language = "+settings.id_lang+" AND pg.record_status = 1 " +
    					"GROUP BY pg.id "+
    					"ORDER BY title";
    var tmp_callback   = "poigroup_success";
    generate_query(tmp_query, tmp_callback);
}


function load_inspired(save_history)  {
	swipe_dir 	= "";
    swipe 		= 0;
    if (save_history == 1)  {
        var history_string = "fun--load_inspired--empty";
        add_to_history(history_string);
    }

    trips_title[1] = main_menu['img5'];

    var tmp_query      = "SELECT i.*, it.title, it.desc " +
    					"FROM ztl_inspired i " +
    					"LEFT JOIN ztl_inspired_translation it ON it.id_inspired = i.id " +
    					"WHERE it.id_language = "+settings.id_lang+" AND i.record_status = 1 " +
    					"GROUP BY i.id "+
						"ORDER BY it.title";
    var tmp_callback   = "inspired_success";
    generate_query(tmp_query, tmp_callback);
}


function load_voice_guide(save_history) {
	if (save_history == 1)  {
		var history_string = "fun--load_voice_guide--empty";
		add_to_history(history_string);
	}

	swipe		= 0;

	var tmp_query 		= "SELECT zp.*, zpt.title, " + VOICE_GROUP + " as id_group, zp.coord_x, zp.coord_y " +
							"FROM ztl_poi zp " +
							"LEFT JOIN ztl_poi_category zpc ON zpc.id_poi = zp.id " +
							"LEFT JOIN ztl_category_group zcg ON zcg.id_category = zpc.id_category " +
							"LEFT JOIN ztl_poi_translation zpt ON zpt.id_poi = zp.id " +
							"WHERE zpt.id_language = "+settings.id_lang+" AND zpt.sound != '' " +
							"GROUP BY zp.id "+
							"ORDER BY zpt.title";
	var tmp_callback	= "load_pois_success";

	generate_query(tmp_query, tmp_callback);
}



function load_event_type() {
	var tmp_query 	 = 	"SELECT id, title " +
						"FROM ztl_event_type e " +
						"WHERE e.id_language = "+settings.id_lang+" " +
						"GROUP BY id, title "+
						"ORDER BY title";
	var tmp_callback = "event_category_success";
	generate_query(tmp_query, tmp_callback);
}

function load_event(id, save_history) {
	swipe = 1;

	if (save_history == 1)  {
		var history_string = "fun--load_event--"+id+"__fade__false";
		add_to_history(history_string);
	}

	var tmp_query 	 = "SELECT  e.id, e.sub_events, et.title, et.intro, et.description, p.coord_x, p.coord_y, e.image, e.image_w, e.image_h " +
						"FROM ztl_event e " +
						"LEFT JOIN ztl_event_translation et ON et.id_event = e.id " +
						"LEFT JOIN  ztl_event_timetable ett ON ett.id_event = e.id " +
						"LEFT JOIN ztl_poi p ON p.id = ett.venue_id " +
						"WHERE e.id = "+id+" AND et.id_language = "+settings.id_lang+" " +
						"GROUP BY e.id"; 
    var tmp_callback = "load_event_success";
    generate_query(tmp_query, tmp_callback);
}

function load_tour(id, save_history) {
	swipe = 1;

	if (save_history == 1)  {
		var history_string = "fun--load_tour--"+id+"__fade__false";
		add_to_history(history_string);
	}


	var tmp_query = "SELECT t.id, tt.title, tt.short_description, tt.long_description, tt.contact " +
					"FROM ztl_tour t " +
					"LEFT JOIN ztl_tour_translation tt ON tt.id_tour = t.id " +
					"WHERE tt.id_language = "+settings.id_lang+" AND t.id = "+id;

	var tmp_callback = "load_tour_success";
    generate_query(tmp_query, tmp_callback);
}

function load_single_info(id, save_history) {
	swipe = 1;

	//ko bo osbstajala tabela se popravi query
	var tmp_query = "SELECT i.* " +
				"FROM ztl_info i " +
				"WHERE i.id_language = "+settings.id_lang+" AND i.id = "+id+" AND i.record_status = 1 " +
				"GROUP BY i.id";
	var tmp_callback = "load_info_success";
    generate_query(tmp_query, tmp_callback);
}

function load_info_pois(cat, save_history) {
	swipe = 0;

	if (save_history == 1)  {
		var history_string = "fun--load_info_pois--"+cat;
		add_to_history(history_string);
	}

	
	var tmp_query 		= 	"SELECT zp.*, zpt.title, zpt.description, zc.id cat_id, zc.title cat_title " + 
							"FROM ztl_poi zp " +
							"LEFT JOIN ztl_poi_category zpc ON zpc.id_poi = zp.id  " + 
							"LEFT JOIN ztl_category zc ON zc.id = zpc.id_category " +
							"LEFT JOIN ztl_poi_translation zpt ON zpt.id_poi = zp.id  " + 
							"WHERE zc.id = "+cat+" AND zc.id_language = "+settings.id_lang+"  AND zpt.id_language = "+settings.id_lang+" AND zp.record_status = 1 " + 
							"GROUP BY zp.id " +
							"ORDER BY zpt.title";

	var tmp_callback	= "load_info_pois_success";
	generate_query(tmp_query, tmp_callback);
}




function load_single_poigroup(id, save_history) {
	swipe = 1;

	if (save_history == 1)  {
		var history_string = "fun--load_single_poigroup--"+id+"__fade__false";
		add_to_history(history_string);
	}

	//ko bo osbstajala tabela se popravi query
	var tmp_query 		= 	"SELECT zp.*, zpt.title title, "+group+" id_group, zpt.description description, pg.id poigroup_id, pg.image poigroup_image, pg.image_w poigroup_image_w, pg.image_h poigroup_image_h, pg.id poigroup_id, pg.title poigroup_title, pg.desc poigroup_desc " +
						"FROM (select * from ztl_poi WHERE record_status = 1) zp " +
						"LEFT JOIN (select * from ztl_poi_translation where id_language = "+settings.id_lang+") zpt ON zpt.id_poi = zp.id " +  
						", ztl_poigroup pg " +  
						"WHERE zpt.id_language = "+settings.id_lang+" AND " +
						"		zp.poigroups LIKE '%"+id+"%' AND " +				
						"		pg.id = " + id + " AND " +				
						"		pg.id_language = " + settings.id_lang + " " +				
						"GROUP BY zp.id " +
						"ORDER BY zpt.title ";
	
	var tmp_callback = "load_poigroup_success";
    generate_query(tmp_query, tmp_callback);
}

function set_my_visit_notification() {
	if (localStorage.getItem('reminder') == 1) {
		if (device.platform == "iOS") {

		} else {
			var current_time = new Date();
			current_time = parseInt(current_time.getTime() / 1000);

			//time check
			var from = parseInt(current_time+3600-(notification_refresh_time/2));
			var to   = parseInt(current_time+3600+(notification_refresh_time/2));

			var tmp_query = "SELECT count(id) AS nr "+
							"FROM ztl_my_visit zmv " +
							"WHERE zmv.start <= '"+from+"' "+ 
							"AND zmv.start >= '"+to+"' "+
							"AND ztl_group = "+EVENT_GROUP;

			db.transaction(function(tx) {
				tx.executeSql(tmp_query, [], function(tx, res) {
					if (res.rows.item(0).nr > 0) {
						window.plugins.statusBarNotification.notify(APP_NAME, notification_translation[settings.id_lang]);
					}
				});
			});
		}
	}	
}

function load_mobile() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(SETTINGS_FOLDER+SETTINGS_FILE, { create: false }, fileExists, fileDoesNotExist);
    }, getFSFail); 
}

function fileExists(fileEntry){
	local_db = 1;
    load_moblie_settings();
}
function fileDoesNotExist(){
   create_file();
}
function getFSFail(evt) {
    create_file();
}

function create_file() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
        fileSystem.root.getDirectory(SETTINGS_FOLDER, {create: true, exclusive: false}, function(dir){}, fail); 
    } , null); 

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
    	fileSystem.root.getFile(SETTINGS_FOLDER+SETTINGS_FILE, {create: true, exclusive: false}, gotFileEntry, fail);
    }, null);
}

function gotFileEntry(fileEntry) {
	fileEntry.createWriter(gotFileWriter, fail);
}

function gotFileWriter(writer) {
	writer.onwrite = function(evt) {
		load_main_menu();
		load_moblie_settings(); 
	};
	writer.write(JSON.stringify(settings));
}

function save_mobile_settings() {
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
    	fileSystem.root.getFile(SETTINGS_FOLDER+SETTINGS_FILE, {create: true, exclusive: false}, gotFileEntry, fail);
    }, null);
    //load_moblie_settings();
}

function load_moblie_settings() {
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
		fileSystem.root.getFile(SETTINGS_FOLDER+SETTINGS_FILE, null, function(fileEntry) {
			fileEntry.file(readAsText, fail);
		}, fail);
	} , null); 
}

function readAsText(file) {
	var reader = new FileReader();
	reader.onloadend = function(evt) {

    	var tmp = JSON.parse(evt.target.result);

		if (tmp.id_lang == undefined) {
			load_page('select_language.html', 'select_language', null, 'fade', false, 0);
		} else {
			settings = tmp;
			load_main_menu();
			swipe = 0;

			/*if (skip_update == 0) {
				if (localStorage.getItem(localStorage.key('first_run')) == null) {
					check_updates();
				}
			}*/

			if (backstep == 1) {
				go_back();
			} else {
				//localStorage.clear();

				if (menu_select_lang == 1) {
					load_page('select_language.html', 'select_language', null, 'fade', false, 0);
				} else {
					load_page(template_lang+'main_menu.html', 'main_menu', main_menu, 'fade', false, 0);
				}
			}
		}
		menu_select_lang = 0;
	};
	reader.readAsText(file);
}

function fail(error) {
	console.log('nalagam error');
	console.log("error code: "+error.code);
}

function check_updates() {
	var tmp_query    = "SELECT last_update AS lu " +
						"FROM ztl_updates " +
						"WHERE id_language = "+settings.id_lang;
    var tmp_callback = "last_update_success";
    generate_query(tmp_query, tmp_callback);
}

function load_settings_page(){
	swipe = 0;
	load_page('select_language.html', 'select_language', null, 'fade', false, 0);
}

function load_main_menu() {
	var language_index = settings.id_lang - 1;
	main_menu = lang.language_menu[language_index];
}