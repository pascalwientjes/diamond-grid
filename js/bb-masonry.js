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

        sampleItem.getSize();

        var itemWidth = sampleItem.size.outerWidth;
        var itemHeight = sampleItem.size.outerHeight;

        var jewelry = new BigBridge.Jewelry();

        var grid = jewelry.prepareGrid(items, itemWidth, itemHeight, this.cols);

        // update the heights of the columns
        for (var columnIndex = 0; columnIndex < this.cols; columnIndex++) {
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
    // the items's position was precalculated (in _layoutItems)
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
 * @param columnCount int
 */
BigBridge.Jewelry.prototype.prepareGrid = function(items, itemWidth, itemHeight, columnCount)
{
    // copy the item array, since we are going to modify it
    var itemQueue = items.slice(0);

    var grid = new BigBridge.Grid(columnCount);

    // continue creation rows as long as there are items left
    for (var row = 0; itemQueue.length > 0; row++) {

        // the number of columns is a given
        for (var col = 0; col < columnCount; col++) {

            // is this position blocked?
            if (grid.get(row, col) == BigBridge.Grid.CLEARANCE) {
                continue;
            }

            // any items left?
            if (itemQueue.length == 0) {
                continue;
            }

            // determine the next item: normal diamond, huge diamond, or none
            var item = this.selectNextItem(itemQueue, grid, row, col, columnCount);

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

    return grid;
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

        var leftNeighbourOk = !leftNeighbour ||
            (
                (leftNeighbour != BigBridge.Grid.CLEARANCE) &&
                (!leftNeighbour.element.className.match(/huge/)));

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


BigBridge.Grid = function(colCount)
{
    this.grid = {};
    this.height = 0;
    this.colCount = colCount;
};

BigBridge.Grid.CLEARANCE = 'clearance';

BigBridge.Grid.prototype.get = function(row, col)
{
    if (typeof this.grid['row' + row] != 'undefined') {
        if (this.grid['row' + row]['col' + col]) {
            return this.grid['row' + row]['col' + col];
        }
    }
    return null;
};

BigBridge.Grid.prototype.isEmpty = function(row, col)
{
    if (typeof this.grid['row' + row] != 'undefined') {
        if (this.grid['row' + row]['col' + col]) {
            return false;
        }
    }
    return true;
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