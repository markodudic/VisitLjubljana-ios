function add_to_history(history_string) {
	var history = local_storage_load();
	
	console.log("localhistory --- add: "+history_string);

	//dodam samo ce je razlicen od zadnjeg
	if ((history.length > 0) && (history[history.length-1] == history_string)) {
		//ne dodam
	} else {
		history.push(history_string);
		localStorage.setItem('history', JSON.stringify(history));
	}
	
	console.log("localhistory --- "+history.length+":"+JSON.stringify(history));	
}

function local_storage_load() {
	var history = [];
	if (localStorage.getItem('history') != null) {
		history = JSON.parse(localStorage.getItem('history'));
	} else {
		history = tmp_history;
	}

	return history; 
}

function go_back() {
	var history = JSON.parse(localStorage.getItem('history'));

	console.log("localhistory --- "+history.length+":"+JSON.stringify(history));

	if (is_poi_filter == 1) {
		poi_filter_toggle();
		is_poi_filter = 0;
	} else if (is_event_filter == 1) {
		event_filter_toggle();
		is_event_filter = 0;
	} else if (my_visit_filter == 1) {
		my_visit_settings_menu_toggle();
		my_visit_filter = 0;
	} else if (media_opened == 1) {
		media_control_stop();
		media_opened = 0;
	} else {
		if (history.length == 1) {
			//grem v sleep
			exit();
		} else if (history.length > 1) {
			view_main_menu	= 0;
			var history = local_storage_load();
			var go_to 	= history[history.length-2];

			console.log("go to --- "+go_to);

			
			if (go_to != null) {
				var go_to 	= go_to.split("--"); 
			}

			history.pop();
			localStorage.setItem('history', JSON.stringify(history));

			if (go_to[0] == 'fun') {
				slide 		= 0;
				var params 	= "";

				if (go_to[2] != 'empty') {
					params = go_to[2].split("__");
				} 
					
				if (go_to[1] == "load_pois") {
					load_page(template_lang+'trips.html', 'trips', trips[params[0]], 'fade', false, params[0]);
				} else if (go_to[1] == "load_main_screen") {
					load_main_screen(0);
				} else if (go_to[1] == "load_voice_guide") {
					voice_guide = 1; 
					load_page(template_lang+'trips.html', 'trips', trips[VOICE_GROUP], 'fade', false, VOICE_GROUP);
				} else  if (go_to[1] == "load_events") {
					load_page(template_lang+'events.html', 'events', trips[EVENT_GROUP], 'fade', false, EVENT_GROUP);
				} else  if (go_to[1] == "load_event") {
					load_event(params[0], 0);
				} else if (go_to[1] == "load_tours") {
					load_tours(0);
				} else if (go_to[1] == "load_tour") {
					load_page(template_lang+'tours.html', 'tours', trips[TOUR_GROUP], 'fade', false, TOUR_GROUP);
				} else if (go_to[1] == "load_my_visit") {
					load_my_visit(0);
				} else if (go_to[1] == "load_poi") {
					slide = 1;
					
					var tmp_transition = false;
					if (params[2] == "true") {
						tmp_transition = true;
					}

					load_poi(params[0],params[1],tmp_transition,0);
				} else if (go_to[1] == "load_info") {
					load_page(template_lang+'infos.html', 'infos', trips[INFO_GROUP], 'fade', false, INFO_GROUP);
				} else if (go_to[1] == "load_guide_buy") {
					load_guide_buy();
				} else if (go_to[1] == "load_show_map") {
					if ((params[0] == undefined) || (params[0] == 'undefined')) {
						load_show_map();
					} else {
						load_show_map(params[0], params[1], params[2]);
					}
				} else if (go_to[1] == "load_current_settings") {
					load_current_settings();
				} else if (go_to[1] == "load_tours_category") {
					load_page(template_lang+'tour_category.html', 'tour_category', trips[TOUR_LIST_GROUP], 'fade', false, TOUR_LIST_GROUP);
				} else if (go_to[1] == "load_tours_menu") {
					load_page(template_lang+'tours.html', 'tours', trips[TOUR_LIST_GROUP].tours[params[0]], 'fade', false, params[0]);
				} else if (go_to[1] == "filter_visits") {
					filter_visits(params[0]);
				} else if (go_to[1] == "filter_events") {
					event_call_from_history = 1;
					filter_events();
				} else if (go_to[1] == "poi_filter") {
					filter_poi();
				} else if (go_to[1] == "load_single_info") {
					load_single_info(params[0], 0);
				} else if (go_to[1] == "load_info_pois") {
					load_info_pois(params[0], 0);
				} else if (go_to[1] == "load_single_poigroup") {
					load_single_poigroup(params[0], 0);
				} else if (go_to[1] == "guide_settings") {
					load_guide_buy();
				} else if (go_to[1] == "main_settings") {
					load_current_settings();
				}
			} else if (go_to[0] == 'main_menu') {
				voice_guide = 0;
				if (go_to[1] == INSPIRED_GROUP) {
					load_page(template_lang+'inspired.html', 'inspired', trips[INSPIRED_GROUP], 'fade', false, INSPIRED_GROUP);
				} else if (go_to[1] == EVENT_GROUP) {
					load_page(template_lang+'events.html', 'events', trips[EVENT_GROUP], 'fade', false, EVENT_GROUP);
				} else if (go_to[1] == POI_ZAMENITOSTI_GROUP) {
					load_page(template_lang+'trips.html', 'trips', trips[POI_ZAMENITOSTI_GROUP], 'fade', false, POI_ZAMENITOSTI_GROUP);
				} else if (go_to[1] == POI_KULINARIKA_GROUP) {
					load_page(template_lang+'trips.html', 'trips', trips[POI_KULINARIKA_GROUP], 'fade', false, POI_KULINARIKA_GROUP);
				} else if (go_to[1] == INFO_GROUP) {
					load_page(template_lang+'infos.html', 'infos', trips[INFO_GROUP], 'fade', false, INFO_GROUP);
				} else if (go_to[1] == TOUR_LIST_GROUP) {
					load_page(template_lang+'tour_category.html', 'tour_category', trips[TOUR_LIST_GROUP], 'fade', false, TOUR_LIST_GROUP);
				} else if (go_to[1] == POI_NASTANITVE_GROUP) {
					load_page(template_lang+'trips.html', 'trips', trips[POI_NASTANITVE_GROUP], 'fade', false, POI_NASTANITVE_GROUP);
				} else if (go_to[1] == POI_ZABAVA_GROUP) {
					load_page(template_lang+'trips.html', 'trips', trips[POI_ZABAVA_GROUP], 'fade', false, POI_ZABAVA_GROUP);
				} else if (go_to[1] == POI_NAKUPOVANJE_GROUP) {
					load_page(template_lang+'trips.html', 'trips', trips[POI_NAKUPOVANJE_GROUP], 'fade', false, POI_NAKUPOVANJE_GROUP);
				} else if (go_to[1] == POIGROUP_GROUP) {
					load_page(template_lang+'poigroups.html', 'poigroups', trips[POIGROUP_GROUP], 'fade', false, POIGROUP_GROUP);
				}
			} else {
				if (main_menu == 0) {
					view_main_menu = 1;
				}
				load_main_screen(0);
			}
		}
	}
}