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

    Masonry.prototype.parent_getItemLayoutPosition.apply(this, [item]);

    return {
        x: item.bbX,
        y: item.bbY
    };
};

Masonry.prototype._prepareGrid = function(items)
{
    var queue = items.slice(0);
    var positionedItems = {};
    var clearances = {};
    var layout = queue[0].layout;

    for (var row = 0; queue.length > 0; row++) {
        for (var col = 0; col < layout.cols; col++) {

            if (this._getGridElement(clearances, row, col)) {
                continue;
            }

            if (queue.length > 0) {

                var item = queue.shift();

                item.getSize();

                if (jQuery(item.element).hasClass('huge')) {

                    if (col % 2 == 0) {

                        if (col == 0 || col == (layout.cols - 1)) {
                            // huge diamond cannot be located here; no space to expand left or right
                            continue;
                        }

                        var leftNeighbour = this._getGridElement(positionedItems, row, col - 1);
                        if (leftNeighbour) {
                            queue.unshift(leftNeighbour);
                        }

                        this._setGridElement(clearances, row, col - 1, true);
                        this._setGridElement(clearances, row, col + 1, true);
                        this._setGridElement(clearances, row + 1, col, true);

                    } else {

                        this._setGridElement(clearances, row + 1, col - 1, true);
                        this._setGridElement(clearances, row + 1, col, true);
                        this._setGridElement(clearances, row + 1, col + 1, true);

                    }
                }

                item['bbX'] = col * item.size.outerWidth;
                item['bbY'] = row * item.size.outerHeight;

                this.colYs[col] = row * item.size.outerHeight - 1;

                this._setGridElement(positionedItems, row, col, item);
            }
        }
    }
};

Masonry.prototype._getGridElement = function(grid, row, col)
{
    if (typeof grid['row' + row] != 'undefined') {
        if (grid['row' + row]['col' + col]) {
            return grid['row' + row]['col' + col];
        }
    }
    return null;
};

Masonry.prototype._setGridElement = function(grid, row, col, value)
{
    if (typeof grid['row' + row] == 'undefined') {
        grid['row' + row] = {};
    }
    grid['row' + row]['col' + col] = value;
};
