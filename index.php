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
// ============================================

// initialise variables
$search_panel_html = '';


// SEARCH CRITERIA CHECKBOXES
// TODO: Will move to within Geoplotter JS 
// This example uses the IFA special roles as the search criteria

// attempt to connect to the db and select database in rather crude manner
$db = mysql_connect('localhost', 'phossil2', 'rustyelephant');
if (!$db) die('Could not connect to database server: ' . mysql_error());
if (!mysql_select_db('phossil2', $db)) die('Could not select database: ' . mysql_error());

// create query for search criteria
$query = "SELECT * FROM lk_special_role WHERE (special_role_id <= 8);";

// query the Phossil database for the search criteria
$result = mysql_query($query);
if (!$result) die('Database query failed: ' . mysql_error());

// place returned search criteria into an array (using SEARCH_ as a precursor, any associative key will do)
while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
	$search_panel_html .= "\t\t\t\t\t\t\t\t<li><label><input type=\"checkbox\" id=\"SEARCH_".$row['special_role_id']."\" name=\"search_criteria\" value=\"".$row['special_role_id']."\" ><span> ".$row['special_role_name']."</span></label></li>\n";
}

// close db connection
mysql_close($db);
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
		<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js" charset="utf-8"></script>
		<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.11/jquery-ui.min.js" charset="utf-8"></script>
		<script type="text/javascript" src="js/jquery.uniform.min.js" charset="utf-8"></script>
		<script type="text/javascript" src="js/jquery.scrollTo-min.js" charset="utf-8"></script>

		<!-- create the GeoPlotter object and apply the jquery when DOM is ready -->		
		<script type="text/javascript" charset="utf-8">

		// our custom style to apply to GeoPlotter map
		var mapStyle = [
			  {
				featureType: "administrative",
				elementType: "all",
				stylers: [
				  { visibility: "off" }
				]
			  },{
				featureType: "landscape",
				elementType: "all",
				stylers: [
				  { visibility: "off" },
				  { hue: "#b7b7b7" },
				  { saturation: -50 },
				  { lightness: -70 }
				]
			  },{
				featureType: "poi",
				elementType: "all",
				stylers: [
				  { visibility: "off" }
				]
			  },{
				featureType: "road",
				elementType: "all",
				stylers: [
				  { visibility: "off" }
				]
			  },{
				featureType: "transit",
				elementType: "all",
				stylers: [
				  { visibility: "off" }
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
		// Create the Geoplotter object now.
		// allows us to create the onlick events.
		var gp = new GeoPlotter('gp');
		
		// When the DOM is ready...
		$(function(){
			// JQuery tabs for control panel
			$("#tabs").tabs();
			
			// form styling with Uniform (uniformjs.com)
			$("input, textarea, select, button").uniform();	
						
			// Optional GeoPlotter settings
			gp.setDebug(true, 'debug_window');
			gp.setMapStyle(mapStyle);
			gp.setLocationMarker('images/IFA_dot.png', 10, 10);
			gp.setHomeMarker('images/HOME_dot.png', 15, 15);

			// Required GeoPlotter settings (currently!)
			gp.dataConnector = 'data_connectors/phossil.php';
			gp.locationsElement = 'accordion';
			
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
			<div class="map_panel">
				<div id="map_canvas" class="map_canvas" style=""></div>
			</div>

			<!-- The search panel with home location and filter options -->
			<div class="control_panel">
				<div id="tabs" class="ui-tabs">
					<ul class="ui-tabs-nav">
						<li><a href="#tabs-locations">Locations</a></li>
						<li><a href="#tabs-filter">Filter</a></li>
						<li id="tab-directions" style="display: none;"><a href="#tabs-directions">Directions</a></li>
					</ul>
					<div id="tabs-locations" class="ui-tabs-panel">
						<div id="accordion-filter-message"></div>
						<!-- the locations listed in accordian style for space saving -->
						<div id="accordion" class="accordion-panel">
						</div>
					</div>					
					<!-- our search/filter panel -->
					<div id="tabs-filter" class="ui-tabs-panel">
						<h4>My location: 
						<input type="text" id="home_location_box" value=""/>&nbsp;<input type="button" value="Update" onclick="gp.setHome();"/>
						</h4>
						<!-- Our search criteria form -->
						<form method="post" action="./" id="search_form" >
							<h4>Only show locations with: </h4>
							<ul>
	<?php echo($search_panel_html);?>
							</ul>
							<h4>Only show locations within: </h4>
							<select id="search_radius" onchange="gp.setRadius();">
								<option value="">Any distance</option>
								<option value="20">20 miles</option>
								<option value="50">50 miles</option>
								<option value="100">100 miles</option>
								<option value="200">200 miles</option>
							</select>
							<div class="search_buttons">
								<input type="button" value="Apply" onclick="gp.getLocations();"/> 
								<input type="button" value="Clear" onclick="gp.clearSearchCriteria();"/>
							</div>
						</form>
					</div>
					<div id="tabs-directions" class="ui-tabs-panel">
						<div id="directions_box" class="directions-panel">No directions have been requested.</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- A container for our directions when requested -->
		<div id="directions_partition" class="partition" style="display: none; width: 590px;">
			<h4 id="directions_heading">Directions</h4>
			<!-- <div id="directions_box"></div>-->
			<!-- for autoprinting of standard style directions -->
			<!--<div id="directions_box_standard" style="width: 640px;"></div>-->
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