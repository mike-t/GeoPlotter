// ============================================
// Benchmark v.1.0
// ============================================
// AUTHOR: Michael Walton
// UPDATED: 07.04.2011
//
// COPYRIGHT: Michael Walton
//
// Basic benchmarking function that 
// displays profiling info in the specified
// div.
//
// USAGE:
// Call with 'start' and a 'testname' to start
// or 'stop' to stop... genius.
//
// ============================================

var benchmark_div = 'benchmark_results';

function benchmark(command, testname, start) {

	// change this function to use the passed function and callback to the script stop.

	// determine start or stop, default nothing	
	switch (command) {

		case 'start':
			// Update the user inteface
			document.getElementById(benchmark_div).innerHTML += '<div style="padding: 10px 0px 10px 20px;">[Test: ' + testname + ']<span id="' + testname + '_exec" style="padding-left:15px">Benchmarking...</span></div>';

			// start the timer in milliseconds accuracy
			start = new Date().getMilliseconds();
			
			return start;
			
		case 'stop':
			// calculate the elapsed time and update the interface
			document.getElementById(testname + '_exec').innerHTML = (new Date().getMilliseconds() - start) + 'ms';
	}
}