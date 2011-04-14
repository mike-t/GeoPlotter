// ========================================
// DISTANCE SORT FUNCTION
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
// QUICKSORT FUNCTION
// Modified for two dimensional arrays to
// sort on a sub element value
// TODO: not working....
// ========================================
function qsort(a, keyname) {
	if (a.length == 0) return [];
	
	//alert(a[1].toString());

	var left = [], right = [], pivot = a[0];

	//alert(pivot['DISTANCE']);
	var tmp;
	
	for (var i = 1; i < a.length; i++) {
		//tmp = (a[i][keyname] < pivotval) ? 'true' : 'false';
		//alert('is ' + a[i][keyname] + ' < ' + pivotval + '?\nAnswer: ' + tmp);
		alert(a[i]);
		a[i][keyname] < a[0][keyname] ? left.push(a[i]) : right.push(a[i]);
	}

	return qsort(left).concat(pivot, qsort(right));
}