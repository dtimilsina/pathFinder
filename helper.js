/**
 * Application Logic for the path finding web application
 *
 * @author Diwas Timilsina
*/


// dimension of the board for this application
var COLUMN_SIZE = 18;
var ROW_SIZE = 10;

/**
 * Enum to represent the different possible status of the cell
 */
var CELL_STATUS = {
  OPEN: 0,
  WALL: 1,
  START: 2,
  END: 3
}

/**
 * Cell class to store information about a cell
*/

class Cell {

  constructor(index) {
    // index to keep track of the location of the cell
    this.index = index;

    // curent state of the cell, eithr it is open, has a wall, or is a start or end cell
    this.status = CELL_STATUS.OPEN;

    // sum of distance from starting cell and distance to the ending cell
    this.total = 0;

    // this is the shortest distance it takes to reach the cell from the starting cell
    this.fromStartDistance = 0;

    // this is the distance of the current cell to the end cell
    // This implementation uses Manhattan distance
    this.toEndDistance = 0;

    // the best possible cell to get to the starting cell
    this.parent = null;
  }
}

/**
 *  Main Function
*/

$(document).ready(function(){

 var  $MAP            = $('#grid'),          // the grid where cells are placed
      $BTN_START      = $('#set-start'),     // select start cell button
      $BTN_END        = $('#set-end'),       // select end cell button
      $BTN_CLR        = $('#erase'),         // clear map button
      $BTN_PATH       = $('#find'),          // find path button
      $PATH_TEXT      = $('#path-possible'),  // no possible path text
      cell_collection = [],
      wall_cells      = [],
      path            = [],
      setBegin        = false,
      setEnd          = false,
      box, cell, startIndex, endIndex;

  // hide the no path found text
  $PATH_TEXT.css('visibility','hidden')


  // initial setup for the board
  for (var i = 0; i < COLUMN_SIZE * ROW_SIZE; i++){

    // create box component to display in the UI
    box  = '<div id = "'+i+'" class="box" />';
    $($MAP).append(box);

    // keep track of the cell for application logic
    cell = new Cell(i);
    cell_collection.push(cell);
  }

  // Listern to click action on the cells that are on the UI
  var $MAP_BOXES = $('.box');
  $($MAP_BOXES).on('click', function() {

     // get the id of the selcted cell to locate its location
     var id = parseInt($(this).attr('id'));
     cell = cell_collection[id];

     switch (cell.status) {

       case CELL_STATUS.OPEN:

         // if the cell is open and set begin button was pressed
         // change the state of the cell to start and color it
         if (setBegin) {

            // if there is already a cell that is selected as start cell,
            // then deselect the previos cell
            if (startIndex === 0 || startIndex) {
              colorCell(startIndex, 'white');
              cell_collection[startIndex].status = CELL_STATUS.OPEN;
            }

            $(this).css('background-color','green');

            cell.status = CELL_STATUS.START;
            startIndex = id;
            setBegin = false;


         // if the cell is open and set end button was pressed
         // change the state of the cell to end and color it
         } else if (setEnd) {

           if (endIndex === 0 || endIndex) {
             colorCell(endIndex, 'white');
             cell_collection[endIndex].status = CELL_STATUS.OPEN;
           }

           $(this).css('background-color','red');

           cell.status = CELL_STATUS.END;
           endIndex = id;
           setEnd = false;

         // otherwise, change the state of the cell to
         // wall and update color on it too
         } else {

           cell.status = CELL_STATUS.WALL;
           wall_cells.push(cell.index);
           $(this).css('background-color','black');
        }

        break;

       case CELL_STATUS.WALL:
         // If the current state of thse selected cell is wall,
         // remove the cell from the list of wall cells and
         // change its color as well

         $(this).css('background-color','white');
         cell.status = CELL_STATUS.OPEN;
         wall_cells.remove(cell.index);

         break;

       case CELL_STATUS.START:
          // if the selected cell is in start state,
          // remove it as start cell and change it's status to
          // open cell. This is to allow user to change their selection for
          // current start cell

          colorCell(startIndex, 'white');
          cell.status = CELL_STATUS.OPEN;
          startIndex = null;
          setBegin = true;

          break;

      case CELL_STATUS.END:
          // if the selected cell is in end state,
          // remove it as end cell and change it's status to
          // open cell. This is to allow user to change their selection for
          // current end cell

          colorCell(endIndex, 'white');
          cell.status = CELL_STATUS.OPEN;
          endIndex = null;
          setEnd = true;

          break;

     default:

        break;
     }

  });

  // when clear cell button is pressed
  $($BTN_CLR).on('click', function() {

    // clear out the walls and change the color of the cell to white
    var currentIndex;
    while(wall_cells.length > 0){
      currentIndex = wall_cells.pop();
      colorCell(currentIndex, 'white');
      cell_collection[currentIndex].status = CELL_STATUS.OPEN;
    }

    // if there is any path already computed, clear out the path as well
    if(path.length > 0){
      colorPath(path, 'white', cell_collection);
      path = [];
    }
    // hide no path found text
    $PATH_TEXT.css('visibility','hidden');

    // if the start location has been selected, clear it
    if(startIndex == 0 || startIndex) {
      colorCell(startIndex, 'white');
      cell_collection[startIndex].status = CELL_STATUS.OPEN;
      startIndex = null;
      setBegin = false;
    }

    // if the end location has been selected, clear it
    if(endIndex == 0 || endIndex) {
      colorCell(endIndex, 'white');
      cell_collection[endIndex].status = CELL_STATUS.OPEN;
      endIndex = null;
      setEnd = false;
    }

  });

  // when select start cell is pressed
  $($BTN_START).on('click', function() {
    setBegin = true;
  });

  // when select end cell is pressed
  $($BTN_END).on('click', function() {
    setEnd = true;
  });

  // when the find path button is pressed
  $($BTN_PATH).on('click', function() {

    // hide the no path found text
    $PATH_TEXT.css('visibility','hidden')

    // Only compute path if startIndex and endIndex are defined
    if ((startIndex == 0 || startIndex) && (endIndex == 0 || endIndex)) {

      // clear existing path before creating new path
      if (path.length > 0){
        colorPath(path, 'white', cell_collection);
        path = [];
      }

      //find the shortest path and then color it
      path = findPath(startIndex, endIndex, cell_collection);
      if (path.length == 0) {
        // show the no path found text
        $PATH_TEXT.css('visibility','visible')
      }
      path.pop();
      colorPath(path, 'blue', cell_collection);
    }
  });

});


/**
 * Helper function to compute the shortest distance between startIndex and endIndex
 * using A* algorithm
 *
 * @param startIndex: starting location
 * @param endIndex: ending location
 * @param cell_collection: collection containing all the cells
 *
 * @return return the path between starting index and ending index if it exists
 *
*/

function findPath(startIndex, endIndex, cell_collection) {
  //clear previous data for the cells
  clearPreviousData(cell_collection);

  var openList  = [],  // the collecton of currently discovered cells
      closeList = [];  // the collecton of cells that are already evaluated

  // push starting index to the openList
  openList.push(startIndex);

  while(openList.length > 0){

      // Find the cell with the lowest total distance
      var lowInd     = 0,
          lowIndCell = cell_collection[openList[lowInd]],
          currentCell;

      for (var i = 0 ; i < openList.length; i++){
        currentCell = cell_collection[openList[i]];
        if (currentCell.total < lowIndCell.total) {
          lowInd = i;
          lowIndCell = cell_collection[openList[lowInd]];
        }
      }

      // set currentNode to the the cell with the lowest
      var currentNode = cell_collection[openList[lowInd]];

      // If current Node is the end cell, then we have found a path
      if (currentNode.index === endIndex){
        var curr = currentNode;
        var returnPath = [];
        while(curr.parent){
          returnPath.push(curr.index);
          curr = curr.parent;
        }
        return returnPath.reverse();
      }

      // push currentNode into closedList and
      // remove it from the openList
      openList.remove(currentNode.index);
      closeList.push(currentNode.index);

      var neighbours = getNeighbours(cell_collection, currentNode);
      for (var i = 0; i < neighbours.length; i++) {
        var neighbour = neighbours[i];

        // Ignore the neighbour which is already evaluated or is a wall
        if (closeList.contains(neighbour.index) || neighbour.status === CELL_STATUS.WALL) {
          continue;
        }

        // The shortest distance from start to current node
        var curDist = currentNode.fromStartDistance + 1;
        var curDistIsBest = false;

        // if a neighbour is not in open list
        // save the distance from the start, distance to the end, and total
        // Also, save the current parent and add neighbour to the openList
        if (!(openList.contains(neighbour.index))) {

            curDistIsBest = true;
            neighbour.toEndDistance = findDistance(neighbour.index, endIndex);
            openList.push(neighbour.index);

        } else if (curDist < neighbour.fromStartDistance) {
            // the neighbour has alrady been considered but this path is better
            curDistIsBest = true;
        }

        if (curDistIsBest) {
          neighbour.parent = currentNode;
          neighbour.fromStartDistance = curDist;
          neighbour.total = neighbour.fromStartDistance + neighbour.toEndDistance;
        }
      }
  }

  // if no path is found return an empty list
  return []
}


/**
 * Helper function to color the path found using A* algorithm
 * @param path: list of indices representing the path
 * @param color: the color to color for the path
 * @param cell_collection: collection containing all cells
*/

function colorPath(path, color, cell_collection) {
  for (var i = 0; i < path.length; i ++){
    if (cell_collection[path[i]].status === CELL_STATUS.OPEN) {
      colorCell(path[i], color);
    }
  }
}

/**
 * Helper function to color individual cell
 * @param index: the cell index whose color is to be altered
 * @param color: new color for the cell
*/

function colorCell(index, color) {
  $($('.box')[index]).css('background-color',color);
}


/**
 * Find distance function to compute Manhattan distance between two cells
 * @param start: startLocation
 * @param end: endLocation
 * @return Manhattan distance between start and end
*/

function findDistance(start, end) {

  var startRow = Math.floor(start / COLUMN_SIZE);
  var startColumn = start % COLUMN_SIZE;

  var endRow = Math.floor(end / COLUMN_SIZE);
  var endColumn = end % COLUMN_SIZE;

  var d1 = Math.abs(startRow-endRow);
  var d2 = Math.abs(startColumn-endColumn);

  return d1+d2;
}

/**
 * Get Neighbours of the currentCell
 * @param cell_collection: collection of all cells
 * @param currentNode: current cell
 * @return list of neighbours for the current cell
*/

function getNeighbours(cell_collection, currentNode) {

  var neighbours = []
  var index = currentNode.index;
  var currentRow = Math.floor(currentNode.index / COLUMN_SIZE);

  // get right neighbour
  if (cell_collection[index + 1] && (index + 1) < (currentRow+1) * COLUMN_SIZE) {
    neighbours.push(cell_collection[index + 1]);
  }

  // get left neighbour
  if (cell_collection[index - 1] && (index - 1) >= (currentRow) * COLUMN_SIZE) {
    neighbours.push(cell_collection[index - 1]);
  }

  // get up neighbour
  if (cell_collection[index - COLUMN_SIZE]) {
    neighbours.push(cell_collection[index - COLUMN_SIZE]);
  }

  // get below neighbour
  if (cell_collection[index + COLUMN_SIZE]) {
    neighbours.push(cell_collection[index + COLUMN_SIZE]);
  }

  return neighbours;
}

/**
 *  Helper function to reset the cell_collection
*/

function clearPreviousData(cell_collection) {
  for (var i = 0; i < cell_collection.length; i++) {
    cell_collection[i].total = 0;
    cell_collection[i].fromStartDistance = 0;
    cell_collection[i].toEndDistance = 0;
    cell_collection[i].parent = null;
  }
}

/**
 * Check whether a given array contains the given element
*/
Array.prototype.contains = function(element) {

  for (var i = 0; i < this.length; i++) {
    if (this[i] === element) {
      return true;
    }
  }
  return false;
}


/**
 * Remove the specified element from the array
*/
Array.prototype.remove = function(element) {

  for (var i = this.length; i--;) {
     if (this[i] === element) {
       this.splice(i, 1);
     }
  }
}
