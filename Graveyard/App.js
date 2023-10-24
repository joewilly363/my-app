import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';
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
import CardGroup from 'react-bootstrap/CardGroup';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Modal from 'react-bootstrap/Modal';


import 'bootstrap/dist/css/bootstrap.min.css';
import CardHeader from 'react-bootstrap/esm/CardHeader';

function TopNavigation() {
  return (
    <Navbar id="MainNav" expand="md" variant='dark'>
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
//   yield: {
//     maxLinearYield: <NUMBER>, #If every foot was filled with the highest possible rate in that slip
//     currentLinearYield: <NUMBER>,
//     maxSquareYield: <NUMBER>,
//     currentSquareYield: <NUMBER>
//   },
//   occupants: [{
//       boatID: <BOAT_ID>,
//       linearOccupancy: <NUMBER>,
//       squareOccupancy: <NUMBER>,
//       linearRate: <NUMBER>,
//       squareRate: <NUMBER>,
//       linearRevenue: <NUMBER>, #linearOccupancy * linearRate
//       squareRevenue: <NUMBER>, #squareOccupancy * squareRate
//   }]
//    }]
// ]
// 
// boatOccupance = [
//   {
//     boat: {
//       id: <BOAT_ID>,
//     },
//     slip: {
//       id: <SLIP_ID>,
//     }
//
// rateCard = {
//   id: <UUID>,
//   type: "RateCard",
//   subtype: <STRING>,
//   rates: [ 
//     { 
//       linearRangeMin: <NUMBER>,
//       linearRangeMax: <NUMBER>,
//       linearRate: <NUMBER>,
//     },]
//     


// BLOCK //
// Declare constant reference variables

const arrayOfMarinaItemTypes = ["Bottom", "Slip", "Structure", "Utility"]
const defaultViewBoxAttrs = [-150, -150, 4000, 4000]
const defaultMarinaItem = {
  id: uuidv4(),
  label: "",
  type: "Structure",
  subtype: "",
  defaultPosition: { x: 100, y: 100 }, //Default new items to the top left corner of the marina
  newPosition: { x: 0, y: 0 },
  length: 50,
  angle: 0,
  width: 20,
  depth: 0,
  type_data: {}
}
const defaultRateCard = {
  id: uuidv4(),
  type: "RateCard",
  subtype: "Standard",
  rates: [{
    linearRangeMin: null,
    linearRangeMax: null,
    linearRate: 20,
  }]
}
const defaultBoat = {
  ...defaultMarinaItem,
  type: "Boat",
}


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

  var topleft = [x - width / 2, y - length / 2]
  var topright = [x + width / 2, y - length / 2]
  var bottomright = [x + width / 2, y + length / 2]
  var bottomleft = [x - width / 2, y + length / 2]
  return [topleft, topright, bottomright, bottomleft]
}

function deleteStringFromArray(arr, str) {
  return arr.filter(item => item !== str);
}







function App() {

  // BLOCK //
  // Declare state variables


  const [viewBoxAttrs, setViewBoxAttrs] = useState(defaultViewBoxAttrs)
  const [itemsInputDisabled, setItemsInputDisabled] = useState({ "Structure": true, "Utility": true, "Boat": true, "Bottom": true, "Slip": true })
  const [editableItemIDs, setEditableItemIDs] = useState([])
  const [newMarinaItem, setNewMarinaItem] = useState(defaultMarinaItem)
  const [openEditMenu, setOpenEditMenu] = useState(true);
  const [openInfoMenu, setOpenInfoMenu] = useState(false);

  const [marinaBoundary, setMarinaBoundary] = useState(JSON.parse(localStorage.getItem("marinaBoundary")) || { width: 1000, height: 500 })

  const [marinaBottoms, setMarinaBottoms] = useState(JSON.parse(localStorage.getItem("marinaBottoms")) || [])
  const [marinaStructures, setMarinaStructures] = useState(JSON.parse(localStorage.getItem("marinaStructures")) || [])
  const [marinaUtilities, setMarinaUtilities] = useState(JSON.parse(localStorage.getItem("marinaUtilities")) || [])
  const [marinaSlips, setMarinaSlips] = useState(JSON.parse(localStorage.getItem("marinaSlips")) || [])
  const [boats, setBoats] = useState(JSON.parse(localStorage.getItem("boats")) || [])

  const [rateCards, setRateCards] = useState(JSON.parse(localStorage.getItem("rateCards")) || [defaultRateCard])

  const [editObject, setEditObject] = useState({})
  const [showEditObjectModal, setShowEditObjectModal] = useState(false)

  const [showMarinaContextMenu, setShowMarinaContextMenu] = useState(false)
  const [marinaContextMenuItem, setMarinaContextMenuItem] = useState({item: null, index: null})
  const [marinaContextMenuCoords, setMarinaContextMenuCoords] = useState({ x: 0, y: 0 })


  // BLOCK //
  // Declare Refs
  const scrollDivRef = useRef(null);

  // BLOCK //
  // State  utility functions (i.e., functions that are directly related to the state of the app)

  const scrollDivToTop = () => {
    scrollDivRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const getAllItemIDs = () => {
    let allItemIDs = []
    arrayOfMarinaItemTypes.map((itemType, itemTypeIndex) => {
      let itemStateObject = getMarinaStateObject(itemType)
      itemStateObject.map((item, itemIndex) => {
        allItemIDs.push(item.id)
      })
    })
    return allItemIDs
  }

  const getRate = (boat, slip) => {

    let rateCard = rateCards.find((rateCard) => rateCard.subtype === slip.subtype)
    if (!rateCard) { 
      rateCard = rateCards.find((rateCard) => rateCard.subtype === "Standard"); 
      console.log("Using standard rate card as none found for " + slip.subtype) 
    }
    let rate = 0
    rateCard.rates.map((rateCardRate, rateCardRateIndex) => {
      let rangeMin = Number(rateCardRate.linearRangeMin) || 0
      let rangeMax = Number(rateCardRate.linearRangeMax) || 9999999999
      if (boat.length >= rangeMin && boat.length <= rangeMax) {
        rate = rateCardRate.linearRate
        console.log("Found rate for boat " + boat.label + " in slip " + slip.subtype + ": " + rate)
      }
    })
    // TODO: Create validation logic to make sure there is always a default rate for each rate card. Consider setting a Marina default rate card. Replace below console log with rate=default
    if (rate === 0) { console.log("Error: No rate found for boat " + boat.label + " in slip " + slip.subtype) }
    return Number(rate)
  }

  // getOccupancy is used in a useMemo hook
  const getOccupancy = () => {

    var newSlipOccupancy = []
    var newBoatOccupance = []
    marinaSlips.map((slip, index) => {
      let rateCardForSlip = rateCards.find((rateCard) => rateCard.subtype === slip.subtype) || rateCards.find((rateCard) => rateCard.subtype === "Standard")
      let maxLinearRate = rateCardForSlip.rates.reduce((a, b) => Math.max(a, b.linearRate), -Infinity)
      newSlipOccupancy.push({
        "slipID": slip.id,
        "total": {
          "occupantCount": 0,
          "linearOccupancy": 0,
          "squareOccupancy": 0
        },
        "yield": {
          "maxLinearYield": slip.length * maxLinearRate,
          "currentLinearYield": 0,
          "maxSquareYield": 0,
          "currentSquareYield": 0
        },
        occupants: []
      })
      var slipPoints = getPolygonPoints(slip)
      boats.map((boat, index2) => {
        var boatCenterPosition = [boat.defaultPosition.x + boat.newPosition.x, boat.defaultPosition.y + boat.newPosition.y]
        if (d3.polygonContains(slipPoints, boatCenterPosition)) {
          

          // Add occupant object to ocupants array within the clip object
          let newOccupantRate = getRate(boat, slip)
          let newOccupant = {
            "boatID": boat.id,
            "linearOccupancy": Number(boat.length),
            "squareOccupancy": Number(boat.length) * Number(boat.width),
            "linearRate": newOccupantRate,
            "squareRate": null,
            "linearRevenue": Number(boat.length) * newOccupantRate,
            "squareRevenue": null,
          }
          newSlipOccupancy[index].occupants.push(newOccupant)

          // Add boat to slip totals
          newSlipOccupancy[index].total.occupantCount = Number(newSlipOccupancy[index].total.occupantCount) + 1
          newSlipOccupancy[index].total.linearOccupancy = Number(newSlipOccupancy[index].total.linearOccupancy) + newOccupant.linearOccupancy
          newSlipOccupancy[index].total.squareOccupancy = Number(newSlipOccupancy[index].total.squareOccupancy) + newOccupant.squareOccupancy
                    

          // Add occupant revenues to slip yield
          newSlipOccupancy[index].yield.currentLinearYield = Number(newSlipOccupancy[index].yield.currentLinearYield) + Number(newOccupant.linearRevenue)


          newBoatOccupance.push({
            boat: {
              id: boat.id,
            },
            slip: {
              id: slip.id,
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

  const updateAngle = (index, item, { step = 5, ccw = true, fromZero = false }) => {
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
  const saveAllNewPositions = () => {

    let newArrToIter = [...arrayOfMarinaItemTypes, "Boat"];
    newArrToIter.map((itemType, itemTypeIndex) => {
      let itemStateObject = getMarinaStateObject(itemType)
      let newArr = [...itemStateObject];
      newArr.map((item, itemIndex) => {
        let tranlatedX = item.defaultPosition.x + item.newPosition.x;
        let tranlatedY = item.defaultPosition.y + item.newPosition.y;
        newArr[itemIndex].defaultPosition = { x: tranlatedX, y: tranlatedY };
        newArr[itemIndex].newPosition = { x: 0, y: 0 };
      }
      )
      localStorage.setItem(getMarinaItemTypeJsonKey(itemType), JSON.stringify(newArr));
      console.log(itemType + " items saved to local storage but state unchanged")
    })
    window.location.reload();
  }

  // BLOCK //
  // Event functions (i.e., functions that are directly related to events and may or may not depend on the state of the app)

  const createNewMarinaItem = (e) => {
    if (newMarinaItem.label.trim() !== "") {
      var itemStateObject = getMarinaStateObject(newMarinaItem.type)
      var itemStateSetter = getMarinaStateSetter(newMarinaItem.type)
      itemStateSetter((itemStateObject) => [...itemStateObject, newMarinaItem]);
      setNewMarinaItem({ ...defaultMarinaItem, "id": uuidv4() });
    } else {
      alert("New Marina Item must have a label");
    }
  }

  const updateMarinaItem = (event, item, index) => {
    let newArr = [...getMarinaStateObject(item.type)];
    let newItem = { ...item };
    newItem[event.target.name] = event.target.value;
    newArr[index] = newItem;
    getMarinaStateSetter(item.type)(newArr);
  }

  const deleteMarinaItem = (e, item, index) => {
    let newArr = [...getMarinaStateObject(item.type)];
    newArr.splice(index, 1);
    getMarinaStateSetter(item.type)(newArr);
  }

  const handleMarinaObjectContextMenuClick = (e, data, item, index) => {
    e.preventDefault();
    console.log(item)
    setShowMarinaContextMenu(true);
    setMarinaContextMenuCoords({ x: e.clientX, y: e.clientY });
    setMarinaContextMenuItem({item: item, index: index});
  }

  const renderMarinaObjectContextMenu = (item, index) => {

    console.log(item)

    return (
      <ButtonGroup size="sm" vertical style={{position: 'absolute', top: marinaContextMenuCoords.y, left: marinaContextMenuCoords.x}}>
        <Button variant="brand-dark" onClick={() => { setEditObject(item); setShowEditObjectModal(true) }}>Edit</Button>
        {(editableItemIDs.indexOf(item.id) > -1) ?
                    <Button 
                    variant='brand-dark' 
                    onClick={(e) => setEditableItemIDs(editableItemIDs.filter(ID => ID !== item.id))
                    }
                    >Stop Moving</Button>

          :
          <Button 
            variant='brand-dark' 
            onClick={(e) => setEditableItemIDs([...editableItemIDs, item.id])
            }
            >Move</Button>
        }
        
        <Button variant="brand-dark" onClick={(e) => { deleteMarinaItem(e, item, index) }}>Remove</Button>
      </ButtonGroup>
    )
  }



  // BLOCK //
  // Declare state-dependant variables (likely leveraging state utility function, and useMemo hook)


  const [slipOccupancy, boatOccupance] = useMemo(() => getOccupancy(), [boats, marinaSlips, rateCards]) // Destinction between Ocupancy and Occupance used to differenciate the former as the thing that gets occupied and the latter the thing doing the occupying
  const marinaStats = useMemo(() => {
    let marinaStatsObject = {}
    // TODO: Make more efficient by iterating though the slipOccupancy, marinaSlips once
    marinaStatsObject["totalSlips"] = Number(marinaSlips.length)
    marinaStatsObject["totalLinearSpace"] = Number(marinaSlips.reduce((a, b) => Number(a) + Number(b.length), 0))
    marinaStatsObject["totalSquareSpace"] = Number(marinaSlips.reduce((a, b) => Number(a) + Number(b.length) * Number(b.width), 0))
    marinaStatsObject["totalBoats"] = Number(boats.length)
    marinaStatsObject["totalOccupants"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.total.occupantCount), 0))
    marinaStatsObject["totalLinearOccupancy"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.total.linearOccupancy), 0))
    marinaStatsObject["totalSquareOccupancy"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.total.squareOccupancy), 0))
    marinaStatsObject["percentLinearOccupancy"] = Math.round((Number(marinaStatsObject["totalLinearOccupancy"]) / Number(marinaStatsObject["totalLinearSpace"]))*100)
    marinaStatsObject["percentSquareOccupancy"] = Math.round((Number(marinaStatsObject["totalSquareOccupancy"]) / Number(marinaStatsObject["totalSquareSpace"]))*100)
    marinaStatsObject["totalMaxLinearYield"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.yield.maxLinearYield), 0))
    marinaStatsObject["totalCurrentLinearYield"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.yield.currentLinearYield), 0))
    return marinaStatsObject
  }, [slipOccupancy])


  // BLOCK //
  // Functions for synching data (for now to local storage)

  useEffect(() => { localStorage.setItem("marinaBoundary", JSON.stringify(marinaBoundary)); }, [marinaBoundary]);
  useEffect(() => { localStorage.setItem("marinaStructures", JSON.stringify(marinaStructures)); }, [marinaStructures]);
  useEffect(() => { localStorage.setItem("marinaUtilities", JSON.stringify(marinaUtilities)); }, [marinaUtilities]);
  useEffect(() => { localStorage.setItem("marinaSlips", JSON.stringify(marinaSlips)); }, [marinaSlips]);
  useEffect(() => { localStorage.setItem("boats", JSON.stringify(boats)); }, [boats]);
  useEffect(() => { localStorage.setItem("rateCards", JSON.stringify(rateCards)); }, [rateCards]);

  useEffect(() => {
    // reset showMarinaContextMenu to false when the user clicks anywhere on the page
    const handleClick = () => {
      setShowMarinaContextMenu(false)
    }
    // add listener for user click
    document.addEventListener('click', handleClick)
    // clean up
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])




  const getMarinaStateObject = (itemType) => {
    if (itemType === "Slip") { return marinaSlips }
    if (itemType === "Boat") { return boats }
    if (itemType === "Structure") { return marinaStructures }
    if (itemType === "Utility") { return marinaUtilities }
    if (itemType === "Bottom") { return marinaBottoms }
    if (itemType === "RateCard") { return rateCards }
    console.log("Error: getMarinaStateObject did not find a match for itemType: " + itemType)
  }

  const getMarinaStateSetter = (itemType) => {
    if (itemType === "Slip") { return setMarinaSlips }
    if (itemType === "Boat") { return setBoats }
    if (itemType === "Structure") { return setMarinaStructures }
    if (itemType === "Utility") { return setMarinaUtilities }
    if (itemType === "Bottom") { return setMarinaBottoms }
    if (itemType === "RateCard") { return setRateCards }
    console.log("Error: getMarinaStateSetter did not find a match for itemType: " + itemType)
  }

  const getMarinaItemTypeJsonKey = (itemType) => {
    if (itemType === "Slip") { return "marinaSlips" }
    if (itemType === "Boat") { return "boats" }
    if (itemType === "Structure") { return "marinaStructures" }
    if (itemType === "Utility") { return "marinaUtilities" }
    if (itemType === "Bottom") { return "marinaBottoms" }
    if (itemType === "RateCard") { return "rateCards" }
    console.log("Error: getMarinaItemTypeJsonKey did not find a match for itemType: " + itemType)
  }




  // Block //
  // Render functions (i.e., functions that render the app)

  // TODO: Generalize to handle createing any item type. Right now will only handle rate cards. Once done, depreciate the current way od adding new marina items
  const renderObjectEditModal = () => {

    const boatForm = () => {

      return (
        <>
          <Form>
            <Row>
            <Form.Group as={Col}>
              <Form.Label>Boat name</Form.Label>
                <Form.Control
                  size='sm'
                  type='text'
                  placeholder='Enter boat name'
                  value={editObject.label}
                  name='label'
                  onChange={(e) => { setEditObject({ ...editObject, [e.target.name]: e.target.value }) }} />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Boat type</Form.Label>
                <Form.Select 
                  aria-label="Boat type select"
                  size='sm'
                  value={editObject.subtype}
                  name='subtype'
                  onChange={(e) => { setEditObject({ ...editObject, [e.target.name]: e.target.value }) }} >
                  <option value="Sailboat">Sailboat</option>
                  <option value="Powerboat">Powerboat</option>
                </Form.Select>
            </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col}>
                <Form.Label>Length</Form.Label>
                <Form.Control
                  size='sm'
                  type='number'
                  placeholder='Enter length'
                  value={editObject.length}
                  name='length'
                  min={1}
                  onChange={(e) => { setEditObject({ ...editObject, [e.target.name]: e.target.value }) }} />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Width</Form.Label>
                <Form.Control
                  size='sm'
                  type='number'
                  placeholder='Enter width'
                  value={editObject.width}
                  name='width'
                  min={1}
                  onChange={(e) => { setEditObject({ ...editObject, [e.target.name]: e.target.value }) }} />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Depth</Form.Label>
                <Form.Control
                  size='sm'
                  type='number'
                  placeholder='Enter depth'
                  value={editObject.depth}
                  name='depth'
                  min={0}
                  max={100}
                  onChange={(e) => { setEditObject({ ...editObject, [e.target.name]: e.target.value }) }} />
              </Form.Group>
            </Row>
          </Form>
        </>
      )
    }


    const rateCardForm = () => {

      const rateCardFormOnChange = (e, index) => {
        let newRate = { ...editObject.rates[index] };
        newRate[e.target.name] = e.target.value;
        let newRates = [...editObject.rates];
        newRates[index] = newRate;
        setEditObject({ ...editObject, rates: [...newRates] })
      }

      return (
        <>
          <Form>
            <Row>
              <Col>
                <Form.Control
                  size='sm'
                  type='text'
                  placeholder='Enter rate card label'
                  value={editObject.subtype}
                  name='subtype'
                  onChange={(e) => { setEditObject({ ...editObject, [e.target.name]: e.target.value }) }} />
              </Col>
            </Row>
            <Form.Label>Rate Card</Form.Label>
            {editObject.rates.map((rate, index) => {
              return (
                <Row>
                  <Col>
                    <Form.Control
                      size='sm'
                      type='number'
                      min={0}
                      max={rate.linearRangeMax}
                      placeholder='Enter min'
                      value={rate.linearRangeMin}
                      name='linearRangeMin'
                      onChange={(e) => { rateCardFormOnChange(e, index) }}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      size='sm'
                      type='number'
                      min={rate.linearRangeMin}
                      max={2000}
                      placeholder='Enter max'
                      value={rate.linearRangeMax}
                      name='linearRangeMax'
                      onChange={(e) => { rateCardFormOnChange(e, index) }}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      size='sm'
                      type='number'
                      placeholder='Enter $ rate'
                      name='linearRate'
                      onChange={(e) => { rateCardFormOnChange(e, index) }}
                    />
                  </Col>
                </Row>
              )
            })}
            <Row>
              <Col >
                <Button size='sm' variant='outline-dark' onClick={() => {
                  let newRates = [...editObject.rates];
                  newRates.push({
                    linearRangeMin: null,
                    linearRangeMax: null,
                    linearRate: null,
                  })
                  setEditObject({ ...editObject, rates: [...newRates] })
                }}>Add rate to this card</Button>

              </Col>
            </Row>
          </Form>
        </>
      )
    }

    return (
      <Modal
        show={showEditObjectModal}
        onHide={() => { setShowEditObjectModal(false); setEditObject({}) }}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit {editObject.type}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(editObject.type === "RateCard") ? rateCardForm() : null}
          {(editObject.type === "Boat") ? boatForm() : null}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowEditObjectModal(false); setEditObject({}) }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {
            setShowEditObjectModal(false);
            let itemStateObjectCopy = [...getMarinaStateObject(editObject.type)];
            let itemStateSetter = getMarinaStateSetter(editObject.type);
            let index = itemStateObjectCopy.findIndex((item) => item.id === editObject.id);
            if (index > -1) {
              // If the item already exists, replace it
              itemStateObjectCopy[index] = editObject;
              itemStateSetter(itemStateObjectCopy);
            } else {
              // If the item does not exist, add it
              itemStateSetter((itemStateObject) => [...itemStateObject, editObject]);
            }
            setEditObject({});
          }}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }


  const editMarinaItemsTableForm = (itemType) => {
    return (
      <>
        {getMarinaStateObject(itemType).map((item, index) => {

          let isDisabled = (editableItemIDs.indexOf(item.id) > -1) ? false : true

          return (
            <tr key={item.id}>
              <td>{item.type}</td>
              <td>
                {(item.type === "Slip") ?

                  <select
                    value={item.subtype}
                    name="subtype"
                    onChange={(e) => { updateMarinaItem(e, item, index) }}
                    disabled={isDisabled}
                  >
                    {rateCards.map((rateCardItem, rateCardItemIndex) => {
                      return (
                        <option value={rateCardItem.subtype}>{rateCardItem.subtype}</option>
                      )
                    }
                    )}
                  </select>

                  :
                  <input
                    type="text"
                    value={item.subtype}
                    name="subtype"
                    onChange={(e) => { updateMarinaItem(e, item, index) }}
                    disabled={isDisabled}
                  />
                }
              </td>
              <td>
                <input
                  type="text"
                  value={item.label}
                  name="label"
                  onChange={(e) => { updateMarinaItem(e, item, index) }}
                  disabled={isDisabled}
                />
              </td>
              <td>
                <input
                  type="number"
                  max={1000}
                  min={1}
                  value={item.length}
                  name="length"
                  onChange={(e) => { updateMarinaItem(e, item, index) }}
                  disabled={isDisabled}
                />
              </td>
              <td>
                <input
                  type="number"
                  max={1000}
                  min={1}
                  value={item.width}
                  name="width"
                  onChange={(e) => { updateMarinaItem(e, item, index) }}
                  disabled={isDisabled}
                />
              </td>
              <td>
                <input
                  type="number"
                  max={100}
                  min={-100}
                  value={item.depth}
                  name="width"
                  onChange={(e) => { updateMarinaItem(e, item, index) }}
                  disabled={isDisabled}
                />
              </td>
              <td>
                <ButtonGroup aria-label='Edit items button group'>
                  {(editableItemIDs.indexOf(item.id) > -1) ? <>
                    {/* TODO: Actually add functionailty of these buttons. Right now they just disable edit in the same way */}
                    <Button size='sm' variant='outline-secondary' onClick={() => setEditableItemIDs(editableItemIDs.filter(ID => ID !== item.id))}>Stop</Button>
                  </>
                    : <>
                      <Button size='sm' variant='outline-dark' onClick={() => setEditableItemIDs([...editableItemIDs, item.id])}>Edit</Button>
                      <Button size='sm' variant='outline-danger' onClick={(e) => { deleteMarinaItem(e, item, index) }}>Delete</Button>
                    </>}
                </ButtonGroup>
              </td>
            </tr>
          )
        })}
      </>
    )
  }





  return (

    <div
      className="App"
    >

      {renderObjectEditModal()}
      {TopNavigation()}



        <div className='Marina-worksheet-area' >
          <div className='Marina-worksheet' >

          {showMarinaContextMenu ? renderMarinaObjectContextMenu(marinaContextMenuItem.item, marinaContextMenuItem.index) : null}

            <svg viewBox={viewBoxAttrs.join(" ")} xmlns="http://www.w3.org/2000/svg">

              <rect
                className='Marina-boundary'
                width={marinaBoundary.width}
                height={marinaBoundary.height}>

              </rect>

              {arrayOfMarinaItemTypes.map((itemType, itemTypeIndex) => {
                return (<>
                  {getMarinaStateObject(itemType).map((item, index) => {
                    let isDisabled = (editableItemIDs.indexOf(item.id) > -1) ? false : true
                    return (
                      <>

                        <Draggable
                          disabled={isDisabled}
                          key={item.id}
                          grid={[1, 1]}
                          bounds={{
                            // TODO generalize to fit any Marina boundaries
                            left: 0 - item.defaultPosition.x,
                            top: 0 - item.defaultPosition.y,
                            right: marinaBoundary.width - item.defaultPosition.x,
                            bottom: marinaBoundary.height - item.defaultPosition.y
                          }}

                          onStop={(e, data) => {
                            updateNewPosition(data, index, item);
                          }}
                        >
                          <g                      
                            onContextMenu={(e, data) => { handleMarinaObjectContextMenuClick(e, data, item, index)}}
                          >

                            {/* All MarinaItems will render as rectangles for now */}
                            <rect
                              className={item.type + " MarinaItem"}
                              width={item.width}
                              height={item.length}
                              x={item.defaultPosition.x - item.width / 2}
                              y={item.defaultPosition.y - item.length / 2}
                              transform={'rotate(' + item.angle + ', ' + item.defaultPosition.x + ', ' + item.defaultPosition.y + ')'}
                            ></rect>


                            {(editableItemIDs.indexOf(item.id) > -1) ? <>
                              <text x={item.defaultPosition.x} y={item.defaultPosition.y}>{item.label}</text>
                              <a onClick={(e) => {
                                e.preventDefault();
                                updateAngle(index, item, { step: 45, ccw: false, fromZero: false });
                              }}>
                                <circle
                                  className='rotateButton'
                                  cx={item.defaultPosition.x + 10}
                                  cy={item.defaultPosition.y - item.length / 2}
                                  r='10'
                                  fill='red'
                                ></circle>
                              </a>T
                              <a onClick={(e) => {
                                e.preventDefault();
                                updateAngle(index, item, { step: 45, ccw: true, fromZero: false });
                              }}>
                                <circle
                                  className='rotateButton'
                                  cx={item.defaultPosition.x - 10}
                                  cy={item.defaultPosition.y - item.length / 2}
                                  r='10'
                                  fill='green'
                                ></circle>
                              </a>
                            </>
                              : null}
                          </g>



                        </Draggable>
                      </>
                    );
                  })}
                </>
                )
              }
              )}

              {boats.map((boat, index) => {
                let isDisabled = (editableItemIDs.indexOf(boat.id) > -1) ? false : true
                return (<>
                  <Draggable
                    disabled={isDisabled}
                    key={boat.id}
                    grid={[1, 1]}
                    bounds={{
                      left: 0 - boat.defaultPosition.x,
                      top: 0 - boat.defaultPosition.y,
                      right: marinaBoundary.width - boat.defaultPosition.x,
                      bottom: marinaBoundary.height - boat.defaultPosition.y
                    }}
                    onStop={(e, data) => {updateNewPosition(data, index, boat);}}
                  >
                                            <g
                                              onContextMenu={(e, data) => { handleMarinaObjectContextMenuClick(e, data, boat, index)}}
                                            >

                          {/* All MarinaItems will render as rectangles for now */}
                          <rect
                            className={boat.type + " MarinaItem"}
                            width={boat.width}
                            height={boat.length}
                            x={boat.defaultPosition.x - boat.width / 2}
                            y={boat.defaultPosition.y - boat.length / 2}
                            transform={'rotate(' + boat.angle + ', ' + boat.defaultPosition.x + ', ' + boat.defaultPosition.y + ')'}
                          ></rect>


                          {(editableItemIDs.indexOf(boat.id) > -1) ? <>
                            <text x={boat.defaultPosition.x} y={boat.defaultPosition.y}>{boat.label}</text>
                            <a onClick={(e) => {
                              e.preventDefault();
                              updateAngle(index, boat, { step: 45, ccw: false, fromZero: false });
                            }}>
                              <circle
                                className='rotateButton'
                                cx={boat.defaultPosition.x + 10}
                                cy={boat.defaultPosition.y - boat.length / 2}
                                r='10'
                                fill='red'
                              ></circle>
                            </a>T
                            <a onClick={(e) => {
                              e.preventDefault();
                              updateAngle(index, boat, { step: 45, ccw: true, fromZero: false });
                            }}>
                              <circle
                                className='rotateButton'
                                cx={boat.defaultPosition.x - 10}
                                cy={boat.defaultPosition.y - boat.length / 2}
                                r='10'
                                fill='green'
                              ></circle>
                            </a>
                          </>
                            : null}
                        </g>

                  </Draggable>
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
            <Button variant='brand-dark' onClick={() => { saveAllNewPositions() }}>Save marina</Button>
            <Button
              variant='brand-dark'
              onClick={() => { setOpenEditMenu(!openEditMenu) }}
              aria-controls='edit-marina-overlay'
              aria-expanded={openEditMenu}
            >Edit Marina
            </Button>
            <Button
              variant='brand-dark'
              onClick={() => { setOpenInfoMenu(!openInfoMenu) }}
              aria-controls='marina-info-overlay'
              aria-expanded={openInfoMenu}
            >Marina Info
            </Button>
            <Button variant='brand-dark' onClick={panDown} >Pan down</Button>
            <Button variant='brand-dark' onClick={panUp} >Pan up</Button>
            <Button variant='brand-dark' onClick={panLeft} >Pan left</Button>
            <Button variant='brand-dark' onClick={panRight} >Pan right</Button>
          </ButtonGroup>
        </div>



        <Collapse in={openInfoMenu}>

          <div className='Overlay-container-right'>
            <strong ><div className="Overlay-content-right-tab">
              <i className='fa fa-info-circle' onClick={() => { setOpenInfoMenu(!openInfoMenu) }}></i>
            </div></strong>
            <div className='Overlay-content-right'>

              <Tabs
                defaultActiveKey="Marina Stats"
                id="info-marina-tabs"
                className="mb-3"
              >
                <Tab eventKey="Marina Stats" title="Marina Stats">
                  <Table striped bordered size='sm' variant="light">
                    <tbody>
                      {Object.keys(marinaStats).map((key, index) => {
                        return (
                          <>
                            <tr>
                              <td>{key}</td>
                              <td>{marinaStats[key]}</td>
                            </tr>
                          </>
                        )
                      })}
                    </tbody>
                  </Table>
                </Tab>

              </Tabs>



            </div>
          </div>
        </Collapse>




        <Collapse in={openEditMenu}>

          <div className='Overlay-container'>
            <strong ><div className="Overlay-content-tab">
              <i className='fa fa-edit' onClick={() => { setOpenEditMenu(!openEditMenu) }}></i>
            </div></strong>
            <div className='Overlay-content'>


              <Tabs
                defaultActiveKey="Marina Items"
                id="edit-marina-tabs"
                className="mb-3"
              >
                <Tab eventKey="Marina Items" title="Marina Items">
                  <ButtonGroup 
                  size='sm'
                  aria-label='Create items button group'
                  >
                    {arrayOfMarinaItemTypes.map((itemType, itemTypeIndex) => {
                      let itemStateObject = getMarinaStateObject(itemType)
                      let itemStateSetter = getMarinaStateSetter(itemType)
                      let newMarinaItem = { ...defaultMarinaItem, "type": itemType, "id": uuidv4() }
                      return (
                        <Button
                          variant='brand-dark'
                          onClick={() => {
                            setItemsInputDisabled((itemsInputDisabled) => ({ ...itemsInputDisabled, [itemType]: false }))
                            itemStateSetter((itemStateObject) => [...itemStateObject, newMarinaItem]);
                          }}
                        >Add new {itemType}
                        </Button>
                      )
                    }
                    )}
                  </ButtonGroup>
                  <Table striped bordered size='sm' variant="light">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Subtype</th>
                        <th>Label</th>
                        <th>Length</th>
                        <th>Width</th>
                        <th>Depth</th>
                        <th>
                          <ButtonGroup aria-label='Edit all items button group'>
                            <Button size='sm' variant='outline-dark' onClick={() => setEditableItemIDs(getAllItemIDs())}>Edit All</Button>
                            <Button size='sm' variant='outline-dark' onClick={() => setEditableItemIDs([])}>Cancel All</Button>
                          </ButtonGroup>
                        </th>
                      </tr>
                    </thead>
                    <tbody>

                      {arrayOfMarinaItemTypes.map((itemType, itemTypeIndex) => {
                        return (
                          <>
                            {editMarinaItemsTableForm(itemType)}
                          </>


                        )
                      }
                      )}

                    </tbody>
                  </Table>

                </Tab>
                <Tab eventKey="Rate Card" title="Rate Cards">


                  <Row>
                    {rateCards.map((rateCardItem, rateCardItemIndex) => {
                      return (
                        <Col>
                          <Card>
                            <Card.Header>
                              {rateCardItem.subtype}

                            </Card.Header>
                            <Card.Body>
                              <Table size='sm' variant="light">
                                <tbody>
                                  {rateCardItem.rates.map((rate, rateIndex) => {
                                    return (
                                      <>
                                        <tr>
                                          {(!rate.linearRangeMin && !rate.linearRangeMax) ? <td>Default</td> : <td>{rate.linearRangeMin} to {rate.linearRangeMax}</td>}
                                          <td>${rate.linearRate}</td>
                                        </tr>
                                      </>

                                    )
                                  })}
                                </tbody>
                              </Table>
                            </Card.Body>
                            <Card.Footer>
                              <Button size="sm" variant='link'>Delete</Button>
                              <Button
                                size="sm"
                                variant='link'
                                onClick={(e) => {
                                  setShowEditObjectModal(true);
                                  setEditObject({ ...rateCardItem });
                                  console.log(rateCardItem)
                                  console.log(editObject)

                                }}>
                                Edit
                              </Button>
                            </Card.Footer>
                          </Card>
                        </Col>
                      )
                    }
                    )}
                    <Col>

                      <Button
                        variant='success'
                        onClick={() => {
                          setShowEditObjectModal(true);
                          setEditObject({ ...defaultRateCard, "id": uuidv4() });
                        }}
                      >Add new rate card
                      </Button>

                    </Col>
                  </Row>

                </Tab>

                <Tab eventKey="Boats" title="Boats">
                  <Row>
                    {boats.map((boatItem, boatItemIndex) => {
                      return (
                        <Col>
                          <Card>
                            <Card.Header> {boatItem.label}</Card.Header>
                            <Card.Body>
                              <Table size='sm' variant="light">
                                <tbody>
                                  <tr>
                                    <td>Length</td>
                                    <td>{boatItem.length}</td>
                                  </tr>
                                  <tr>
                                    <td>Width</td>
                                    <td>{boatItem.width}</td>
                                  </tr>
                                  <tr>
                                    <td>Depth</td>
                                    <td>{boatItem.depth}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </Card.Body>
                            <Card.Footer>
                              <Button size="sm" variant='link'>Delete</Button>
                              <Button
                                size="sm"
                                variant='link'
                                onClick={(e) => {
                                  setShowEditObjectModal(true);
                                  setEditObject({ ...boatItem });
                                }}>
                                Edit
                              </Button>
                              {(editableItemIDs.indexOf(boatItem.id) > -1)?
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditableItemIDs(editableItemIDs.filter(ID => ID !== boatItem.id))}
                                  variant='link'>
                                    Set
                                    </Button>
                                :
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditableItemIDs([...editableItemIDs, boatItem.id])}
                                  variant='link'>
                                    Move
                                    </Button>
                              }
                              
                            </Card.Footer>
                          </Card>
                        </Col>
                      )
                    }
                    )}
                    <Col>
                      <Button
                        variant='success'
                        onClick={() => {
                          setShowEditObjectModal(true);
                          let lastBoatCreated = boats[boats.length-1]
                          let newBoatObject = { ...defaultBoat, "id": uuidv4(), label: "New Boat"}
                          if (lastBoatCreated) {
                            newBoatObject.subtype = lastBoatCreated.subtype
                            newBoatObject.length = lastBoatCreated.length
                            newBoatObject.width = lastBoatCreated.width
                            newBoatObject.depth = lastBoatCreated.depth
                          }
                          setEditObject(newBoatObject);
                        }
                        }
                      >Add new boat
                      </Button>
                    </Col>
                  </Row>
                  </Tab>
              </Tabs>





            </div>
          </div>
        </Collapse>







    </div>
  );
}

export default App;
