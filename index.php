<?php
// ============================================
// GeoPlotter 3.0 API Sample v3.1
// ============================================
// AUTHOR: Michael Walton
// UPDATED: 11.04.2011
// ============================================
// TODO:

// * display a key for location icons
// * change icon color/size and zoom, pan then bounce (after pan) on viewing/selection  <----!!!!
// * display decent tooltips on hover (instant)	
// * add copyright to directions (mandatory?)
// * protect data from mining (encrypt it)
// * setDataSource method (DB, csv, etc)
// * default to geographical location for home if not set (http://code.google.com/apis/maps/documentation/javascript/basics.html#DetectingUserLocation)
// * Geocodes need to fail outside of bounds, not just be preferential!
// * navigating map at less than full zoom pings the scroll bar to the bottom of the page!!?
// * use a modal for warnings / no results (can modal only span a div?)
// * show provided services with tick box list on right hand sideof acc content div (split address div in twain)
// * stick directions in a tab
// * protect data_connector from being run by any other source/script (using a key along with referrer)
// * initialise should require the name of the control div and the map div ? or perhaps set these properties
// * error handling to show error in place of loading for fatals.
// * create a location object type.
// * pull in google js through the Geoplotter object (i.e. make it a complete wrapper)
// * make UI an object withing GeoPlotter. ie. gp.UI.distanceSearchOptions = array.
// * add options for customising the user interface (control panel)
// * clear uniform form not working.
// * overlay smaller image like Googles in the copyright 
// * check optional elements exist!
// * seperate CSS out
// * on mouseover and select enlargen the marker
// ============================================
?>
<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />

		<!-- add our stylesheets -->
		<link rel="stylesheet" href="style/geoplotter.css" />
		<link rel="stylesheet" href="style/uniform.default.css" media="screen" />

		<!-- Import Google Maps API, Geoplotter API, JQuery/JQueryUI and Uniform -->
		<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false" charset="utf-8"></script>
		<script type="text/javascript" src="js/geoplotter.js" charset="utf-8"></script>
		<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js" charset="utf-8"></script>
		<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.13/jquery-ui.min.js" charset="utf-8"></script>
		<script type="text/javascript" src="js/jquery.uniform.min.js" charset="utf-8"></script>
		<script type="text/javascript" src="js/jquery.scrollTo-min.js" charset="utf-8"></script>

		<!-- create the GeoPlotter object and apply the jquery when DOM is ready -->		
		<script type="text/javascript" charset="utf-8">

		// our custom style to apply to GeoPlotter map (blue)
		var mapStyle = [{
			featureType: 'all',
			stylers: [
				{hue: '#0000b0'},
				{invert_lightness: 'true'},
				{saturation: -30}
			]
		}];
		
		// Create the Geoplotter object now.
		// allows us to create the onlick events.
		var gp = new GeoPlotter('gp', '<?php echo($search_panel_html);?>');
		
		// When the DOM is ready...
		jQuery(function(){
						
			// Optional GeoPlotter settings
			gp.setDebug(true, 'debug_window');
			//gp.setMapStyle(mapStyle);
			gp.setLocationMarker('images/IFA_dot.png', 10, 10);
			gp.setHomeMarker('images/HOME_dot.png', 15, 15);

			// Required GeoPlotter settings (currently!)
			gp.dataConnector = 'data_connectors/phossil.php';
			gp.mapElement = 'map_panel';	// create map canvas ourselves!
			gp.UIElement = 'control_panel';
			
			// start GeoPlotter
			gp.initialise();
		});
		</script>

	</head>
	
	<body>
		<!-- The title -->
		<div style="background-image:url('images/geoplotter.png');height:114px;width:396px;"></div>

		<div class="container">
			<!-- The Map -->
			<!-- For my UK bounds & viewport use ratio of 3:4 for good fit (e.g 600x800). -->
			<!-- Note: for best fit actual ratio is just under this (0.7476:1) -->
			<!-- It's best to fiddle to get the best zoom level vs boundary window -->
			<div id="map_panel" class="map_panel">
			</div>

			<!-- This will be populated with the GeoPlotter UI -->
			<div id="control_panel" class="control_panel">
			</div>
		</div>
		
		<!-- Benchmarking Information -->
		<div id="benchmark_results" class="partition" style="display: none;">
			<h4>Benchmarking</h4>
		</div>
		
		<!-- Debugging Information -->
		<div id="debug_partition" class="partition" style="display: block;">
			<h4 id="directions_heading">Debugging Information</h4>
			<div id="debug_window"></div>
		</div>
		
		<!-- Copyright -->
		<div class="copyright">&nbsp;&copy 2011 Michael Walton &amp; Google</div>

	</body>
</html>