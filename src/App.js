import logo from './logo.svg';
import './App.css';
import Draggable from 'react-draggable';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/esm/Collapse';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import * as d3 from 'd3';

import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';

import 'bootstrap/dist/css/bootstrap.min.css';

function TopNavigation() {
  return (
    <Navbar id="MainNav" expand="md" sticky="top">
      <Container fluid>
        <Navbar.Brand href="#home">Marina Manager</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav variant="pills" className="me-auto">
            <Nav.Link href="#home">Home</Nav.Link>
            <Nav.Link href="#link">Link</Nav.Link>
            <NavDropdown title="Dropdown" id="basic-nav-dropdown">
              <NavDropdown.Item>Item 1</NavDropdown.Item>
              <NavDropdown.Item>Item 2</NavDropdown.Item>
              <NavDropdown.Item>Item 3</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item>Item 4</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}


// Data structures reference:
//
// marinaBoundary = {
//   width: <NUMBER>,
//   height: <NUMBER>
// }
//
// marinaItems = {
//  Structure: [<ARRAY_OF_STRUCTURE_OBJECTS>],
//  Utilitiy: [<ARRAY_OF_UTILITY_OBJECTS>],
//  Boat: [<ARRAY_OF_BOAT_OBJECTS>],
//  Slip: [<ARRAY_OF_SLIP_OBJECTS>],
//  Bottom: [<ARRAY_OF_BOTTOM_OBJECTS>]
// }
//
// marinaItem = {
//     id: <UUID>,
//     label: <STRING>,
//     type: <STRING>, #This is one of the marinaItemTypes
//     subtype: <STRING>, #This is any subtype of the type of object (e.g., Utilites might be Power or Water)
//     defaultPosition: { x: <NUMBER>, y: <NUMBER> }, #This is the center position of the boat when it is rendered
//     newPosition: { x: <NUMBER>, y: <NUMBER>  }, #This is the center position of the boat when it is dragged
//     length: <NUMBER>,
//     angle: <NUMBER>,
//     width: <NUMBER>,
//     depth: <NUMBER>, #Negative number indicates a bottom up structure (e.g., a the ocean floor)
//                      #Positive number indicates a top down structure (e.g., a boat in the water)
//                      #Zero indicates a complete obstuction (e.g., a pier, land)
//   },
//
// slipOccupancy: [
//   slipID: <SLIP_ID>,
//   total: {
//     occupantCount: <Number>,
//     linearOccupancy: <NUMBER>,
//     squareOccupancy: <NUMBER>
//   },
//   occupants: {
//     <BOAT_ID>: {
//       linearOccupancy: <NUMBER>,
//       squareOccupancy: <NUMBER>
//    }
// ]
// 
//
// rateCard = {
//   <SLIP SUBTYPE STRING>: [
//     { 
//       linearRangeMin: <NUMBER>,
//       linearRangeMax: <NUMBER>,
//       linearRate: <NUMBER>,
//     },
//     ]


// BLOCK //
// Declare constant reference variables

const arrayOfMarinaItemTypes = ["Bottom", "Slip", "Structure", "Utility"]
const defaultViewBoxAttrs = [-150, -150, 1000, 1000]
const defaultMarinaItem = {
  id: uuidv4(),
  label: "",
  type: "Structure",
  subtype: "",
  defaultPosition: { x: 0, y: 0 }, //Default new items to the top left corner of the marina
  newPosition: { x: 0, y: 0 },
  length: 50,
  angle: 0,
  width: 20,
  depth: 0,
  type_data: {}
}









function App() {

  // BLOCK //
  // Declare state variables


  const [viewBoxAttrs, setViewBoxAttrs] = useState(defaultViewBoxAttrs)
  const [itemsInputDisabled, setItemsInputDisabled] = useState({"Structure": true, "Utility": true, "Boat": true, "Bottom": true, "Slip": true})
  const [newMarinaItem, setNewMarinaItem] = useState(defaultMarinaItem)
  const [openEditMenu, setOpenEditMenu] = useState(true);
  const [openInfoMenu, setOpenInfoMenu] = useState(false);

  const [marinaBoundary, setMarinaBoundary] = useState(JSON.parse(localStorage.getItem("marinaBoundary")) || { width: 500, height: 500})

  const [marinaBottoms, setMarinaBottoms] = useState(JSON.parse(localStorage.getItem("marinaBottoms")) || [])
  const [marinaStructures, setMarinaStructures] = useState(JSON.parse(localStorage.getItem("marinaStructures")) || [])
  const [marinaUtilities, setMarinaUtilities] = useState(JSON.parse(localStorage.getItem("marinaUtilities")) || [])
  const [marinaSlips, setMarinaSlips] = useState(JSON.parse(localStorage.getItem("marinaSlips")) || [])
  const [boats, setBoats] = useState(JSON.parse(localStorage.getItem("boats")) || [])

  const [rateCard, setRateCard] = useState(JSON.parse(localStorage.getItem("rateCard")) || {})

  // BLOCK //
  // State  utility functions (i.e., functions that are directly related to the state of the app)

  const getOccupancy = () => {

    var newSlipOccupancy = []
    var newBoatOccupance = []
    marinaSlips.map((slip, index) => {
      newSlipOccupancy.push({
        "slipID": slip.id,
        "total": {
          "occupantCount": 0,
          "linearOccupancy": 0,
          "squareOccupancy": 0
        },
        "occupants": {}
      })
      var slipPoints = getPolygonPoints(slip)
      boats.map((boat, index2) => {
        var boatCenterPosition = [boat.defaultPosition.x + boat.newPosition.x, boat.defaultPosition.y + boat.newPosition.y]
        if (d3.polygonContains(slipPoints, boatCenterPosition)) {
          newSlipOccupancy[index].total.occupantCount = Number(newSlipOccupancy[index].total.occupantCount) + 1
          newSlipOccupancy[index].total.linearOccupancy = Number(newSlipOccupancy[index].total.linearOccupancy) + Number(boat.length)
          newSlipOccupancy[index].total.squareOccupancy = Number(newSlipOccupancy[index].total.squareOccupancy) + Number(boat.length) * Number(boat.width)
          newSlipOccupancy[index].occupants[boat.id] = {
            "linearOccupancy": Number(boat.length),
            "squareOccupancy": Number(boat.length) * Number(boat.width)
          }
          newBoatOccupance.push({
            "boatID": boat.id,
            "slip": {
              "slipID": slip.id,
            }
          })
        }
      })
    })
    return [newSlipOccupancy, newBoatOccupance]


  }

  const zoomIn = () => {
    let newViewBoxAttrs = [...viewBoxAttrs]
    newViewBoxAttrs[2] = newViewBoxAttrs[2] - 100
    newViewBoxAttrs[3] = newViewBoxAttrs[3] - 100
    setViewBoxAttrs(newViewBoxAttrs)
  } 

  const zoomOut = () => {
    let newViewBoxAttrs = [...viewBoxAttrs]
    newViewBoxAttrs[2] = Number(newViewBoxAttrs[2]) + 100
    newViewBoxAttrs[3] = Number(newViewBoxAttrs[3]) + 100
    setViewBoxAttrs(newViewBoxAttrs)
  }

  const panLeft = () => {
    let newViewBoxAttrs = [...viewBoxAttrs]
    newViewBoxAttrs[0] = newViewBoxAttrs[0] - 50
    setViewBoxAttrs(newViewBoxAttrs)
  } 

  const panRight = () => {
    let newViewBoxAttrs = [...viewBoxAttrs]
    newViewBoxAttrs[0] = newViewBoxAttrs[0] + 50
    setViewBoxAttrs(newViewBoxAttrs)
  } 

  const panUp = () => {
    let newViewBoxAttrs = [...viewBoxAttrs]
    newViewBoxAttrs[1] = newViewBoxAttrs[1] - 50
    setViewBoxAttrs(newViewBoxAttrs)
  }

  const panDown = () => {
    let newViewBoxAttrs = [...viewBoxAttrs]
    newViewBoxAttrs[1] = newViewBoxAttrs[1] + 50
    setViewBoxAttrs(newViewBoxAttrs)
  }

  const updateNewPosition = (data, index, item) => {
    // data is an object with x and y defined
    // index is the number/position/order of the item in the array
    // used to update the array storage of the item's position
    let newArr = [...getMarinaStateObject(item.type)];
    newArr[index].newPosition = { x: data.x, y: data.y };
    getMarinaStateSetter(item.type)(newArr);
  }

  const updateAngle = (index, item, {step=5, ccw=true, fromZero=false}) => {
    let newArr = [...getMarinaStateObject(item.type)];
    // If from zero then the step will be the exact angle, otherwise step will be added to previous angle
    var newAngle = 0
    if (fromZero) {
      newAngle = 0
    } else {
      newAngle = newArr[index].angle
    }
    // If ccw then subtract the step to rotate counter-clockwise, otherwise add the step to rotate clockwise
    if (ccw) {
      newAngle = newAngle - step
    } else {
      newAngle = newAngle + step
    }
    newArr[index].angle = newAngle
    getMarinaStateSetter(item.type)(newArr);
  }

  // There has to be a better way to do this...
  // This is my way of fixing the Draggable "bug" that exponetially moves items
  // Come back to and set each translate object to 0 after the new position is saved
  // For now, comment out and don't use the save position function
  // const saveAllNewPositions = () => {
  //   let newArr = [...marinaItems];
  //   {newArr.map((item, index) => {
  //     let tranlatedX = item.defaultPosition.x + item.newPosition.x;
  //     let tranlatedY = item.defaultPosition.y + item.newPosition.y;
  //     newArr[index].defaultPosition = { x: tranlatedX, y: tranlatedY };
  //     newArr[index].newPosition = { x: 0, y: 0 };
  //   }
  //   )}
  //   // TODO: Don't use setMarina function. Instead directly update the storage JSON and then reload page. De prioritze though as it is low impact / value add
  //   setMarinaItems(newArr);
  //   window.location.reload();
  // }

  // BLOCK //
  // Event functions (i.e., functions that are directly related to events and may or may not depend on the state of the app)

  const createNewMarinaItem = (e) => {
    if (newMarinaItem.label.trim() !== "") {
      var itemStateObject = getMarinaStateObject(newMarinaItem.type)
      var itemStateSetter = getMarinaStateSetter(newMarinaItem.type)
      itemStateSetter((itemStateObject) => [...itemStateObject, newMarinaItem]);
      setNewMarinaItem({...defaultMarinaItem, "id": uuidv4()});
    } else {
      alert("New Marina Item must have a label");
    }
  }

  const updateMarinaItem = (event, item, index) => {
    let newArr = [...getMarinaStateObject(item.type)];
    let newItem = {...item};
    newItem[event.target.name] = event.target.value;
    newArr[index] = newItem;
    getMarinaStateSetter(item.type)(newArr);
  }

  const deleteMarinaItem = (e, item, index) => {
    let newArr = [...getMarinaStateObject(item.type)];
    newArr.splice(index, 1);
    getMarinaStateSetter(item.type)(newArr);
  }


  // BLOCK //
  // Declare state-dependant variables (likely leveraging state utility function, and useMemo hook)

  const [slipOccupancy, boatOccupance] = useMemo(() => getOccupancy(), [boats, marinaSlips]) // Destinction between Ocupancy and Occupance used to differenciate the former as the thing that gets occupied and the latter the thing doing the occupying



  // BLOCK //
  // Functions for synching data (for now to local storage)

  useEffect(() => {localStorage.setItem("marinaBoundary", JSON.stringify(marinaBoundary));}, [marinaBoundary]);
  useEffect(() => {localStorage.setItem("marinaStructures", JSON.stringify(marinaStructures));}, [marinaStructures]);
  useEffect(() => {localStorage.setItem("marinaUtilities", JSON.stringify(marinaUtilities));}, [marinaUtilities]);
  useEffect(() => {localStorage.setItem("marinaSlips", JSON.stringify(marinaSlips));}, [marinaSlips]);
  useEffect(() => {localStorage.setItem("boats", JSON.stringify(boats));}, [boats]);

    
  // BLOCK //
  // Utility functions (i.e., functions that are not directly related to the state of the app)

  const getPolygonPoints = (item) => {
    // item is a marinaItem object
    // returns an array of points that define the polygon
    var x = item.defaultPosition.x + item.newPosition.x
    var y = item.defaultPosition.y + item.newPosition.y
    var angle = item.angle
    var length = item.length
    var width = item.width

    // TODO: add logic to calculate boats at an angle

    var topleft = [x - width/2, y - length/2]
    var topright = [x + width/2, y - length/2]
    var bottomright = [x + width/2, y + length/2]
    var bottomleft = [x - width/2, y + length/2]
    return [topleft, topright, bottomright, bottomleft]
  }

  const getMarinaStateObject = (itemType) => {
    if (itemType === "Slip") { return marinaSlips }
    if (itemType === "Boat") { return boats }
    if (itemType === "Structure") { return marinaStructures }
    if (itemType === "Utility") { return marinaUtilities }
    if (itemType === "Bottom") { return marinaBottoms }
    console.log("Error: getMarinaStateObject did not find a match for itemType: " + itemType)
  }

  const getMarinaStateSetter = (itemType) => {
    if (itemType === "Slip") { return setMarinaSlips }
    if (itemType === "Boat") { return setBoats }
    if (itemType === "Structure") { return setMarinaStructures }
    if (itemType === "Utility") { return setMarinaUtilities }
    if (itemType === "Bottom") { return setMarinaBottoms }
    console.log("Error: getMarinaStateSetter did not find a match for itemType: " + itemType)
  }




  



  // Block //
  // Render functions (i.e., functions that render the app)

  const createMarinaItemEditForm = (item, index) => {

    return (
      <>
        <label>
          Item label:
          <input 
            type="text"
            value={item.label}
            name="label"
            onChange={(e) => {updateMarinaItem(e, item, index)}}
            disabled={itemsInputDisabled[item.type]}
          />
        </label>
        <label>
          Item length:
          <input 
            type="number"
            max={1000}
            min={1}
            value={item.length}
            name="length"
            onChange={(e) => {updateMarinaItem(e, item, index)}}
            disabled={itemsInputDisabled[item.type]}
          />
        </label>
        <label>
          Item width:
          <input 
            type="number"
            max={1000}
            min={1}
            value={item.width}
            name="width"
            onChange={(e) => {updateMarinaItem(e, item, index)}}
            disabled={itemsInputDisabled[item.type]}
          />
        </label>
        <label>
          Item depth:
          <input 
            type="number"
            max={1000}
            min={1}
            value={item.depth}
            name="width"
            onChange={(e) => {updateMarinaItem(e, item, index)}}
            disabled={itemsInputDisabled[item.type]}
          />
        </label>

      <button onClick={(e) => {deleteMarinaItem(e, index)}}>Delete</button>
      </>
    )
  }


 
  return (
    
    <div 
      className="App"
      >
        <TopNavigation /> 


        <Container fluid className='App-content' style={{padding: 0, position: 'absolute'}}>
            <div className='Marina-worksheet-area' >
              <div className='Marina-worksheet' >

                <svg viewBox={viewBoxAttrs.join(" ")} xmlns="http://www.w3.org/2000/svg">

                  <rect 
                    className='Marina-boundary' 
                    width={marinaBoundary.width} 
                    height={marinaBoundary.height}>

                    </rect>
                  
                  {arrayOfMarinaItemTypes.map((itemType, itemTypeIndex) => {
                    return ( <>
                  {getMarinaStateObject(itemType).map((item, index) => {
                    return (
                      <Draggable 
                        disabled={itemsInputDisabled[item.type]}
                        key={item.id}
                        grid={[5, 5]}
                        bounds={{
                          // TODO generalize to fit any Marina boundaries
                          left: 0-item.defaultPosition.x, 
                          top: 0-item.defaultPosition.y, 
                          right: marinaBoundary.width-item.defaultPosition.x, 
                          bottom: marinaBoundary.height-item.defaultPosition.y
                        }}
                        onStop={(e, data) => {
                          updateNewPosition(data, index, item);
                        }}
                        >
                          <g>
                            
                              {/* All MarinaItems will render as rectangles for now */}
                            <rect 
                              className={item.type + " MarinaItem"}
                              width={item.width}
                              height={item.length}
                              x={item.defaultPosition.x-item.width/2}
                              y={item.defaultPosition.y-item.length/2}
                              transform={'rotate('+item.angle+', '+item.defaultPosition.x+', '+item.defaultPosition.y+')'}
                            ></rect>
                            
                            
                            {!itemsInputDisabled[item.type] ? <>
                              <text x={item.defaultPosition.x} y={item.defaultPosition.y}>{item.label}</text>
                              <circle className="MarinaItemCircle" r={item.length/2} cx={item.defaultPosition.x} cy={item.defaultPosition.y}></circle>
                            <a onClick={(e) => {
                              e.preventDefault();
                              updateAngle(index, item, {step: 45, ccw: false, fromZero: false});}}>
                              <circle 
                                className='rotateButton' 
                                cx={item.defaultPosition.x+10}
                                cy={item.defaultPosition.y-item.length/2}
                                r='10'
                                fill='red'
                              ></circle>
                            </a>
                            <a onClick={(e) => {
                              e.preventDefault();
                              updateAngle(index, item, {step: 45, ccw: true, fromZero: false});}}>
                              <circle 
                                className='rotateButton' 
                                cx={item.defaultPosition.x-10}
                                cy={item.defaultPosition.y-item.length/2}
                                r='10'
                                fill='green'
                              ></circle>
                            </a>
                            </>
                            : null}
                          </g>
                          


                      </Draggable>
                    );
                  })}
                  </>
                    )
                  }
                  )}
                
                </svg>
                
              </div>
            </div>

            <div className='Marina-toolbar'>
              <ButtonGroup 
                vertical
                className='Marina-toolbar-button-holder'
                size='sm'>
                <Button 
                        onClick={() => {setOpenEditMenu(!openEditMenu)}}
                        aria-controls='edit-marina-overlay'
                        aria-expanded={openEditMenu}
                        >Edit Marina
                </Button>
                <Button 
                        onClick={() => {setOpenInfoMenu(!openInfoMenu)}}
                        aria-controls='marina-info-overlay'
                        aria-expanded={openInfoMenu}
                        >Marina Info
                </Button>
                <Button onClick={panDown}>Pan down</Button>
                <Button onClick={panUp}>Pan up</Button>
                <Button onClick={panLeft}>Pan left</Button>
                <Button onClick={panRight}>Pan right</Button>
              </ButtonGroup>
            </div>


            <Draggable id="Marina-info-draggable" handle="strong" bounds={"parent"}>
            <Collapse in={openInfoMenu}>

              <div className='Overlay-container'>
                <strong ><div className="Overlay-content-tab">Marina Info</div></strong>
                <div  className='Overlay-content'>
                


                  <Accordion alwaysOpen defaultActiveKey={["0", "1"]}>
                    <Accordion.Item eventKey={0}>
                      <Accordion.Header>Marina Details</Accordion.Header>
                      <Accordion.Body>
                        <Table striped bordered hover size='sm'>
                        <tbody>
                          {(() => {
                            console.log("executing table function")
                            // TODO: make these useMemo global variables
                            let totalNumberOfSlips = marinaSlips.length
                            let totalNumberOfBoatsAssigned = boatOccupance.length
                            let totalLinearSpace = marinaSlips.map((item) => Number(item.length)).reduce((a, b) => a + b, 0)
                            let totalSquareSpace = marinaSlips.map((item) => Number(item.length) * Number(item.width)).reduce((a, b) => a + b, 0)
                            let totalLinearOccupancy = slipOccupancy.map((item) => Number(item.total.linearOccupancy)).reduce((a, b) => a + b, 0)
                            let totalSquareOccupancy = slipOccupancy.map((item) => Number(item.total.squareOccupancy)).reduce((a, b) => a + b, 0)
                            let linearOccupancyPercentage = totalLinearOccupancy / totalLinearSpace * 100
                            let squareOccupancyPercentage = totalSquareOccupancy / totalSquareSpace * 100


                            return (
                              <>
                                
                                  <tr><td>Total number of slips</td><td>{totalNumberOfSlips}</td></tr>
                                  <tr><td>Total number of boats assigned to slips</td><td>{totalNumberOfBoatsAssigned}</td></tr>
                                  <tr><td>Total linear space</td><td>{totalLinearSpace}</td></tr>
                                  <tr><td>Total square space</td><td>{totalSquareSpace}</td></tr>
                                  <tr><td>Total linear occupancy</td><td>{totalLinearOccupancy}</td></tr>
                                  <tr><td>Total square occupancy</td><td>{totalSquareOccupancy}</td></tr>
                                  <tr><td>Linear occupancy percentage</td><td>{Math.round(linearOccupancyPercentage)}%</td></tr>
                                  <tr><td>Square occupancy percentage</td><td>{Math.round(squareOccupancyPercentage)}%</td></tr>

                                
                              </>
                            )
                          })()}
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={1}>
                      <Accordion.Header>Slip Details</Accordion.Header>
                      <Accordion.Body>
                        <Table striped bordered hover size='sm'>
                          <thead>
                            <tr>
                              <th>Slip</th>
                              <th>Linear space</th>
                              <th>Square space</th>
                              <th>Occupant</th>
                              <th>Linear occupancy</th>
                              <th>Square occupancy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slipOccupancy.map((occItem) => {
                              let slipItem = marinaSlips.filter((slipItem) => slipItem.id === occItem.slipID)[0]
                              return (
                                <tr key={slipItem.id}>
                                  <td>{slipItem.id}</td>
                                  <td>{slipItem.length}</td>
                                  <td>{slipItem.length * slipItem.width}</td>
                                  <td>{occItem.occupant}</td>
                                  <td>{occItem.linearOccupancy}</td>
                                  <td>{occItem.squareOccupancy}</td>
                                </tr>
                              )
                            })}

                          </tbody>

                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>



                  </Accordion>




                </div>
              </div>
            </Collapse>
            </Draggable>


            <Draggable id="Edit-marina-draggable" handle="strong" bounds={"parent"}>
            <Collapse in={openEditMenu}>

              <div className='Overlay-container'>
                <strong ><div className="Overlay-content-tab">Edit Marina</div></strong>
                <div  className='Overlay-content'>
                


                  <Accordion alwaysOpen defaultActiveKey="0">
                    <Accordion.Item eventKey={0}>
                      <Accordion.Header>Create New Maria Item</Accordion.Header>
                      <Accordion.Body>
                      <label>
                        Item label: 
                        <input 
                          type="text"
                          value={newMarinaItem.label}
                          onChange={(e) => setNewMarinaItem({...newMarinaItem, label: e.target.value})}
                          name="label" 
                        />
                      </label>
                      <label>
                        Item type:
                        <select 
                          value={newMarinaItem.type}
                          onChange={(e) => setNewMarinaItem({...newMarinaItem, type: e.target.value})}
                          name="type">
                          <option value="Structure">Structure</option>
                          <option value="Bottom">Bottom</option>
                          <option value="Slip">Slip</option>
                          <option value="Boat">Boat</option>
                          <option value="Utility">Utility</option>
                        </select>
                      </label>
                      <label>
                        Item length: 
                        <input 
                          type="number"
                          max={1000}
                          min={1}
                          value={newMarinaItem.length}
                          onChange={(e) => setNewMarinaItem({...newMarinaItem, length: e.target.value})}
                          name="length" 
                        />
                      </label>
                      {/* TODO: Anticipate a bug if the width is larger than the length. add some validation to prevent that */}
                      <label>
                        Item width: 
                        <input 
                          type="number"
                          max={1000}
                          min={1}
                          value={newMarinaItem.width}
                          onChange={(e) => setNewMarinaItem({...newMarinaItem, width: e.target.value})}
                          name="width" 
                        />
                      </label>
                      <label>
                        Item depth: 
                        <input 
                          type="number"
                          max={1000}
                          min={-1000}
                          value={newMarinaItem.depth}
                          onChange={(e) => setNewMarinaItem({...newMarinaItem, depth: e.target.value})}
                          name="depth" 
                        />
                      </label>
                      <button type="submit" onClick={(e) => createNewMarinaItem(e)}>Create {newMarinaItem.type}</button>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={1}>
                      <Accordion.Header>Change Marina Borders</Accordion.Header>
                      <Accordion.Body>
                        <Container fluid>
                          <Row>
                            <Col>
                          <label>Marina width </label>
                          <input type='number' value={marinaBoundary.width} onChange={(e) => setMarinaBoundary({...marinaBoundary, width: e.target.value})} />
                            </Col>
                            <Col>
                          <label>Marina height </label>
                          <input type='number' value={marinaBoundary.height} onChange={(e) => setMarinaBoundary({...marinaBoundary, height: e.target.value})} />
                            </Col>
                          </Row>
                        </Container>
                      </Accordion.Body>
                    </Accordion.Item>

                    {arrayOfMarinaItemTypes.map((itemType, index) => {
                      return (
                        <Accordion.Item eventKey={index+2}>
                          <Accordion.Header>Edit {itemType} Items</Accordion.Header>
                          <Accordion.Body>
                            <ButtonGroup size='sm'>
                              <Button onClick={() => {setItemsInputDisabled({...itemsInputDisabled, [itemType]: !itemsInputDisabled[itemType]})}}>Edit on/off</Button>
                            </ButtonGroup>
                            
                            {getMarinaStateObject(itemType).map((item, index2) => {
                                  <div key={item.id}>{createMarinaItemEditForm(item, index2)}<br></br></div>
                            })}
                          </Accordion.Body>
                        </Accordion.Item>
                      )
                    }
                    )}


                  </Accordion>




                </div>
              </div>
            </Collapse>
            </Draggable>




        </Container>


    </div>
  );
}

export default App;
