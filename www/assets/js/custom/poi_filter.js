var poi_filter 	   			= new Array();

var tmp_event_data 			= {};
var tmp_tours_data 			= {};

var poi_filter_curr 	= 0;
var title_poi_filter 	= "";
var event_call_from_history = 0;

function poi_filter_toggle() {
	$(".poi_filter").toggle();
	
	$(".ztl_content").toggle();
	$(".header").toggle();
	$(".footer").toggle();
	$(".ztl_distance_to_footer").toggle();

	if ($('.poi_filter').is(':visible')) {
		swipe = 0;
		is_poi_filter = 1;
	} else {
		swipe = 1;
		is_poi_filter = 0;
	}
}

function poi_filter_poigroup(id_group) {
	var filter_poigroup		= new Array();
	var filter = poigroups_map[id_group];
	for (var ei=0; ei<poi_filter.length; ei++) {
        if ($.inArray(poi_filter[ei].id.toString(), filter) != -1) {
			filter_poigroup.push(poi_filter[ei]);
		}
	}
	
	return filter_poigroup;
}

function filter_poi()  {
	swipe = 0;
	var history_string = "fun--poi_filter--empty";
	add_to_history(history_string);

	if ($('#poi_filter_sel').val() != undefined) {
		poi_filter_curr = $('#poi_filter_sel').val();
		title_poi_filter = $('#poi_filter_sel option:selected').text();
	}
	
	var res = {};
    res.items = [];
    if (poi_filter_curr > 0) {
		var data = trips[selected_group];
		var j=0;
		//indexOf ne dela na IOS, $.inArray pa ne na Androidu
		for (var i=0; i<data.items.length; i++){
			if (selected_group != POI_NASTANITVE_GROUP) {
				if (data.items[i].poigroups.indexOf(poi_filter_curr) != -1) {
					res.items[j] = data.items[i];
					j++;
				}
			} else {
				if (data.items[i].cats.indexOf(poi_filter_curr) != -1) {
					res.items[j] = data.items[i];
					j++;
				}
			}
		}
	} else {
		res = trips[selected_group];
	}
	load_page(template_lang+'trips.html', 'trips', res, 'fade', false, selected_group);
}

