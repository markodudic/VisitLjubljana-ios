var audio_guides;
var lang_has_purchased = 0;
var lang_has_stored    = 0;

function read_audio_guides_settings() {
	var stored_audio_guides = window.localStorage.getItem("audio_guides");
	if (stored_audio_guides == null) {
		var defaults = {"1": {"purchased": "1", "stored": "0"},
						"2": {"purchased": "1", "stored": "1"},
						"3": {"purchased": "1", "stored": "0"},
						"4": {"purchased": "1", "stored": "0"},
						"5": {"purchased": "1", "stored": "0"}};
		localStorage.setItem('audio_guides', JSON.stringify(defaults));
		audio_guides = defaults;
	} else {
		audio_guides = $.parseJSON(stored_audio_guides);
	}
}

function is_purchased_and_stored(){
	read_audio_guides_settings();
	//po novem je guide zastonj. ostane koda ce se premislijo
	//lang_has_purchased = audio_guides[settings.id_lang].purchased;
	lang_has_purchased = 1;
	lang_has_stored    = audio_guides[settings.id_lang].stored;
	if (lang_has_purchased == 1 && lang_has_stored == 1) 
		return 1;
	else
		return 0;
}

function load_guide_buy() {
    //za vsak slucaj, ker vcasih na ios v prvem initu ne prebere folderja
    reinit();
	
	if (is_purchased_and_stored() == 1) {
		voice_guide = 1;
		load_page(template_lang+'trips.html', 'trips', trips[VOICE_GROUP], 'fade', false, VOICE_GROUP);
	} else {
		load_page(template_lang+'guide_buy.html', 'guide_buy', trips[VOICE_GROUP], 'fade', false);		
	}
}

//klik na gumb
function buy_guide() {
	var networkState = navigator.network.connection.type;
	if (networkState == Connection.NONE) {
		navigator.notification.confirm(
				no_data_connection_desc_translation[settings.id_lang],
				null,
		        synchronization_translation[settings.id_lang],
		        ok_translation[settings.id_lang]
		    );
		
		load_page(template_lang+'guide_buy.html', 'guide_buy', trips[VOICE_GROUP], 'fade', false);		
	} else {
		show_spinner();
		//sinhronizacija v update.js:644
		update_audio();
		
		//shranimo
		lang_has_purchased = 1;
		lang_has_stored    = 1;
		audio_guides[settings.id_lang]["purchased"] = lang_has_purchased;
		audio_guides[settings.id_lang]["stored"]    = lang_has_stored;
		localStorage.setItem('audio_guides', JSON.stringify(audio_guides));
		
		
		//zrendramo na novo
		load_guide_buy();
	}
}