console.log('This would be the main JS file.');
var detail_data = {"facility":{"id":"491","name":"\u5c3e\u5f35\u753a\u8001\u8217\u4ea4\u6d41\u9928","summary":"\u4e00\u822c\u306b\u7121\u6599\u958b\u653e\u3055\u308c\u3066\u3044\u308b\u65e7\u5546\u5bb6\u3092\u5fa9\u5143\u3057\u305f\u5927\u6b63\u6d6a\u6f2b\u306e\u5efa\u7269\u3002","address":"\u91d1\u6ca2\u5e02\u5c3e\u5f35\u753a1-11-11","tel":"076-234-6666","fax":"076-234-6666","email":"shinise@owaricho.or.jp","opening_hours":"\u5348\u524d9\u6642\u304b\u3089\u5348\u5f8c5\u6642\u307e\u3067","closed_days":"\u706b\u66dc\u65e5\u3001\u5e74\u672b\u5e74\u59cb","fee":"\u7121\u6599","note":"","url":"http:\/\/www.owaricho.or.jp\/mda.php?url=shinise","coordinates":{"latitude":36.5713409,"longitude":136.6593657},"genres":[{"id":1,"name":"\u89b3\u5149","subgenre":{"id":1,"name":"\u7f8e\u8853\u9928\u30fb\u535a\u7269\u9928"}}],"zipcode":"920-0902","medias":{"images":[],"videos":[],"audios":[]}}}; 

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

	// make url "yahoo! pipes".
	// enable only "?..." parameter "&..." is diabled.
	//var url = "http://pipes.yahoo.com/ouseful/jsonproxy?url="+
	//var url = "http://pipes.yahoo.com/mtyskazu/jsonproxy?url="+
	//encodeURIComponent(requestURL)+
	//"&_render=json&_callback=?";
	//console.log(url);
	//$.getJSON(url, function(data) {
		//callback(data.value.items[0]);
	//});
	ajaxObj = $.ajax({
		url: requestURL,
		type: 'GET',
		cache: false,
		success: function(data) {
			var text = $(data.responseText).text().trim();
			var json = JSON.parse(text || 'null');	// prepare for 'empty' data
			//var json = $.parseJSON(text||'');
			//console.log('url',requestURL);
			//console.log('text',text);
			console.log('json',json);
			
			if (json) {
				callback(json);
			} else {
				console.log('ajax json error');
				apiQuery(requestURL, callback);
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			// 通常はここでtextStatusやerrorThrownの値を見て処理を切り分けるか、
			// 単純に通信に失敗した際の処理を記述します。
			this; // thisは他のコールバック関数同様にAJAX通信時のオプションを示します。
			//console.log('apiQuery error', XMLHttpRequest, textStatus, errorThrown);
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
			console.log(key, val);
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
	console.log('abort');	

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
				//$('.carousel').carousel();
				slide_event();
			}
		});
	}
	facility(url);
}

function detail(id) {
	
	if (undefined== facilities[id].facility) {
		console.log('detail facility undefinded');
		apiQuery(facilities[id].detail_url, function(data) {
			console.log(data.facility.id, data.facility);
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
	//var exist = (-1!= $('#'+id+' p').text().indexOf('email'));
	//if ((undefined!= facilities[id].facility)&& (false== exist)) {
		//var data = facilities[id];
		//var text = '<br/>email: '+data.facility.email+'<br/>'+	
			//'opening hours: '+data.facility.opening_hours+'<br/>'+
			//'closed days: '+data.facility.closed_days+'<br/>'+data.facility.summary;
		//$('#'+id+' p').append(text);
	//}
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
	//var discripton = '<p>'+item.address+'<br/>TEL: '+item.tel+'</p></div></div>';
	var discripton = '<p style=\"float: left\">'+item.address+'<br/>TEL: '+item.tel+'</p>';
	var button = '<button type=\"button\" class=\"btn-detail btn-inverse\" data-toggle=\"collapse\" data-target=\"#btn-'+item.id+'\" data-loading-text=\"Loading...\">info</button>';
	var collapse = '<div id=\"btn-'+item.id+'\" class=\"collapse\"></div></div></div>';
		
	$('.carousel-inner').append(img+caption+discripton+button+collapse);
	$('.item').eq(0).addClass('active');
	map($('.item').eq(0).attr('id'));
}

//function appendItem(key, item) {

	//var img = '<div class=\"item\" id=\"'+item.id+'\">';
	//var caption = '<div class=\"carousel-caption\"><h4>' + item.name + '</h4>';
	
	//if (item.url) {
		//img += '<a href=\"' + item.url + '\"><img src=\"' + 
			//'http://capture.heartrails.com/large?' + encodeURIComponent(item.url) + '\"></a>';
	//} else {
		//img += '<div class="maps"></div>';
		
		//apiQuery(item.detail_url, function(data) {
			//console.log(item.detail_url, data);
			//// description
			//var text = '<br/>email: '+data.facility.email+'<br/>'+	
			//'opening hours: '+data.facility.opening_hours+'<br/>'+
			//'closed days: '+data.facility.closed_days+'<br/>'+data.facility.summary;
		
			////var pos = {id: data.facility.id, lat: data.facility.coordinates.latitude, lng: data.facility.coordinates.longitude};	
			////map.push(pos);
			//map[data.facility.id] = {lat: data.facility.coordinates.latitude, lng: data.facility.coordinates.longitude};
			
			////maps($('#'+data.facility.id).find('.maps'), data.facility.coordinates.latitude, data.facility.coordinates.longitude);
			//$('#'+data.facility.id).find('p').append(text);
			
			////var c = $('.carousel-caption h4:contains("'+name+'")');	
			////$(c).parent().find('p').append(text);
			////maps('#maps'+data.facility.id, lat, lng);
		//});
	//}
	//var obj = item.address + '<br/>TEL: ' + item.tel;
	//var discripton = '<p>' + obj + '</p></div></div>';
	//$('.carousel-inner').append(img+caption+discripton);
	//$('.item').eq(0).addClass('active');
//}

function items_click() {
	
	$(document).on('click','.item a', function(event) {
		console.log($(this).attr('href'));
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

//function capture(id) {
	
	//var imgElement = $('#'+id+' img');
	//if (imgElement.size()&& (0== imgElement.children().size())) {
		
	//}
//}

function map(id) {
	
	var mapElement = $('#'+id+' .maps');
	if (mapElement.size()&& (0== mapElement.children().size())) {
		//mapDisplay(mapElement, id); 
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

	// slide start
	$('.carousel').on('slide', function(event) {
		console.log(event);
		if (undefined!= event.relatedTarget) {
			facilityID = event.relatedTarget.id;
		}
		//detailDisplay(facilityID);
	});
	// slide end
	$('.carousel').on('slid', function(event) {
		//capture(facilityID);
		map(facilityID);
		
		//var mapElement = $('#'+facilityID+' .maps');
		//if (mapElement.size()&& (0== mapElement.children().size())) {
			//map(mapElement, facilityID); 
		//}
		//// prepare for next map
		//var next = $('#'+facilityID).next().attr('id');
		//detail(next);
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

