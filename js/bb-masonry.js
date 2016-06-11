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

            var item = this._selectNextItem(itemQueue, grid, row, col, layout.cols);


// calculate its size
item.getSize();

            if (item.element.className.match(/huge/)) {

                if (col % 2 == 0) {

                    // this huge diamond needs space to its left;
                    var leftNeighbour = grid.get(row, col - 1);

                    if (leftNeighbour) {

                        // it cannot use the space of another huge diamond
                        if (leftNeighbour != BigBridge.Grid.CLEARANCE) {

                            // we need to put the left neighbouring diamond back into the queue
                            itemQueue.unshift(leftNeighbour);
                        }
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

            if (this._spaceForHugeDiamond(grid, row, col)) {
                // we're done
                return item;
            }
        }

        // try the next diamond first

        if (itemQueue.length > 0) {

            var nextItem = itemQueue.shift();

            // is this a normal diamond?
            if (!nextItem.element.className.match(/huge/)) {

                // push the huge diamond further up the queue
                itemQueue.unshift(item);

                return nextItem;

            } else {

                // return the big diamond
                itemQueue.unshift(nextItem);

            }
        }

        // no luck: just return the unfitting huge diamond
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

        return (
            (leftNeighbour != BigBridge.Grid.CLEARANCE) &&
            (!leftNeighbour.element.className.match(/huge/)) &&
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