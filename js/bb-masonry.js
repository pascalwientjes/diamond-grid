Outlayer.prototype.parentProcessLayoutQueue = Outlayer.prototype._processLayoutQueue;

/**
 * An override of Masonry's layout function.
 *
 * This function moves the 'secondary block' that belongs to a huge diamond
 * to its proper position.
 *
 * @param queue
 * @returns {*}
 * @private
 */
Outlayer.prototype._processLayoutQueue = function(queue) {

    var coordinateGrid = this._createGrid(queue);

    // ignore when Maonry calls this function with only 1 object
    if (queue.length > 1) {

        for (var i = 0; i < queue.length; i++) {

            var position = queue[i];
            var item = position.item;
            var element = item.element;

            if (jQuery(element).hasClass('huge-secondary')) {

                if (i == 0) {
                    // error
                    if (window.console) {
                        console.log('A secondary block should be placed directly after a huge diamond block.');
                    }
                    break;
                }

                var currentSecondaryPosition = position;

                var hugeDiamondPosition = queue[i - 1];

                // locate the target position of the secondary block
                var targetSecondaryPosition = this._getTargetPosition(hugeDiamondPosition, coordinateGrid);
                if (targetSecondaryPosition) {

                    // swap positions with this target position
                    var swapX = currentSecondaryPosition.x;
                    var swapY = currentSecondaryPosition.y;

                    currentSecondaryPosition.x = targetSecondaryPosition.x;
                    currentSecondaryPosition.y = targetSecondaryPosition.y;

                    targetSecondaryPosition.x = swapX;
                    targetSecondaryPosition.y = swapY;

                }
            }
        }
    }

    // perform Masonry's original element layout function
    return Outlayer.prototype.parentProcessLayoutQueue.apply(this, [queue]);
};

/**
 * Returns the queue in grid form (a 2d array indexed by rows and columns) where positions are the elements
 * This structure allows us to find a position by its column and row indexes.
 *
 * It also assigns attributes 'bbColumn' and 'bbRow' to each position, for easier retrieval
 *
 * @param queue
 * @returns {{}}
 * @private
 */
Outlayer.prototype._createGrid = function(queue)
{
    var coordinateGrid = {};

    var row = 0;
    var rowAccumulatedColumn = 0;

    for (var i = 0; i < queue.length; i++) {

        var position = queue[i];
        var item = position.item;
        var element = item.element;
        var columnSpan = (element.offsetWidth / this.columnWidth);

        position['bbColumn'] = rowAccumulatedColumn;
        position['bbRow'] = row;

        for (var columnOffset = 0; columnOffset < columnSpan; columnOffset++) {

            var col = rowAccumulatedColumn + columnOffset;

            if (typeof coordinateGrid['col' + col] == 'undefined') {
                coordinateGrid['col' + col] = {};
            }

            coordinateGrid['col' + col]['row' + row] = position;
        }

        rowAccumulatedColumn += columnSpan;

        if (rowAccumulatedColumn >= this.cols) {
            rowAccumulatedColumn = 0;
            row++;
        }
    }

    return coordinateGrid;
};

Outlayer.prototype._getTargetPosition = function(hugeDiamondPosition, coordinateGrid)
{
    var leftColumn = hugeDiamondPosition['bbColumn'];
    var row = hugeDiamondPosition['bbRow'];
    var targetCol, targetRow;

    targetCol = leftColumn + 1;
    if (leftColumn % 2 == 0) {
        // first, third, fifth, etc columns: position is above
        targetRow = row - 1;
    } else {
        // second, fourth, sixth, etc columns: position is below
        targetRow = row + 1;
    }

    if ((typeof coordinateGrid['col' + targetCol] == 'undefined') ||
        (typeof coordinateGrid['col' + targetCol]['row' + targetRow] == 'undefined')) {

        // error: the secondary block cannot be placed above of the first row or below the last row
        if (window.console) {
            console.log('The secondary block of a huge diamond cannot be placed above or below the existing blocks');
            return null;
        }
    }

    return coordinateGrid['col' + targetCol]['row' + targetRow];
};