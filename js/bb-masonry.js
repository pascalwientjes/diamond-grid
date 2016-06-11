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

Masonry.prototype.parent_getItemLayoutPosition = Masonry.prototype._getItemLayoutPosition;

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
    if (items.length == 0) {
        return;
    }

    var itemQueue = items.slice(0);
    var grid = new BigBridge.Grid();
    var layout = itemQueue[0].layout;

    for (var row = 0; itemQueue.length > 0; row++) {
        for (var col = 0; col < layout.cols; col++) {

            if (grid.get(row, col) == BigBridge.Grid.CLEARANCE) {
                continue;
            }

            if (itemQueue.length > 0) {

                var item = itemQueue.shift();

                item.getSize();

                if (jQuery(item.element).hasClass('huge')) {

                    if (col % 2 == 0) {

                        if (col == 0 || col == (layout.cols - 1)) {

                            // huge diamond cannot be located here; no space to expand left or right

                            // we must place the diamond _somewhere_
                            if (layout.cols.length < 3) {
                                // but there must be space for it: check the positions where the huge diamond will go
                                if (1) {

                                }
                            }
                            // can we use a waiting normal diamond?
                            else if (0) {

                            } else {
                                // leave this position empty
                                continue;
                            }
                        }

                        var leftNeighbour = this._getGridElement(positionedItems, row, col - 1);
                        if (leftNeighbour) {
                            itemQueue.unshift(leftNeighbour);
                        }

                        grid.set(row, col - 1, BigBridge.Grid.CLEARANCE);
                        grid.set(row, col + 1, BigBridge.Grid.CLEARANCE);
                        grid.set(row + 1, col, BigBridge.Grid.CLEARANCE);

                    } else {

                        grid.set(row + 1, col - 1, BigBridge.Grid.CLEARANCE);
                        grid.set(row + 1, col, BigBridge.Grid.CLEARANCE);
                        grid.set(row + 1, col + 1, BigBridge.Grid.CLEARANCE);

                    }
                }

                item['bbX'] = col * item.size.outerWidth;
                item['bbY'] = row * item.size.outerHeight;

                this.colYs[col] = (row + 1) * item.size.outerHeight;

                grid.set(row, col, item);
            }
        }
    }
};

BigBridge.Grid = function()
{
    this.grid = {};
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
};
