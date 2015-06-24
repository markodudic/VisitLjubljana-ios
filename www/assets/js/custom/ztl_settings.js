function load_current_settings() {
	load_page(template_lang+'ztl_settings.html', 'ztl_settings', settings, 'fade', false);
}

function choose_language() {
	load_page('select_language.html', 'select_language', null, 'fade', false, 0);
}

function synhronization(){
	load_page(template_lang+'ztl_synhronization.html', 'ztl_synhronization', null, 'fade', false);
}

function rate() {
	if (device.platform == "iOS") {
	   window.open('itms-apps://itunes.apple.com/us/app/domainsicle-domain-name-search/id511364723?ls=1&mt=8','_system'); 
	} else {
	   window.open('market://details?id=com.innovatif.visitljubljana','_system');
	}
}

function about(){
	load_page(template_lang+'ztl_about.html', 'ztl_about', null, 'fade', false);
}
