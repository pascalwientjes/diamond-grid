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

    return {
        x: item.bbX,
        y: item.bbY
    };
};

Masonry.prototype._prepareGrid = function(items)
{
    var grid = new BigBridge.Grid();

    if (items.length == 0) {
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

    for (var row = 0; itemQueue.length > 0; row++) {
        for (var col = 0; col < layout.cols; col++) {

            // is this position blocked?
            if (grid.get(row, col) == BigBridge.Grid.CLEARANCE) {
                continue;
            }

            // any items left?
            if (itemQueue.length > 0) {

                var item = this._selectNextItem(itemQueue, col, layout.cols);


// calculate its size
item.getSize();

                if (item.element.className.match(/huge/)) {

                    if (col % 2 == 0) {

                        var leftNeighbour = grid.get(row, col - 1);
                        if (leftNeighbour) {
                            itemQueue.unshift(leftNeighbour);
                        }

                        grid.set(row, col - 1, BigBridge.Grid.CLEARANCE);
                        grid.set(row, col + 1, BigBridge.Grid.CLEARANCE);
                        grid.set(row + 1, col, BigBridge.Grid.CLEARANCE);

                    } else {

                        // odd column

                        grid.set(row + 1, col - 1, BigBridge.Grid.CLEARANCE);
                        grid.set(row + 1, col, BigBridge.Grid.CLEARANCE);
                        grid.set(row + 1, col + 1, BigBridge.Grid.CLEARANCE);

                    }

                }

                // add some properties to the item, for later use
                item['bbX'] = col * itemWidth;
                item['bbY'] = row * itemHeight;

                // mark the position of the item
                grid.set(row, col, item);

            } else {

            }
        }
    }

    // update the heights of the columns
    for (var columnIndex = 0; columnIndex < layout.cols; columnIndex++) {
        this.colYs[columnIndex] = grid.getHeight() * itemHeight;
    }
};

Masonry.prototype._selectNextItem = function(itemQueue, col, colCount)
{
    // handle the next item in line
    var item = itemQueue.shift();

    if (item.element.className.match(/huge/)) {

        if (col % 2 == 0) {

            // even column

            if (col == 0 || col == (colCount - 1)) {

                // huge diamond cannot be located here; no space to expand left or right

                // we must place the diamond _somewhere_
                if (colCount < 3) {
                    // but there must be space for it: check the positions where the huge diamond will go
                    if (1) {

                    }
                }
                // can we use a waiting normal diamond?
                else if (0) {

                } else {
                    // leave this position empty
                    //continue;
                }
            }

        } else {

            // odd column


        }
    }

    return item;
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