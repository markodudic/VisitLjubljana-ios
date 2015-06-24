var only_login 		= 1;
var skip_filter_cat = 0;
var filter_cat;

var sql_filter_group  = -1;
var sql_filer_poi_cat = -1;

var event_time_array = [];
var eta_count		 = 0;
var evt_id			 = 0;
var evt_start		 = 0;

var my_visit_date 	 	= "";	
var my_visit_date_sql  	= 0;

function add_to_my_visit(id, ztl_group, type, start, end, autmatic) {
	var tmp_query = "INSERT OR REPLACE INTO ztl_my_visit (id, ztl_group, type, start, end) VALUES ("+id+", "+ztl_group+", "+type+", "+start+", "+end+");";
	//console.log("SQL="+tmp_query);

    db.transaction(function(tx) {
		 tx.executeSql(tmp_query, [], function(tx, res) {});

		 if (autmatic != 1) {
			 my_visit_transfer_complete();
		}
	});
}

function my_visit_transfer_complete() {
	navigator.notification.confirm(
			my_visit_transfer_complete_translation[settings.id_lang],
			null,
	        my_visit_page_title_translation[settings.id_lang],
	        ok_translation[settings.id_lang]
	);	
}

function load_my_visit(save_history, filter_group) {
	if (save_history == 1)  {
		var history_string = "fun--load_my_visit--empty";
		add_to_history(history_string);
	}

	if ((filter_group != undefined) && (filter_group >-1)) {
		var tmp_query  = "SELECT id, ztl_group, type, start, end FROM ztl_my_visit WHERE ztl_group = "+sql_filter_group+" GROUP BY id, ztl_group, type, start, end ORDER BY type, ztl_group";
	} else {
		var tmp_query = "SELECT id, ztl_group, type, start, end FROM ztl_my_visit GROUP BY id, ztl_group, type, start, end ORDER BY type, ztl_group";
	}
	
	console.log("premapiranje --- sql 1: "+tmp_query);
	
    var tmp_callback   = "my_visit_success";
    generate_query(tmp_query, tmp_callback);
}

function load_my_visit_settings() {
	var res  = {};
	
	var tmp_user = check_user();

	if (tmp_user != false) {
		res.logged_id = 1;
		res.user 	  = check_user();
	} else {
		//alert
	}

	load_page(template_lang+'my_visit_settings.html', 'my_visit_settings', res, 'fade', false);
}

function check_user() {
	var ztl_user = localStorage.getItem('my_visit_ztl_user');
	
	if (ztl_user != null) {
		ztl_user = JSON.parse(ztl_user);

		return  ztl_user;
	} else {
		return false;
	}
}

function my_visit_sync() {
	if (check_user() != false) {
		web_login(0);
	} else {
		load_my_visit_settings();
	}
}

function delete_from_my_visit(id, group) {
	var tmp_query = "DELETE FROM ztl_my_visit WHERE id = "+id+" AND ztl_group = "+group;
    var tmp_callback   = "delete_from_my_visit_success";
    generate_query(tmp_query, tmp_callback);
}

function clear_field(field) {
	$("#"+field).val("");
}

function web_login(sync) {
	only_login = sync;

	var networkState = navigator.network.connection.type;
	if (networkState == Connection.NONE) {
		navigator.notification.confirm(
				no_data_connection_desc_translation[settings.id_lang],
				null,
		        synchronization_translation[settings.id_lang],
		        ok_translation[settings.id_lang]
		    );
	} else {
		var username = $("#my_visit_username").val();
		var password = $("#my_visit_password").val();
		
		var url = server_url + 'si/mobile_app/service.json?action=login&u='+username+'&p='+password;
	
		$.ajax( {
			url : url,
			dataType : 'json',
			beforeSend : function(xhr) {
		          xhr.setRequestHeader("Authorization", "Basic RWlqdTN6YW86dXRoMWplaUY=");
			},
			error : function(xhr, ajaxOptions, thrownError) {
				//napaka
				console.log(" >>>>>>>>>> failed "+url);
				console.log(JSON.stringify(thrownError));
			},
			success : function(data) {
				handle_web_login(data);
			}
		});
	}
}

function handle_web_login(res) {
	if (res.success == 1) {
		//nastavim localstorage
		var ztl_user = {};

		ztl_user.username = $("#my_visit_username").val();
		ztl_user.password = $("#my_visit_password").val();


		localStorage.setItem('my_visit_ztl_user', JSON.stringify(ztl_user));

		//tu se bodo se sinhronizirali podatki
		sync_my_visit(res);
	} else {
		$("#my_visit_password").val("");
		navigator.notification.confirm(
				login_failed_translation[settings.id_lang],
				null,
		        my_visit_page_title_translation[settings.id_lang],
		        ok_translation[settings.id_lang]
		);	
	}
} 

function sync_my_visit(res) {
	var tmp_group = 0;
	res = res.myVisit.ref_object;
	console.log("JSON="+JSON.stringify(res.myVisit));

	if (only_login == 0) {
		clear_my_visit();

		for (var i = 0; i<res.length; i++) {
			tmp_group = get_mobile_group(res[i].ref_object_type);
			add_to_my_visit(res[i].ref_object, tmp_group, res[i].ref_object_date_type, res[i].ref_object_start, res[i].ref_object_end, 1);
		}

		my_visit_transfer_complete();
	}

	//rediractam na my_visit
	load_my_visit();
}

function add_to_myvisit(res) {
	for (var i = 0; i<res.items.length; i++) {
		add_to_my_visit(res.items[i].id, POI_GROUP, 0, 0, 0, 1);
	}

	my_visit_transfer_complete();

	load_my_visit();
}

function get_mobile_group(object_type) {
	var tmp_group = 0;

	if (object_type == ZTL_EVENT_GROUP) {
		tmp_group = EVENT_GROUP;
	} else if (object_type == ZTL_TOUR_GROUP) {
		tmp_group = TOUR_GROUP;
	} else if (object_type == ZTL_POI_GROUP) {
		tmp_group = POI_GROUP;
	}

	return tmp_group;
}

function web_user_logout() {
	//zbrisem userja iz localstorage
	localStorage.removeItem('my_visit_ztl_user');

	//spraznim tabelo my_visit
	clear_my_visit();
}

function clear_my_visit() {
	tmp_query = "DELETE FROM ztl_my_visit";
	db.transaction(function(tx) {
		 tx.executeSql(tmp_query, [], function(tx, res_poi) {
		 	//redirectam na login
		 	load_my_visit();
		 });
	});
}

function my_visit_settings_menu_toggle() {
	if (check_user() != false) {
		$('.my_visit_logout_menu').show();
	} else {
		$('.my_visit_logout_menu').hide();		
	}

	$(".event_filter").toggle();
	
	$(".ztl_content").toggle();
	$(".header").toggle();
	$(".footer").toggle();
	
	if ($('.event_filter').is(':visible')) {
		my_visit_filter = 1;
	} else {
		my_visit_filter = 0;		
	}
}

function add_inspire_to_my_visit(id) {
	var tmp_query = "SELECT zic.ref_object, zic.ref_object_type, zic.ref_object_date_type FROM ztl_inspired_category zic WHERE zic.id_inspired = "+id;
	var tmp_group = 0;
	db.transaction(function(tx) {
		 tx.executeSql(tmp_query, [], function(tx, results) {
		 	
		 	var len = results.rows.length;
			for (var i=0; i<len; i++){
				tmp_group = get_mobile_group(results.rows.item(i).ref_object_type);

				add_to_my_visit(results.rows.item(i).ref_object, tmp_group, results.rows.item(i).ref_object_date_type, 0, 0, 1);
		    }

			my_visit_transfer_complete();
		    load_my_visit();
		 });
	});
}

function my_visit_item_date(id, group) {
	var myNewDate = new Date();
	//cordova.exec(null, null, "DatePicker", "show",[{"mode":"date","date":"2013-8-5T12:58:00Z","allowOldDates":false,"allowFutureDates":true}]);
	window.plugins.datePicker.show({
		date : myNewDate,
		mode : 'date', // date or time or blank for both
		allowOldDates : false
		}, function(returnDate) {
			set_my_visit_item_date(returnDate, id, group)
		}
	);	
}

function dprun_myvisit(id, group) {
	if (device.platform != "iOS") {
		 my_visit_item_date(id, group)
	}
}


//TODO - preveri an IOS
function dpend_myvisit(t, id, group) {
	if (device.platform == "iOS") {
		//set_my_visit_item_date($(t).val(), id, group)
		//premaknem datum za en mesec nazaj IOS
        
        var date_array = $(t).val().split("-");
		var date_obj   = new Date(date_array[0], date_array[1]-1, date_array[2]);
        var newMonth   = date_obj.getMonth();
        if (newMonth < 10) {
            newMonth = "0" + newMonth;
        }
     
		var newDate    = date_obj.getFullYear() + "-" + newMonth + "-" + date_obj.getDate();
		set_my_visit_item_date(newDate, id, group)
	}
}

function set_my_visit_item_date(returnDate, id, group){
	if (returnDate.indexOf("-0-") != -1) {
		var newDate = new Date(returnDate.replace("-0-", "-1-"));
	} else {
		var newDate = new Date(returnDate);
		newDate = new Date(new Date(newDate).setMonth(newDate.getMonth()+1));
	}
	
	var time = newDate.getTime() / 1000;

	var tmp_query = "UPDATE ztl_my_visit SET start = "+time+" WHERE id = "+id+" AND ztl_group = "+group;
	db.transaction(function(tx) {
		 tx.executeSql(tmp_query, [], function(tx, results) {
		    load_my_visit();
		 });
	});
}

function my_visit_get_event_date(id, start) {
	evt_id 			 = id;
	evt_start		 = start;
	event_time_array = [];

	var d = new Date();
	d.setHours(0,0,0,0);
	var current_time = parseInt(d.getTime()/1000);

	var tmp_query 	 = "SELECT et.date_first, et.date_last, strftime('%H', date_first) AS hour FROM ztl_event_timetable et WHERE et.id_event = "+id+" AND et.id_language = "+settings.id_lang+" AND et.date_last >= "+current_time+" ORDER BY date_first ";

	var date_first 		= 0;
	var date_last  		= 0;
	
	var counter			= 0;
	var tmp 			= {};
	db.transaction(function(tx) {
		 tx.executeSql(tmp_query, [], function(tx, results) {
		 	var len = results.rows.length;
		 	var selector;
			for (var i=0; i<len; i++){
				tmp = {};

				date_first = parseInt(results.rows.item(i).date_first);
				date_last  = parseInt(results.rows.item(i).date_last);
				
				if (results.rows.item(i).hour == "12") {
					selector = "date";
				} else {
					selector = "date and time";
				}

				if (date_first < current_time) {
					date_first = current_time;
				}

				if (date_first == date_last) {	
					if (date_first >= current_time) {
						tmp.date_int = date_first;
						tmp.date_str = "";
						tmp.selector = selector;

						event_time_array[counter] = tmp;
						counter++;
					}
				} else {
					while (date_first<date_last) {
						tmp = {};

						tmp.date_int = date_first;
						tmp.date_str = "";
						tmp.selector = selector;

						event_time_array[counter] = tmp;
						counter++;

						date_first = date_first + 86400;
					}
				}
		    }

		    eta_count = event_time_array.length;
		    for (var eta=0; eta<eta_count; eta++) {
		    	parse_time(event_time_array[eta].date_int, event_time_array[eta].selector, eta);
		    }

		 });
	});
}

function render_time() {
	var tmp_id 	  	= "";
	var hide_time 	= 0;
	
	$("[id^=non_formated_]" ).each(function() {

		if ($(this).val() > 0) {
			tmp_id = $(this).attr('id').substring(4, $(this).attr('id').length);
			
			var n = $(this).attr('id').indexOf("event");
			if (n > 0){
				hide_time = 0;

				if ($("#hour_"+tmp_id).val() == "12") {
					hide_time = 1;
				}
			} else {
				hide_time = 1;
			}

			format_date($(this).val(), tmp_id, hide_time);
		}
	});
}

function filter_visits (history_filter) {
	var id_filter;

	if (history_filter > -1) {
		id_filter = history_filter;
	} else {
		id_filter = parseInt($("#visit_type").val());

		var history_string = "fun--filter_visits--"+id_filter+"__false";
		add_to_history(history_string);
	}

	skip_filter_cat = 1;

	if (id_filter == EVENT_GROUP) {
		sql_filter_group = EVENT_GROUP;
	} else if (id_filter == TOUR_GROUP) {
		sql_filter_group = TOUR_GROUP;
	} else {
		sql_filter_group  = POI_GROUP;
		sql_filer_poi_cat = id_filter;
	}

	my_visit_filter = 0;
	load_my_visit(0, id_filter);


}

function  my_visit_explain(){
	navigator.notification.confirm(
		my_visit_explain_translation[settings.id_lang],
        null,
        my_visit_download_translation[settings.id_lang],
        ok_translation[settings.id_lang]
	);
}

function parse_time(date_string, selector, index) {
    var date_obj = new Date(date_string*1000);

    navigator.globalization.dateToString(
        date_obj,
    function (date) {
       event_time_array[index].date_str = date.value;
       verify_parse_finish(index);
    },
    function () {},
    {formatLength:'short', selector:selector}
    );
}

function verify_parse_finish(index) {
	if ((eta_count - 1) == index) {
		var tmp_opt = "";
		var checked = "";
		for (var i=0; i<event_time_array.length; i++) {
			checked = "";
			if (evt_start == event_time_array[i].date_int) {
				checked = "checked";
			}

			tmp_opt += '<div class="my_visit_list my_visit_settings_list">';
			tmp_opt += '<input type="radio" id="event_radio_value_'+i+'" name="event_radio_value" value="'+event_time_array[i].date_int+'" onClick="save_evt_time('+event_time_array[i].date_int+');" '+checked+'/><label for="event_radio_value_'+i+'"> &nbsp;&nbsp'+event_time_array[i].date_str+'</label>';
			tmp_opt += '</div>';
			tmp_opt += '<div class="my_visit_list_settings_border"></div>';
			
		}

		$('.my_visit_event_date_container').html(tmp_opt);
		my_visit_event_date_select_toggle();
	}
}

function save_evt_time(time) {
	var tmp_query = "UPDATE ztl_my_visit SET start = "+time+" WHERE id = "+evt_id+" AND ztl_group = "+EVENT_GROUP;
	db.transaction(function(tx) {
		 tx.executeSql(tmp_query, [], function(tx, results) {
		 	my_visit_event_date_select_toggle();
		    load_my_visit();
		 });
	});
}

function my_visit_event_date_select_toggle() {
	$(".my_visit_event_date_select").toggle();
	
	$(".ztl_content").toggle();
	$(".header").toggle();
	$(".footer").toggle();
}


function reminder_change(sel) {
	localStorage.setItem('reminder', sel);
	reminder_toggle();
}

function reminder_toggle() {
	if ((localStorage.getItem('reminder') == null) || (localStorage.getItem('reminder') == 0)) {
		$("#reminder_on").css('display','none');
		$("#reminder_off").css('display','inline');
	} else {
		$("#reminder_on").css('display','inline');
		$("#reminder_off").css('display','none');		
	}
}