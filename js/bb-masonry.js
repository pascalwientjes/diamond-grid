BigBridge = window.BigBridge || {};

/**
 * Jewelry: A Masonry extension for the diamond grid layout
 *
 * @author Pascal Wientjes (Concept, HTML, CSS)
 * @author Patrick van Bergen (Javascript)
 */

BigBridge.Jewelry = function()
{
};

/** A reference to a Masonry function that will be overwritten, and will need to call its parent function */
BigBridge.Jewelry.masonry_layoutItems = Masonry.prototype._layoutItems;

/**
 * Jewelry only supports its own kind of stamps: these are not DOM elements, but (x, y) positions in the diamond grid
 * This array contains the empty places in the grid; and can be set by the application
 *
 * Either 'row' or 'endRow' is required;
 * column, startColumn and endColumn are optional
 *
 * Examples:
 * { row: 3, startColumn: 4 }   // at row 3, create a clearance in columns 4 and up
 * { endRow 1, endColumn: 2 }   // at rows up to 1, clears columns up to 2
 */
BigBridge.Jewelry.stamps = [];


/** Replace some of Masonry's functions */


/**
 * An override of Masonry's layout function.
 *
 * Prepares the positions of all elements.
 */
Masonry.prototype._layoutItems = function(items, isInstant)
{
    if (items.length > 1) {

        // all items have same size, so pick any item for its properties
        var sampleItem = items[0];
        var size = getSize(sampleItem.element);

        var itemWidth = size.outerWidth;
        // marginTop is non-zero when the first item has class 'odd'
        var itemHeight = size.outerHeight - size.marginTop;

        var columnCount = this.cols;

        var jewelry = new BigBridge.Jewelry();

        var grid = new BigBridge.Grid(columnCount, BigBridge.Jewelry.stamps);

        jewelry.prepareGrid(items, itemWidth, itemHeight, grid, columnCount);

        // update the heights of the columns
        for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            this.colYs[columnIndex] = grid.getHeight() * itemHeight;
        }
    }

    return BigBridge.Jewelry.masonry_layoutItems.apply(this, [items, isInstant]);
};

/**
 * An override of Masonry's layout function.
 *
 * Applies the prepared positions of all elements.
 */
Masonry.prototype._getItemLayoutPosition = function(item)
{
    // the items's position was pre-calculated (in _layoutItems)
    // we just need to return it here
    return item.position;
};


/** Jewelry */


/**
 * Sets the position of al items, according to the layout rules of the diamond grid.
 *
 * @param items [{}]
 * @param itemWidth int
 * @param itemHeight int
 * @param grid BigBridge.Grid
 */
BigBridge.Jewelry.prototype.prepareGrid = function(items, itemWidth, itemHeight, grid)
{
    // copy the item array, since we are going to modify it
    var itemQueue = items.slice(0);
    var colCount = grid.getColumnCount();
    var lastLine = false;

    // continue creation rows as long as there are items left
    for (var row = 0; itemQueue.length > 0; row++) {

        if (itemQueue.length <= colCount) {
            lastLine = true;
        }

        // the number of columns is a given
        for (var realCol = 0; realCol < grid.getColumnCount(); realCol++) {

            // last line
            if (lastLine) {

                var col = 0;
                var half = Math.ceil(grid.getColumnCount() / 2);

                if (realCol < half) {
                    col = realCol * 2;
                } else {
                    col = ((realCol - half) * 2) + 1;
                }

            } else {
                col = realCol;
            }

            // is this position blocked?
            if (grid.get(row, col) == BigBridge.Grid.CLEARANCE) {
                continue;
            }

            // any items left?
            if (itemQueue.length == 0) {
                continue;
            }

            // determine the next item: normal diamond, huge diamond, or none
            var item = this.selectNextItem(itemQueue, grid, row, col, grid.getColumnCount());

            // if no suitable item could be found, just mark this position as taken
            if (!item) {
                grid.set(row, col, BigBridge.Grid.CLEARANCE);
                continue;
            }

            if (item.element.className.match(/huge/)) {

                // diamond need to treated differently, depending on their column

                if (col % 2 == 0) {

                    // even column

                    // this huge diamond needs space to its left
                    // so if their is a neighbouring normal diamond, push it back into the queue
                    var leftNeighbour = grid.get(row, col - 1);

                    // one huge diamond cannot use the space of another huge diamond
                    if (leftNeighbour && (leftNeighbour != BigBridge.Grid.CLEARANCE)) {

                        // we need to put the left neighbouring diamond back into the queue
                        itemQueue.unshift(leftNeighbour);
                    }

                    // make space for the huge diamond
                    grid.set(row, col - 1, BigBridge.Grid.CLEARANCE);
                    grid.set(row, col + 1, BigBridge.Grid.CLEARANCE);
                    grid.set(row + 1, col, BigBridge.Grid.CLEARANCE);

                } else {

                    // odd column

                    // make space for the huge diamond
                    grid.set(row + 1, col - 1, BigBridge.Grid.CLEARANCE);
                    grid.set(row + 1, col, BigBridge.Grid.CLEARANCE);
                    grid.set(row + 1, col + 1, BigBridge.Grid.CLEARANCE);

                }
            }

            // tell the item where it is located
            item.position.x = col * itemWidth;
            item.position.y = row * itemHeight;

            if (col % 2 == 0) {
                // remove 'odd' class
                item.element.className = item.element.className.replace(new RegExp('(\\s|^)odd(\\s|$)'), ' ');
            } else {
                // add 'odd' class
                if (!item.element.className.match(new RegExp('(\\s|^)odd(\\s|$)'))) {
                    item.element.className += ' odd';
                }
            }

            // mark the position of the item
            grid.set(row, col, item);

        }
    }
};

BigBridge.Jewelry.prototype.selectNextItem = function(itemQueue, grid, row, col, colCount)
{
    // handle the next item in line
    var item = itemQueue.shift();

    if (item.element.className.match(/huge/)) {

        // determine if this is a good place for a huge diamond
        var properColumnToStartHugeDiamond = (
            (col > 0) &&
            (col < (colCount - 1))
        );

        // determine if there are enough columns to fit a huge diamond normally
        var enoughColumnsForHugeDiamond = (colCount >= 3);

        // if this is a fitting position, or there are no fitting positions because there are too little columns
        if (properColumnToStartHugeDiamond || !enoughColumnsForHugeDiamond) {

            // check if this huge diamond does not take the place of another huge diamond
            if (this.spaceForHugeDiamond(grid, row, col)) {
                // we're done
                return item;
            }
        }

        // at this point we have a huge diamond that doesn't really fit, what to do?

        // let's see if there's a normal diamond waiting next in line, so we can change places with it

        if (itemQueue.length > 0) {

            var nextItem = itemQueue.shift();

            // is this a normal diamond?
            if (!nextItem.element.className.match(/huge/)) {

                // push the huge diamond further up the queue
                itemQueue.unshift(item);

                // return the normal diamond
                return nextItem;

            } else {

                // no the next diamond is huge as well; return it to the queue
                itemQueue.unshift(nextItem);

            }
        }

        // we failed to replace the huge diamond with a normal one

        // can't we just wait until the next row, where there will be enough space?
        if (enoughColumnsForHugeDiamond) {

            // let's retry the same huge diamond later on
            itemQueue.unshift(item);

            // prepare an empty position here
            return null;
        }

        // there's not a lot we can do now; we must show the huge diamond at some point

        // let's at least make sure that our huge diamond doesn't overlap another one
        if (!this.spaceForHugeDiamond(grid, row, col)) {

            // it does! let's retry the same huge diamond later on
            itemQueue.unshift(item);

            // and prepare an empty position here
            return null;
        }

        // return the unfitting, but not overlapping, huge diamond
        return item;

    } else {

        // normal diamond is ok
        return item;

    }
};

BigBridge.Jewelry.prototype.spaceForHugeDiamond = function(grid, row, col)
{
    if (col % 2 == 0) {

        var leftNeighbour = grid.get(row, col - 1);

        var leftNeighbourOk =
            !leftNeighbour ||
            (leftNeighbour != BigBridge.Grid.CLEARANCE && !leftNeighbour.element.className.match(/huge/));

        return (
            leftNeighbourOk &&
            grid.isEmpty(row, col + 1) &&
            grid.isEmpty(row + 1, col));

    } else {

        return (
            grid.isEmpty(row + 1, col - 1) &&
            grid.isEmpty(row + 1, col) &&
            grid.isEmpty(row + 1, col + 1));

    }
};


/** Grid */


BigBridge.Grid = function(colCount, stamps)
{
    this.grid = {};
    this.height = 0;
    this.colCount = colCount;
    this.stamps = stamps;
};

BigBridge.Grid.CLEARANCE = 'clearance';

BigBridge.Grid.prototype.get = function(row, col)
{
    if (typeof this.grid['row' + row] != 'undefined') {
        if (this.grid['row' + row]['col' + col]) {
            return this.grid['row' + row]['col' + col];
        }
    }

    // check if the position is stamped by one of the rules
    if (this.positionIsStamped(row, col)) {
        // store this information
        this.set(row, col, BigBridge.Grid.CLEARANCE);
        return BigBridge.Grid.CLEARANCE;
    }

    return null;
};

BigBridge.Grid.prototype.positionIsStamped = function(row, col)
{
    for (var r = 0; r < this.stamps.length; r++) {

        var rule = this.stamps[r];
        var fires = true;

        // row or endRow
        if (typeof rule.row != 'undefined') {
            fires = fires && (row == rule.row);
        } else if (typeof rule.endRow != 'undefined') {
            fires = fires && (row <= rule.endRow);
        } else {
            throw new Error('Missing field in stamp: row or endRow');
        }

        // predictable error
        if (typeof rule.startRow != 'undefined') {
            throw new Error('Deliberately unsupported field in stamp: startRow');
        }

        // column
        if (typeof rule.column != 'undefined') {
            fires = fires && (col == rule.column);
        }

        // startColumn
        if (typeof rule.startColumn != 'undefined') {
            fires = fires && (col >= rule.startColumn);
        }

        // endColumn
        if (typeof rule.endColumn != 'undefined') {
            fires = fires && (col <= rule.endColumn);
        }

        if (fires) {
            return true;
        }
    }

    return false;
};

BigBridge.Grid.prototype.isEmpty = function(row, col)
{
    return this.get(row, col) === null;
};

BigBridge.Grid.prototype.set = function(row, col, value)
{
    if (col < 0 || col >= this.colCount) {
        return;
    }

    if (typeof this.grid['row' + row] == 'undefined') {
        this.grid['row' + row] = {};
    }
    this.grid['row' + row]['col' + col] = value;
    this.height = Math.max(this.height, row + 1);
};

BigBridge.Grid.prototype.getHeight = function()
{
    return this.height;
};

BigBridge.Grid.prototype.getColumnCount = function()
{
    return this.colCount;
};