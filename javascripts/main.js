
var ajaxObj;
var facilityID;
var facilities = [];

$(document).ready(function(){

	genres();
	genres_click();	
	items_click();
	info_click();
});

function makeURL(site, path, params) {
	
	// site + path
	$.each(path, function(i, val) {
		site += '/' + val;
	});
	// site + path + params	
	if (params) { 
		site += '?';
		for (key in params) {
			site += key + '=' + params[key] + '&';
		}
	}
	site = site.substring(0, site.length-1);	
	return site;
}

function apiQuery(requestURL, callback) {

	ajaxObj = $.ajax({
		url: requestURL,
		type: 'GET',
		cache: false,
		success: function(data) {
			var text = $(data.responseText).text().trim();
			var json = JSON.parse(text || 'null');	// prepare for 'empty' data
			
			if (json) {
				callback(json);
			} else {
				apiQuery(requestURL, callback);
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			// 通常はここでtextStatusやerrorThrownの値を見て処理を切り分けるか、
			// 単純に通信に失敗した際の処理を記述します。
			this; // thisは他のコールバック関数同様にAJAX通信時のオプションを示します。
		}
	});
	
}
// create sidebar-nav
function genres() {
	
	// make list	
	var site = 'https://infra-api.city.kanazawa.ishikawa.jp/v1';
	var path = ['genres', 'list.json']; 
	var params = {lang: 'ja'};
	
	apiQuery(makeURL(site, path, params), function(data) {
		var content = data.genres;
		// li nav-header
		var li = '<li class=\"nav-header\">genres</li>';
		$.each(content, function(key, val) {
			li += '<li><a href=\"'+val['id']+'\">'+val['name']+'</a></li>';
		});
		$('.nav.nav-list')[0].innerHTML = (li);
		// active
		$('.nav-header').next().attr('class', 'active');
		// 
		search($('.nav.nav-list .active a').attr('href'));
	});
}

function genres_click() {

	$(document).on('click', '.nav-list li a', function(event) {
		// prevent page jump
		event.preventDefault();
		// change 'active'
		$('.nav-list').children().removeClass('active');
		$(this).parent().addClass('active');
		// search	
		search($(this).attr('href'));	
	});
}

function search(genre) {
	
	var site = 'https://infra-api.city.kanazawa.ishikawa.jp/v1';
	var path = ['facilities', 'search.json']; 
	var params = {lang: 'ja', genre: genre, count: 50};
	var url = makeURL(site, path, params);
		
	// ajax abort
	ajaxObj.abort();

	// search initialise
	$('.carousel').carousel('pause');
	$('.carousel-control').css('display', 'none');
	indicator($('.span9'), true);
	slide_event_off();
	
	// query facility
	facilities = {};
	$('.item').remove();
	function facility(url) {
			
		apiQuery(url, function(data) {
			$.each(data.facilities, function(key, val) {
				items(val);	
			});
			// next_page	
			if (undefined!= data.next_page) {
				facility(data.next_page);
			} else {
				$('.carousel').carousel('cycle');
				$('.carousel-control').css('display', 'inline');
				indicator($('.span9'), false);
				slide_event();
			}
		});
	}
	facility(url);
}

function detail(id) {
	
	if (undefined== facilities[id].facility) {
		apiQuery(facilities[id].detail_url, function(data) {
			facilities[data.facility.id].facility = data.facility;
			detailDisplay($('#btn-'+id), id);
		});
		return true;
	}
}

function detailDisplay(element, id) {

	var exist = (-1!= element.text().indexOf('email'));
	if ((undefined!= facilities[id].facility)&& (false== exist)) {
		var data = facilities[id];
		var text = 'email: '+data.facility.email+'<br/>'+	
			'opening hours: '+data.facility.opening_hours+'<br/>'+
			'closed days: '+data.facility.closed_days+'<br/>'+data.facility.summary;
		element.append(text);
		element.css('height', 'auto');
		$('#'+id+' button').button('reset');
		
	}
}

function items(item) {

	facilities[item.id] = {detail_url: item.detail_url, coordinates: item.coordinates}; 

	var img = '<div class=\"item\" id=\"'+item.id+'\">';
	if (item.url) {
		var url =  'http://capture.heartrails.com/large?'+encodeURIComponent(item.url);
		img += '<a href=\"' + item.url + '\"><img src=\"'+url+'\"></a>';
	} else {
		img += '<div class="maps"></div>';
	}		
	var caption = '<div class=\"carousel-caption\"><h4>'+item.name+'</h4>';
	var discripton = '<p style=\"float: left\">'+item.address+'<br/>TEL: '+item.tel+'</p>';
	var button = '<button type=\"button\" class=\"btn-detail btn-inverse\" data-toggle=\"collapse\" data-target=\"#btn-'+item.id+'\" data-loading-text=\"Loading...\">info</button>';
	var collapse = '<div id=\"btn-'+item.id+'\" class=\"collapse\"></div></div></div>';
		
	$('.carousel-inner').append(img+caption+discripton+button+collapse);
	$('.item').eq(0).addClass('active');
	map($('.item').eq(0).attr('id'));
}

function items_click() {
	
	$(document).on('click','.item a', function(event) {
		window.open($(this).attr('href'), '_blank');
		event.preventDefault();
	});
}

function info_click() {

	$(document).on('click','.item button', function(event) {
		var id = $(this).attr('data-target').replace('#btn-', '');
		if (-1!= $('#btn-'+id).attr('class').indexOf('in')) {
			if (detail(id)) {
				$(this).button('loading');	
			}
		}
	});
}

function map(id) {
	
	var mapElement = $('#'+id+' .maps');
	if (mapElement.size()&& (0== mapElement.children().size())) {
		if (undefined!= facilities[id].coordinates) {
			mapElement.GoogleMaps({
				icon_type: 'greenDot',
				lat: facilities[id].coordinates.latitude, 
				lng: facilities[id].coordinates.longitude, 
				zoom: 15
			});
		}
	}
}

function slide_event() {

	$('.carousel').on('slide', function(event) {
		if (undefined!= event.relatedTarget) {
			facilityID = event.relatedTarget.id;
		}
	});
	$('.carousel').on('slid', function(event) {
		map(facilityID);
	});
}

function slide_event_off() {
	$('.carousel').off('slide');
	$('.carousel').off('slid');
}

function indicator(element, value) {
	
	if (value) {
		element.activity();
		$(element.children()[0]).css('z-index', 1);
	} else {
		element.activity(false);
	}
}

