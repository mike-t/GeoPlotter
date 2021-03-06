// ============================================
// Geoplotter API v.3.0
// ============================================
// AUTHOR: Michael Walton
// UPDATED: 12.04.2011
//
// COPYRIGHT: Michael Walton & Google
// TODO: See index.php
//
// DESC: Uses Google Maps API v3 for styled spatial 
// data mapping.
//
// USAGE: GeoPlotter(instanceName)
//
// NOTES: Uses a traditional OO approach to code
//	  rather than protoypting. Users of this
// 	  class will 99% of the time only creating
//	  1 instance of the class and therefore
// 	  memory advantages of prototyping are a
//	  moot point at this stage of the project.
//
// ============================================

// ============================================
// GEOPLOTTER OBJECT CONSTRUCTOR
// ============================================
// We create an instance name only for the html 
// onclick events, annoying but necessary until
// I'm enlightened of a neat, cross browser
// alternative.
// ============================================
function GeoPlotter(instanceName, temp_search_html) {

	// ========================================
	// TURN ON OR OFF DEBUGGING (DEFAULT)
	// Use setDebug to change this mode.
	//
	// WARNING: Significantly increases loading
	// time.
	// Have disabled some success messages to
	// mitigte this. MW 11/04/2011
	// ========================================
	var debug = false;

	// ========================================
	// OUR HOME LOCATION (To be autodetected later)
	// ========================================
	var home_location_string = 'Tower of London';
	// create the home location array
	var home_location = {"ID":"HOME","TYPE":"HOME","NAME":"My Home","LATITUDE":null,"LONGITUDE":null,"DISTANCE":null,"ADDR1":"","POSTCODE":"Tower of London","WEBSITE":""};

	// ========================================
	// INITIALISE PRIVATE PROPERTIES
	// (Global to this object constructor only)
	// ========================================
	var self = this;
	var our_locations = [];
	var markers = [];
	var remaining_markers;
	var map;
	var geocoder;
	var UKBounds;
	var directionDisplay;
	var directionsService;
	var infowindow;
	var loc_image;
	var home_image;
	var circle;
	var radius = '';
	var minZoom = 6;
	var first_run = true;
	
	// the ids for various created html elements
	var randSuffix = randomString();		// create a random suffix for the various created html elements
	var div_map = 'div-map_' + randSuffix;
	var div_directions = 'div-directions_' + randSuffix;
	var div_accordion = 'div-accordion_' + randSuffix;
	var div_tabs = 'tabs_' + randSuffix;
	var tab_locations = 'tab-locations_' + randSuffix;
	var tab_filter = 'tab-filter_' + randSuffix;
	var tab_directions = 'tab-directions_' + randSuffix;
	var tab_directions_li = 'tab-directions-li_' + randSuffix;
	var form_search = 'form-search_' + randSuffix;
	var input_search_radius = 'input-search-radius_' + randSuffix;
	var input_home_location = 'input-home-location_' + randSuffix;
	//var input_search_criteria = 'input_search_radius_' + randSuffix;	// FOR LATER USE

	// default Geoplotter style to apply to Google map
	var mapStyle = [				
	  {
		featureType: "all",
		stylers: [
		  { visibility: "off" }
		]
	  },{
		featureType: "landscape",
		stylers: [
		  { hue: "#b7b7b7" },
		  { saturation: -100 },
		  { lightness: -70 }
		]
	  },{
		featureType: "water",
		elementType: "all",
		stylers: [
		  { visibility: "simplified" },
		  { hue: "#ffffff" },
		  { saturation: -100 },
		  { lightness: 100 }
		]
	  }
	];
	
	// ========================================
	// INITIALISE PUBLIC PROPERTIES
	// ========================================
	this.dataConnector = '';	// the path to the data connector to use with GeoPlotter
	this.mapElement = '';		// the id of the html element to populate with the map itself
	this.UIElement = '';		// the id of the html element to populate with the GeoPlotter user interface
	
	// ========================================	
	// PUBLIC CONSTUCTORS FOR PRIVATE METHODS
	// ========================================
	this.getLocations = getDataSource_AJAX;

	// ========================================
	// INITIALISE METHOD (PUBLIC/PRIVILEGED)
	// ========================================
	// Initiliases GeoPlotter map and places home
	// and initial locations on it.
	// Also creates various map related objects 
	// and services for later use.
	// ========================================
	this.initialise = function () {
		
		// check we have required arguments to begin...
		if (checkRequirements()) {

			// create the map user interface 
			createMapUI(self.mapElement);

			// create the controls user interface 
			createControlUI(self.UIElement);

			// show the loading message
			showLoading();
			
			// set the options for the map
			var myOptions = {
				mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'myStyle'],
				panControl: false,
				zoomControl: false,
				mapTypeControl: false,
				scaleControl: false,
				streetViewControl: false,
				minZoom: minZoom
			};
			
			// create a new map
			map = new google.maps.Map(document.getElementById(div_map), myOptions);
			
			// create a geocoder for converting addresses to locations
			geocoder = new google.maps.Geocoder();

			// set the options for the directions renderer
			var rendererOptions = {
				preserveViewport: true,
				suppressMarkers: true,
				draggable: false,
				polylineOptions: {
					clickable: false,
					strokeColor: '#ffffff',
					strokeOpacity: 0.6,
					strokeWeight: 1
				}
			};

			// create new directions service and renderer
			directionsService = new google.maps.DirectionsService();
			directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
			    
			// create map boundaries for the UK and fit to boundary
			var UKSouthWest = new google.maps.LatLng(49.8527,-10.6512);
			var UKNorthEast = new google.maps.LatLng(59.4790,1.8787);
			UKBounds = new google.maps.LatLngBounds(UKSouthWest,UKNorthEast);
			map.fitBounds(UKBounds);
			
			// set the default GeoPlotter map style
			self.setMapStyle(mapStyle);

			// create our infowindow object to be used by the markers
			//infowindow = new google.maps.InfoWindow();
			
			// create the circle to be used for highlighting search areas.
			circle = new google.maps.Circle();
						
			// place the home location value in the text field
			document.getElementById(input_home_location).value = home_location_string;
			
			// initilise the home location, this will fire off the first 
			// data run when complete
			initiliaseHome();
					
			// Listener - Keep people within the map boundaries 
			// TODO: a little crude, would be better to calculate nearest allowed
			// edge and bounce them back there rather than middle.
			google.maps.event.addListener(map, 'bounds_changed', function() {
				if(!map.getBounds().intersects(UKBounds)){
					map.panToBounds(UKBounds);
				}
			});
		
		}
	}
	
	// ========================================
	// SET DEBUG (PUBLIC/PRIVILEGED)
	// ========================================
	// Sets debug mode and outputs to the chosen
	// html element id.
	//
	// Usage: setDebug(boolean, html_element_id (optional)
	// ========================================
	this.setDebug = function (onoff, html_element_id) {
		if (typeof onoff === 'boolean') {
			debug = onoff;
			debug_div = html_element_id;
		}else{
			showDebug('[FAIL] Invalid parameter supplied for function: setDebug(' +  onoff + ', ' + html_element_id + ')');
		}
	}

	// ========================================
	// SET MAP STYLE (PUBLIC/PRIVILEGED)
	// ========================================
	// name the map style and set it in use
	// See: http://code.google.com/apis/maps/documentation/javascript/maptypes.html#StyledMaps
	//
	// Usage: setMapStyle(googleMapStyle options)
	// ========================================
	this.setMapStyle = function (googleMapStyle) {
		
		// override the defualt/current style
		mapStyle = googleMapStyle;
		
		// name the map and set it in use with provided style
		var styledMapOptions = {name: "GeoPlotter Map"};		
		var myMapType = new google.maps.StyledMapType(mapStyle, styledMapOptions);

		// if the map object exists yet change it's style
		if (typeof map !== 'undefined') {
			map.mapTypes.set('GeoPlotterStyle', myMapType);
			map.setMapTypeId('GeoPlotterStyle');
		}
	}

	// ========================================
	// SET HOME MARKER METHOD (PUBLIC/PRIVILIGED)
	// Sets the styling for the various map markers
	// ========================================
	this.setHomeMarker = function (filepath, width, height) {

		// set the image, size, origin and anchor point for the marker (x,y)
		if ((typeof width === 'number') && (typeof height === 'number')) {
			home_image = new google.maps.MarkerImage(filepath,
				new google.maps.Size(width, height),
				new google.maps.Point(0,0),
				new google.maps.Point(Math.floor(width/2), Math.floor(height/2)));
		}else{
			showDebug('[FAIL] Invalid parameter supplied for function: setHomeMarker(' +  filepath + ', ' + width + ',' + height + ')');
		}
	}
	
	// ========================================
	// SET LOCATION MARKER METHOD (PUBLIC/PRIVILIGED)
	// Sets the styling for the various map markers
	// ========================================
	this.setLocationMarker = function (filepath, width, height) {

		// set the image, size, origin and anchor point for the marker (x,y)
		if ((typeof width === 'number') && (typeof height === 'number')) {
			loc_image = new google.maps.MarkerImage(filepath,
				new google.maps.Size(width, height),
				new google.maps.Point(0,0),
				new google.maps.Point(Math.floor(width/2), Math.floor(height/2)));
		}else{
			showDebug('[FAIL] Invalid parameter supplied for function: setLocationMarker(' +  filepath + ', ' + width + ',' + height + ')');
		}
	}
	
	// ========================================
	// CLEAR DIRECTIONS METHOD (PUBLIC/PRIVILEGED)
	// ========================================
	// Removes directions from interface and map
	// ========================================
	this.clearDirections = function () {
		// select the locations tab
		jQuery('#'+div_tabs).tabs('select', '#'+tab_locations);
		// remove any current direction polyline from map and hide the directions tab
		directionsDisplay.setMap(null);
		document.getElementById(tab_directions_li).style.display = 'none';
	}

	// ========================================
	// GET DIRECTIONS METHOD (PUBLIC/PRIVILEGED) 
	// ========================================
	// Our asynchronous google directions function
	// will provide driving directions to a supplied
	// location index.
	// ========================================
	this.getDirections = function (loc_index) {
		
		// grab the destination location from our location array
		var dest_loc = our_locations[loc_index];

		// check that this loation was plotted on the map
		if (dest_loc.PLOTTED) {
			// grab our endpoints for the journey
			var start = document.getElementById(input_home_location).value;
			var end = new google.maps.LatLng(dest_loc.LATITUDE, dest_loc.LONGITUDE);

			// create our directions request options
			var request = {
				origin:start, 
				destination:end,
				provideRouteAlternatives: false,
				travelMode: google.maps.DirectionsTravelMode.DRIVING,
				unitSystem: google.maps.DirectionsUnitSystem.IMPERIAL
			};
			
			// create our callback function to plot the directions on the map when the info arrives
			directionsService.route(request, function(result, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					
					var directionsHTML;
					
					// set the map for the directions display object
					directionsDisplay.setMap(map);
					
					// we got the directions, show them on the map and list each step in the directions div
					directionsDisplay.setDirections(result);
					
					// custom printing of directions in our div (need to add travel distance and times in ;)
					directionsHTML = "<div style=\"font-weight: bold;\">" + dest_loc.NAME + "</div>";
					directionsHTML += "<div style=\"font-style: italic;\">" + result.routes[0].legs[0].distance.text + " - estimated " + result.routes[0].legs[0].duration.text + "</div>";
					directionsHTML += result.routes[0].warnings;
					directionsHTML += "<ol>\n";
					for (var i = 0; i < result.routes[0].legs[0].steps.length; i++) {			
						directionsHTML += "\n<hr />\n<li>" + result.routes[0].legs[0].steps[i].instructions + "</li>\n";
					}
					directionsHTML += "\n</ol>";

					// must display copyrights here ??
					// add the directions and show the directions tab
					document.getElementById(div_directions).innerHTML = directionsHTML;
					document.getElementById(tab_directions_li).style.display = "list-item";
					jQuery('#'+div_tabs).tabs('select', '#'+tab_directions);

				}else{
					// couldn't find directions, display a friendly if vague error
					document.getElementById(div_directions).innerHTML = "<div class=\"warning\"><div class=\"warning-img\"></div><div class=\"warning-txt\"><h5>NO DIRECTIONS FOUND</h5>Could not find directions to this location!</div>";
					document.getElementById(tab_directions_li).style.display = "list-item";
					jQuery('#'+div_tabs).tabs('select', '#'+tab_directions);
					
					// remove any current direction polyline from map
					directionsDisplay.setMap(null);
				}
			});
		}else{
			// display message to user that this location is not plotted and show the directions tab
			document.getElementById(div_directions).innerHTML = "<div class=\"warning\"><div class=\"warning-img\"></div><div class=\"warning-txt\"><h5>NO DIRECTIONS FOUND</h5>This location is not plotted on the map.</div>";
			document.getElementById(tab_directions_li).style.display = "list-item";
			jQuery('#'+div_tabs).tabs('select', '#'+tab_directions);
		}
	}

	// ========================================
	// SHOW MARKER METHOD (PUBLIC/PRIVILEGED)
	// ========================================
	// Zoom to a supplied marker index (if not 
	// at full zoom) and make it bounce.
	// ========================================	
	this.showMarker = function (loc_index) {
		
		// grab the clicked location from our location array
		var clicked_loc = our_locations[loc_index];

		// check that this loation was plotted on the map
		if (clicked_loc.PLOTTED) {
			// if not at minzoom then pan to marker
			if (map.getZoom() > minZoom) map.panTo(markers[clicked_loc.ID].getPosition());
			// make the marker bounce so we can identify it
			markers[clicked_loc.ID].setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {markers[clicked_loc.ID].setAnimation(null); }, 600);
		}else{
			alert('This location is not plotted on the map!');
		}
	}

	// ========================================
	// SET HOME METHOD (PUBLIC/PRIVILEGED)
	// ========================================
	// Set the location of the users 'home'
	// geocodes the user input to coordinates
	// and resets markers in accordance to 
	// search criteria.
	// ========================================	
	this.setHome = function () {
		
		// show loading message
		showLoading();
		
		// geocode the home location manaully (not using the geocode function as this is a little more customised)
		geocoder.geocode({ 'address': document.getElementById(input_home_location).value, 'bounds': UKBounds}, 
			function(results, status) {	
				if (status == google.maps.GeocoderStatus.OK) {
					// set the latitude longitude on callback for the original location and recall addMarker()
					var home = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
					markers.HOME.setPosition(home);

					// update the home location's longitude and latitude
					home_location.LATITUDE = results[0].geometry.location.lat();
					home_location.LONGITUDE = results[0].geometry.location.lng();
														
					// reset the map in accordance to the new home
					getDataSource_AJAX();
					
				}else{
					// could not find home, alert the user (TODO: modal warning here
					alert("Could not find location of '" + document.getElementById(input_home_location).value + "'.\nPlease check the address and try again.");
					
					// display debugging info
					showDebug('[FAIL] Geocoding failed for location: ' +  document.getElementById(input_home_location).value);
				}
			}
		);
	}

	// ========================================
	// CLEAR SEARCH CRITERIA METHOD (PUBLIC/PRIVILEGED)
	// ========================================
	// Clears the search criteria of the 
	// filter form.
	// ========================================
	this.clearSearchCriteria = function () {
		
		// grab all the search criteria
		var criteria = document.getElementsByName('search_criteria');

		// loop through all search criteria and clear it
		for (i in criteria) { criteria[i].checked = false; }

		// clear the search circle
		document.getElementById(input_search_radius).selectedIndex = 0;
		self.setRadius();
		
		// update/refresh the Uniform styled form elements
		jQuery.uniform.update('#'+input_search_radius);
		jQuery.uniform.update('input[name=search_criteria]');

		// gather the data now that form is cleared
		getDataSource_AJAX();
	}

	// ========================================
	// SET RADIUS METHOD (PUBLIC/PRIVILEGED)
	// ========================================
	// draw a circle on the map with the centre 
	// set to home marker location and updates
	// the radius property.
	// ========================================
	this.setRadius = function () {
		// determine cirlce radius from drop down
		var search_radius_drp = document.getElementById(input_search_radius);
		var search_radius = search_radius_drp.options[search_radius_drp.selectedIndex].value * 1609.344;	// 1 mile = 1609.344 metres
		
		// set the radius property
		radius = search_radius_drp.options[search_radius_drp.selectedIndex].value;
		
		// check we have a radius
		if (search_radius) {
		// create the search circle options
			var circleOptions = {	
				clickable: false,
				fillColor: '#3366FF',
				fillOpacity: 0.15,
				strokeColor: '#3366FF',
				strokeOpacity: 0.4,
				strokeWeight: 2,
				center: new google.maps.LatLng(home_location.LATITUDE, home_location.LONGITUDE),
				radius: search_radius,
				map: map
				//zIndex: 10
			};
			
			// set the search circle options (thus placing it on the map)
			circle.setOptions(circleOptions);
		}else{
			// remove circle from map
			circle.setMap(null);
		}
	}

	// ========================================
	// TO STRING METHOD (PUBLIC/PRIVILEGED)
	// ========================================
	// returns string representation of the
	// GeoPlotter object (basic info).
	// ========================================
	this.toString = function () {
		return 'GeoPlotter Object; Locations: ' + markers.length +' Map Boundary: ' + UKBounds.toString();
	};
	
	// ========================================
	// CHECK REQUIREMENTS (PRIVATE)
	// ========================================
	// Checks we have minimum properties set to
	// create the map and it's controls other-
	// wise displays a fatal and message to the 
	// user.
	// ========================================
	function checkRequirements() {
		// requirement check flag 
		var check_ok = true;
		var message = '[FATAL] GeoPlotter requirements check failed!\n<br />The following were not set correctly: ';

		// REQUIRED PROPERTIES:
		// Data Connector
		if ((self.dataConnector === '') || (typeof self.dataConnector !== 'string')) {
			message += 'Property: ' + instanceName + '.dataConnector = string), ';
			check_ok = false;
		}
		
		// Map Element
		if ((self.mapElement === '') || (typeof self.mapElement !== 'string')) {
			message += 'Property: ' + instanceName + '.mapElement = string), ';
			check_ok = false;
		}
		if (!document.getElementById(self.mapElement)) {
			message += 'Property: ' + instanceName + '.mapElement, HTML element \'' + self.mapElement + '\' does not exist!, ';
			check_ok = false;
		}
		
		// UI Element
		if ((self.UIElement === '') || (typeof self.UIElement !== 'string')) {			
			message += 'Property: ' + instanceName + '.UIElement = string, ';
			check_ok = false;
		}
		if (!document.getElementById(self.UIElement)) {
			message += 'Property: ' + instanceName + '.UIElement, HTML element \'' + self.UIElement + '\' does not exist!, ';
			check_ok = false;
		}
		
		// OPTIONAL PROPERTIES

		// tidy message to remove comma and whitespace
		message = message.substring(0, message.length - 2);
			
		// if check failed alert the user, this is fatal.
		if (!check_ok) {
			alert('GeoPlotter Fatal Error\n\nCannot initiliase: missing requirements (see README or use debug mode).');
			showDebug(message + '<br />\nFor more information on usage read the README.');
			return false;
		}
		
		// succcessful check
		return true;
	}

	// ========================================
	// SHOW DEBUG (PRIVATE)
	// ========================================
	// Handles the debugging output if switched on
	function showDebug(message) {
		if (debug) document.getElementById(debug_div).innerHTML += message + '<br />\n';
	}

	// ========================================
	// GET DATA SOURCE AJAX METHOD (PRIVATE)
	// ========================================
	// Currently parameter is optional.
	// Will default to a search if not used.
	// TODO: check IBM website for example, apparently
	// seperate object creation and calling.
	// ========================================
	function getDataSource_AJAX(queryString) {
		// initialise our request object variable
		var XMLRequest;
		var is_search;
		var JSONResponse;
		
		// attempt to do it properly, otherwise do it the MS way...
		try{
			// Opera 8.0+, Firefox, Safari etc
			XMLRequest = new XMLHttpRequest();
		} catch (e){
			// Internet Explorer Browsers
			try{
				XMLRequest = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try{
					XMLRequest = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {
					// Something went wrong (TODO: MODAL HERE)
					alert("GeoPlotter Error\n\nCan't create XML HTTP Request!");
					return false;
				}
			}
		}
		
		// When / if data is returned then display it in specified div
		XMLRequest.onreadystatechange = function() {
			if (XMLRequest.readyState == 4) {
				if (XMLRequest.status == 200) {
					// determine which div to place content into (geocode result or search result)
					if (is_search) {
						// ========================================
						// LOCATIONS RESULT
						// ========================================
						// attempt to JSON parse the results, if not supported by brower try a less secure method
						// TODO: write the fallback method!
						// TODO: put some error handling for the array structure rather than assume array is OK.

						// grab the JSON encoded response, if cannot display an error
						try {
							our_locations.length = 0;
							JSONResponse = XMLRequest.responseText;
							our_locations = JSON.parse(JSONResponse);
						} catch (e) {
							alert('GeoPlotter Error\n\nDid not recieve appropriate response from data connector');
							showDebug('[FATAL] ' + e.message);
							return false;
						}

						// check the result status
						if (our_locations[0][0]) {
						
							// we don't need the status array anymore...get rid
							our_locations.shift();
						
							// display some debugging info
							showDebug('<span style="font-weight: bold">[SUCCESS] Data source provided ' + our_locations.length + ' locations for plotting.</span>');
						
							// fire off the map/interface update with the new locations
							updateMap();
							
						}else{
							// we had an error getting the data...tell the user
							
							// TODO: MODAL HERE
							alert('GeoPlotter Error\n\nData connector error!');
							showDebug(our_locations[0][1]);
							return false;
						}
						
					}else{
						// ========================================
						// GEOCODE RESULT
						// ========================================
						// grab the JSON encoded response, if cannot display an error
						try {
							JSONResponse = XMLRequest.responseText;
							geocode_result = JSON.parse(JSONResponse);
						} catch (e) {
							alert('GeoPlotter Error\n\nDid not recieve appropriate response from data connector');
							showDebug('[FATAL] ' + e.message);
						}
						// check the geocode result and display some debugging info
						if (geocode_result[0]) {
							// display some debugging info for the geocode update
							showDebug(geocode_result[1]);
						}else{
							// TODO: MODAL HERE
							alert('GeoPlotter Error\n\nFatal data connector error!');
							showDebug(geocode_result[1]);
							return false;
						}
					}
				} else {
					// server work failed, alert (TODO: change to modal)
					alert('GeoPlotter Error\n\nHTTP data request failed! (' + XMLRequest.status + ': ' + self.dataConnector + ')');
					return false;
				}
			}
		}

		// if the querystring parameter wasn't passed create the querystring for a search
		if (!queryString) {
			
			// initialise variables
			var search_checkboxes = document.getElementsByName('search_criteria');
			var search_string = '';
			
			// set the search flag
			is_search = true;
			
			// clear the interface and show loading message
			clearInterface();
					
			// loop through all search criteria create a search string
			for (i in search_checkboxes) {
				if (search_checkboxes[i].checked) search_string += search_checkboxes[i].value;
			}
					
			// create querystring		
			queryString = "?action=search&r=" + radius + "&lat=" + home_location.LATITUDE + "&lng=" + home_location.LONGITUDE + "&s=" + search_string;
		
		}

		// make the request
		XMLRequest.open("GET", self.dataConnector + queryString, true);
		XMLRequest.send(null);
	}

	// ========================================
	// CREATE CONTROL UI METHOD (PRIVATE)
	// ========================================
	// Places the UI controls into the specified
	// html element.
	// Will grow into it's own object.
	//
	// DEPENDENCY: jQuery accordion and tabs, 
	// uniform form styling (uniformjs.com).
	// ========================================
	function createControlUI(html_element) {
		
		var UIhtml = '';
		
		UIhtml += '<div id="'+div_tabs+'" class="ui-tabs">\n';
		UIhtml += '\t<ul class="ui-tabs-nav">\n';
		UIhtml += '\t\t<li><a href="#'+tab_locations+'">Locations</a></li>\n';
		UIhtml += '\t\t<li><a href="#'+tab_filter+'">Filter</a></li>\n';
		UIhtml += '\t\t<li id="'+tab_directions_li+'" style="display: none;"><a href="#'+tab_directions+'">Directions</a></li>\n';
		UIhtml += '\t</ul>\n';
		UIhtml += '\t<div id="'+tab_locations+'" class="ui-tabs-panel">\n';
		UIhtml += '\t\t<div id="accordion-filter-message"></div>\n';
		UIhtml += '\t\t<!-- the locations listed in accordian style for space saving -->\n';
		UIhtml += '\t\t<div id="'+div_accordion+'" class="accordion-panel">\n';
		UIhtml += '\t\t</div>\n';
		UIhtml += '\t</div>\n';	
		UIhtml += '\t<!-- our search/filter panel -->\n';
		UIhtml += '\t<div id="'+tab_filter+'" class="ui-tabs-panel">\n';
		UIhtml += '\t\t<h4>My location: \n';
		UIhtml += '\t\t<input type="text" id="'+input_home_location+'" value=""/>&nbsp;<input type="button" value="Update" onclick="'+ instanceName +'.setHome();"/>\n';
		UIhtml += '\t\t</h4>\n';
		UIhtml += '\t\t<!-- Our search criteria form -->\n';
		UIhtml += '\t\t<form method="post" action="./" id="'+form_search+'">\n';
		UIhtml += '\t\t\t<h4>Only show locations with: </h4>\n';
		UIhtml += '\t\t\t<ul>\n';
		UIhtml += '\t\t\t'+temp_search_html;
		UIhtml += '\t\t\t</ul>\n';
		UIhtml += '\t\t\t<h4>Only show locations within: </h4>\n';
		UIhtml += '\t\t\t<select id="'+input_search_radius+'" onchange="'+ instanceName +'.setRadius();">\n';
		UIhtml += '\t\t\t\t<option value="">Any distance</option>\n';
		UIhtml += '\t\t\t\t<option value="20">20 miles</option>\n';
		UIhtml += '\t\t\t\t<option value="50">50 miles</option>\n';
		UIhtml += '\t\t\t\t<option value="100">100 miles</option>\n';
		UIhtml += '\t\t\t\t<option value="200">200 miles</option>\n';
		UIhtml += '\t\t\t</select>\n';
		UIhtml += '\t\t\t<div class="search_buttons">\n';
		UIhtml += '\t\t\t\t<input type="button" value="Apply" onclick="'+ instanceName +'.getLocations();"/>\n';
		UIhtml += '\t\t\t\t<input type="button" value="Clear" onclick="'+ instanceName +'.clearSearchCriteria();"/>\n';
		UIhtml += '\t\t\t</div>\n';
		UIhtml += '\t\t</form>\n';
		UIhtml += '\t</div>\n';
		UIhtml += '\t<div id="'+tab_directions+'" class="ui-tabs-panel">\n';
		UIhtml += '\t\t<div id="'+div_directions+'" class="directions-panel">No directions have been requested.</div>\n';
		UIhtml += '\t</div>\n';
		UIhtml += '</div>\n';
		
		// insert the UI into the HTMl element
		document.getElementById(html_element).innerHTML = UIhtml;
		
		// activate the jQuery tabs
		jQuery('#'+div_tabs).tabs({ fx: { opacity: 'toggle', duration:'fast'} });
		
		// form styling with Uniform
		jQuery('input, textarea, select, button').uniform();
	}
	
	// ========================================
	// CREATE MAP UI METHOD (PRIVATE)
	// ========================================
	// Places the map UI into the specified
	// html element.
	// ========================================
	function createMapUI(html_element) {
		
		// insert the map UI into the HTMl element
		document.getElementById(html_element).innerHTML = '<div id="'+div_map+'" class="map_canvas" style=""></div>\n';
	}
	
	// ========================================
	// INITIALISE HOME (PRIVATE)
	// ========================================
	// Initiliases the home location coords 
	// and fires off the first locations data request
	// ========================================
	function initiliaseHome() {

		// geocode home location here and set the getDataSource_AJAX as the callback
		if ((home_location.LATITUDE == null) || (home_location.LONGITUDE == null)) {

			// geocode home location and callback the getDataSource_AJAX
			geocodeLocation(home_location, function() {getDataSource_AJAX();});
		}else{

			// don't need to geocode, just get some fresh data
			getDataSource_AJAX();
		}
	}

	// ========================================
	// UPDATE MAP METHOD (PRIVATE)
	// Refreshes the map with new locations
	// and updates the interface accordingly
	// ========================================
	function updateMap() {
		
		
		// if not at minzoom then pan to the home marker
		if (map.getZoom() > minZoom) map.panTo(markers.HOME.getPosition());
		
		// add the markers to the map, slowly if it's our first time... I'm not an animal...
		//addMarkers(first_run, true);
		addMarkers(false, false);

		// add the home marker to the map
		addMarker(home_location, false);
			
		// draw the radius cricle if applicable (private calling a public)
		self.setRadius();
		
		// this is not the first run anymore/still (determines if the markers will be dropped slowly or all at once)
		first_run = false;
	}
	// ========================================

	// ========================================
	// LOAD ACCORDION METHOD (PRIVATE)
	// loads accordion content and activates it
	// ========================================
	function loadAccordion() {

		// initialise variables
		var accordion_content = '';
		var distance;

		// create accordion html for all locations but HOME and HQ
		for (i in our_locations) {
			// check this isn't a home or hq location
			if ((our_locations[i].TYPE != 'HOME') && (our_locations[i].TYPE != 'HQ')) {
				
				// use the rounded distance from the data connector if one has been returned
				distance = (our_locations[i].DISTANCE) ? Math.round(our_locations[i].DISTANCE*Math.pow(10,1))/Math.pow(10,1) + ' mi' : 'UNKNOWN';

				accordion_content += '<h5 id="acc_'+our_locations[i].ID+'" class="accordion-panel-header-plain" onclick="'+instanceName+'.showMarker('+i+');"><a href="#">'+our_locations[i].NAME+'</a><span id="acc_'+our_locations[i].ID+'_distance">'+distance+'</span></h5>\n';
				accordion_content += '<div id="acc_content_'+our_locations[i].ID+'" class="accordion-panel-content-plain">\n';
				if (our_locations[i].ADDR1) accordion_content += our_locations[i].ADDR1+'<br />\n';
				if (our_locations[i].ADDR2) accordion_content += our_locations[i].ADDR2+'<br />\n';
				if (our_locations[i].ADDR3) accordion_content += our_locations[i].ADDR3+'<br />\n';
				if (our_locations[i].ADDR4) accordion_content += our_locations[i].ADDR4+'<br />\n';
				if (our_locations[i].POSTCODE) accordion_content += our_locations[i].POSTCODE+'<br />\n';
				if (our_locations[i].TELEPHONE) accordion_content += our_locations[i].TELEPHONE+'<br />\n';
				if (our_locations[i].EMAIL) accordion_content += our_locations[i].EMAIL+'<br />\n';
				if (our_locations[i].WEBSITE) accordion_content += our_locations[i].WEBSITE+'<br />\n';

				// directions and 'show me' buttons		
				accordion_content += '<br /><span class="acc_image" onclick="'+instanceName+'.getDirections('+i+');"><img src="images/direction2.png" width="16" height="16" />Get Directions</span><br />\n';
				accordion_content += '<span class="acc_image" onclick="'+instanceName+'.showMarker('+i+');"><img src="images/show_me.png\" width="16" height="16" />Show me</span>\n';
				accordion_content += '</div>\n';
			}
		}
		
		// update the accordion html
		document.getElementById(div_accordion).innerHTML = accordion_content;
		
		// tell JQuery to create the accordion
		jQuery('#'+div_accordion).accordion({autoHeight: false});
		
		// unbind the normal JQuery accordion click event
		//jQuery('#accordion').unbind('click.ui-accordion');
		
		// a guess at the better function (don't work)
		/*jQuery('#accordion').bind('click', function(event, ui) {
			if (typeof ui.newHeader != 'undefined') { jQuery('#accordion').scrollTo( ui.newHeader ) }
			alert('clicked');
		});*/
		
		// set the accordion to scroll to the active accordion element when it changes 
		// (TODO: can't get it to work for accordionchangestart becuase that is subscribed to the accordion, not the !)
		jQuery('#'+div_accordion).bind('accordionchange', function(event, ui) {
			if (typeof ui.newHeader != 'undefined') { jQuery('#'+div_accordion).scrollTo( ui.newHeader, 800) }
		});
		
		// select/open the locations accordion tab
		jQuery('#'+div_tabs).tabs('select', '#'+tab_locations);
	}

	// ========================================
	// CLEAR INTERFACE METHOD (PRIVATE)
	// Clears map markers and data from interace
	// displays loading message.
	// ========================================
	function clearInterface() {

		// show loading message
		showLoading();
		
		// clear radius circle from map
		circle.setMap(null);
		
		// get rid of any directions (private calling a public)
		self.clearDirections();

		// clear any previous markers from map
		clearMarkers();
		
		// reset the plot status of home location
		home_location.PLOTTED = false;
		
		// destroy the old accordion (man i love that word!)
		jQuery('#'+div_accordion).accordion('destroy');
	}

	// ========================================
	// SHOW LOADING METHOD (PRIVATE)
	// displays loading message in the locations tab
	// ========================================
	function showLoading() {
		// show a loading message in the locations listing tab
		document.getElementById(div_accordion).innerHTML = '<h5 class="accordion-panel-header-warning"><span><img src="images/loading2.gif" />LOADING...</span></h5>\n';
		
		// select/open the locations accordion tab
		jQuery('#'+div_tabs).tabs('select', '#'+tab_locations);
	}

	// ========================================
	// ADD MARKERS METHOD (PRIVATE)
	// adds all markers to the map by dropping them one
	// at a time or all at once (the slow parameter)
	// and with or without the drop animation.
	// ========================================
	function addMarkers(slow, drop) {
		
		// check if we are doing it droppin it slow baby... or not.
		slow = slow || false;
		drop = drop || false;
		
		// reset the remaining markers countdown
		remaining_markers = our_locations.length;

		// check there are actually markers to plot otherwise display a warning message
		if (remaining_markers) {
		
			// check if we are doing the drop slowly	
			if (slow) {
				// drop each marker slowly using a timeout handler function (this creates a function with i set during runtime)
				for (i in our_locations) { 
					setTimeout(addMarkerTimeoutHandler(i, drop), i * 50); 
				}
			}else{
				// drop markers at same time (ignoring gecode delay)
				for (i in our_locations) { 
					// if needed geocode this badboy first and callback to addMarker
					if ((our_locations[i].LATITUDE == null) || (our_locations[i].LONGITUDE == null)) {
							geocodeLocation(our_locations[i], function(original_location) {addMarker(original_location, drop);});
					}else{
						//showDebug('[INFO] Using DB coords for for location: ' + our_locations[i].ID + ' ' + our_locations[i].NAME);
						addMarker(our_locations[i], drop); 
					}
				}
			}
		}else{
			// display an warning in the locations tab
			document.getElementById(div_accordion).innerHTML = '<div class="warning"><div class="warning-img"></div><div class="warning-txt"><h5>NO LOCATIONS FOUND</h5><a class="link" href="#" onclick="'+instanceName+'clearSearchCriteria()"> Click to remove the filter</a> or <a class="link" href="#" onclick="jQuery(\'#'+div_tabs+'\').tabs(\'select\', \'#'+tab_filter+'\');">broaden your search.</a></div></div>'
		}
	}

	// ========================================
	// ADD MARKER METHOD (PRIVATE)
	// Add a customised marker to the map
	// ========================================
	function addMarker(location, drop) {

		drop = drop || false;

		// check the location is not already plotted (can go later, this is for sanity while developing)
		if (!location.PLOTTED) {

			// check we can actually add this marker first...
			if ((location.LATITUDE != null) && (location.LONGITUDE != null)) {
				// create google point from lat/lng
				var myLatLng = new google.maps.LatLng(location.LATITUDE, location.LONGITUDE);

				// decide which marker image to use
				var marker_image;
				switch(location.TYPE) {
					case 'LOC':
						marker_image = loc_image;
						break;
					case 'HOME':
						marker_image = home_image;
						break;
				}

				// determine the z index based on array order (distance)
				// home is always on top
				if (location.ID != 'HOME') {
					var zindex = remaining_markers + 10;
				}else{
					var zindex = our_locations.length + 20;
				}
				
				// determine if we are dropping the marker or not			
				var animation = null;
				if (drop) animation = google.maps.Animation.DROP;
				
				// create a new marker using drop animation or not
				var marker = new google.maps.Marker({
					position: myLatLng,
					map: map,
					icon: marker_image,
					title: location.NAME,
					draggable: false,
					flat: true,
					animation: animation, 
					zIndex: zindex
				});

				// add listener for marker click
				google.maps.event.addListener(marker, 'click', function() {
					// open the associated accordion item (info windows are soooo last year!)
					jQuery('#'+div_accordion).accordion('activate', jQuery('#acc_' + location.ID));
				});
							
				// add listener for marker mouseover
				// TODO: tooltip style to be added here
				/*google.maps.event.addListener(marker, 'mouseover', function() {
				
					// build content for the infowindow (basic for now)
					var info_html = '<div class="infowindow"><h4>'+location.NAME+'</h4>'+location.ADDR1+'<br />'+location.POSTCODE+'<br />'+location.TELEPHONE+'<br />'+location.EMAIL+'<br /><a href="'+location.WEBSITE+'">'+location.WEBSITE+'</a></div>';	
					// open the infowindow
					infowindow.setContent(info_html);
					infowindow.open(map, marker);
				
				});
				*/
				
				// add the marker the the markers array
				markers[location.ID] = marker;
				
				// set the plotted status of this marker to true
				location.PLOTTED = true;

				// add the marker to the map
				//marker.setMap(map);

				// debugging info
				//showDebug('[SUCCESS] Placed marker on map for: ' + location.ID + ' ' + location.NAME);

			}else{
				// failed to plot this location, it has no longitude and latitude		
				location.PLOTTED = false;

				// debugging info
				showDebug('[FAIL] Could not place marker on map (no coords) for: ' + location.ID + ' ' + location.NAME);
			}

			// ARE WE FINISHED YET?
			// tick one more marker off the list (if this isn't the home marker which isn't part of our_locations array)
			if (location.ID != 'HOME') { 
				remaining_markers--;
			
				// if there are no more markers to plot then show sort locations and load them into interface
				if (!remaining_markers) {
					// calculate and sort by distance if required
					calcDistances();

					// load the locations listing into the accordion
					loadAccordion();
				}
			}
		}else{
			// this location is already plotted, show a message thus
			showDebug('[IGNORE] Location marker already exists for: ' + location.ID + ' ' + location.NAME);
		}
	}

	// ========================================
	// ADD MARKER TIMEOUT HANDLER METHOD (PRIVATE)
	// ========================================
	// creates and returns the function used to
	// drop markers slowly. 
	// Necessary to ensure loc_index is set at 
	// runtime rather than on callback.
	// ========================================
	function addMarkerTimeoutHandler(loc_index, drop) {
	    return function(){
			// set default value for drop parameter
			drop = drop || false;
			// if needed geocode this badboy first and callback to addMarker
			if ((our_locations[loc_index].LATITUDE == null) || (our_locations[loc_index].LONGITUDE == null)) {
				geocodeLocation(our_locations[loc_index], function(original_location) {addMarker(original_location, drop);});
			}else{
				//showDebug('[INFO] Using DB coords for for location: ' + our_locations[loc_index].ID + ' ' + our_locations[loc_index].NAME);
				addMarker(our_locations[loc_index], drop);
			}
		};
	}

	// ========================================
	// CLEAR MARKERS METHOD (PRIVATE)
	// does what it says on the tin...
	// clears markers from map and empties the array
	// ========================================
	function clearMarkers() {
		if (markers) {
			for (i in markers) {
				markers[i].setMap(null);
			}
			markers.length = 0;
		}
	}

	// ========================================
	// GEOCODE LOCATION METHOD (PRIVATE)
	// our asynchronous geocode function
	// attempts to geocode a single location.
	// accepts a callback function as a parameter
	// and will return the location to that callback.
	// e.g callback(completedLocation)
	// ========================================
	function geocodeLocation(location, callback) {

		// TODO: do some best effort address choices (i.e address1+2+3, county, postcode
		// create a geocode request for the location's postcode within our bounds
		geocoder.geocode({ 'address': location.POSTCODE, 'bounds': UKBounds}, 
			function(results, status) {	
				if (status == google.maps.GeocoderStatus.OK) {						
					// set the latitude longitude on callback for the location
					location.LATITUDE = results[0].geometry.location.lat();
					location.LONGITUDE = results[0].geometry.location.lng();
					
					// update the database with the new coordinates
					if ((location.TYPE != 'HOME') && (location.TYPE != 'HQ')) getDataSource_AJAX("?action=geocode&lid="+location.ID+"&lat="+location.LATITUDE+"&lng="+location.LONGITUDE);
					
					// display debugging info
					showDebug('[SUCCESS] Geocoding successful for location: ' + location.ID + ' ' + location.NAME);								
					
					// set the plotted status
					plotted = true;
				}else{	
					// display debugging info
					showDebug('[FAIL] Geocoding failed for location: ' + location.ID + ' ' + location.NAME);
					
					// set the plotted status
					plotted = false;
				}
				
				// fire callback function if provided passing the location as a parameter
				if (typeof callback == 'function') {
					callback.call(this, location, plotted);
				}
			}
		);
	}

	// ========================================
	// CALC DISTANCE METHOD (PRIVATE)
	// ========================================
	// Use the haversine formula to calculate 
	// 'great circle' distance between home 
	// and passed location.
	// Accurate to around 0.3% depending on 
	// distance from equator.
	// represented in miles here 
	// (uncomment km to change to kilometers)
	// ========================================
	function calcDistance(location) {
		
		var R = 3959; // mean radius of the earth in mi
		//var R = 6371; // mean radius of the earth in km

		// display debugging info
		showDebug('[INFO] Calculating distance for location: ' + location.ID + ' ' + location.NAME);
		
		// check that both locations have lat and lng otherwise abandon
		if (!location.LATITUDE || !home_location.LATITUDE || !location.LONGITUDE || !home_location.LONGITUDE) return null;
		
		// use the the haversine formula to calculate distance
		var dLat = (location.LATITUDE - home_location.LATITUDE) * Math.PI / 180;
		var dLon = (location.LONGITUDE - home_location.LONGITUDE) * Math.PI / 180; 
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(home_location.LATITUDE * Math.PI / 180) * Math.cos(location.LATITUDE * Math.PI / 180) * 
		Math.sin(dLon/2) * Math.sin(dLon/2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c;

		// return the result
		return d;
	}

	// ========================================
	// CALC DISTANCES METHOD (PRIVATE)
	// calculate distance for all locations and 
	// sort locations array by distance
	// ========================================
	function calcDistances() {

		var needsSort = false;

		// calculate the distance for all locations not already calcualted by db
		for (i in our_locations) {
			if (!our_locations[i].DISTANCE) {		
				our_locations[i].DISTANCE = calcDistance(our_locations[i]);
				needsSort = true;
			}
		}
		
		// sort the locations array by distance if needed
		//if (needsSort) our_locations = qsort(our_locations, 'DISTANCE');
		if (needsSort) our_locations.sort(distanceSort);
	}

	// ========================================
	// DISTANCE SORT METHOD (PRIVATE)
	// Not sure how efficient this is compared
	// to other sort methods, comparisons to 
	// be made.
	// ========================================
	function distanceSort(a, b) {
	    var x = a.DISTANCE;
	    var y = b.DISTANCE;
	    return a - b;
	}
	
	// ========================================
	// RANDOM STRING (PRIVATE)
	// Returns a random string
	// ========================================
	function randomString() {
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var string_length = 8;
		var randomstring = '';
		for (var i=0; i<string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}
		return randomstring;
	}
}