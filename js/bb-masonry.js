BigBridge = window.BigBridge || {};

/**
 * Masonry extension for diamond grid layout
 *
 * @author Pascal Wientjes (Concept, HTML, CSS)
 * @author Patrick van Bergen (Javascript)
 */

Masonry.prototype.parent_layoutItems = Masonry.prototype._layoutItems;

/**
 * An override of Masonry's layout function.
 *
 * Prepares the positions of all elements.
 */
Masonry.prototype._layoutItems = function(items, isInstant)
{
    this._prepareGrid(items);

    return Masonry.prototype.parent_layoutItems.apply(this, [items, isInstant]);
};

/**
 * An override of Masonry's layout function.
 *
 * Applies the prepared positions of all elements.
 */
Masonry.prototype._getItemLayoutPosition = function( item ) {

    // the items's position was precalculated (in _prepareGrid)
    // we just need to return it here
    return item.position;
};

Masonry.prototype._prepareGrid = function(items)
{
    var grid = new BigBridge.Grid();

    if (items.length < 2) {
        return;
    }

    // all items have same size, so pick any item for its properties
    var sampleItem = items[0];

    sampleItem.getSize();

    var layout = sampleItem.layout;
    var itemWidth = sampleItem.size.outerWidth;
    var itemHeight = sampleItem.size.outerHeight;

    // copy the item array, since we are going to modify it
    var itemQueue = items.slice(0);

    // continue creation rows as long as there are items left
    for (var row = 0; itemQueue.length > 0; row++) {

        // the number of columns is a given
        for (var col = 0; col < layout.cols; col++) {

            // is this position blocked?
            if (grid.get(row, col) == BigBridge.Grid.CLEARANCE) {
                continue;
            }

            // any items left?
            if (itemQueue.length == 0) {
                continue;
            }

            // determine the next item: normal diamond, huge diamond, or none
            var item = this._selectNextItem(itemQueue, grid, row, col, layout.cols);

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

            // mark the position of the item
            grid.set(row, col, item);

        }
    }

    // update the heights of the columns
    for (var columnIndex = 0; columnIndex < layout.cols; columnIndex++) {
        this.colYs[columnIndex] = grid.getHeight() * itemHeight;
    }
};

Masonry.prototype._selectNextItem = function(itemQueue, grid, row, col, colCount)
{
    // handle the next item in line
    var item = itemQueue.shift();

    if (item.element.className.match(/huge/)) {

        // determine if this is a good place for a huge diamond
        var fit = (
            (col > 0) &&
            (col < (colCount - 1))
        );

        // if this is a fitting position, or there are no fitting positions because there are too little columns
        if (fit || (colCount < 3)) {

            // check if this huge diamond does not take the place of another huge diamond
            if (this._spaceForHugeDiamond(grid, row, col)) {
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
        // there's not a lot we can do now; we must show the huge diamond at some point

        // let's at least make sure that our huge diamond doesn't overlap another one
        if (!this._spaceForHugeDiamond(grid, row, col)) {

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

Masonry.prototype._spaceForHugeDiamond = function(grid, row, col)
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

/** ------ Grid ------ */

BigBridge.Grid = function()
{
    this.grid = {};
    this.height = 0;
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