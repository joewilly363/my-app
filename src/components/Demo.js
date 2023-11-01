import * as utils from './Utils.js';

import * as d3 from 'd3';
import Draggable from 'react-draggable';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Card from 'react-bootstrap/Card';
import Nav from 'react-bootstrap/Nav';

export default function Demo() {


    // Demo defaults
    const marinaBoundary = { width: 500, height: 500 }
    const viewBoxAttrs = [270, 0, marinaBoundary.width, marinaBoundary.height]
    const arrayOfMarinaItemTypes = [
        //"Bottom", 
        "Slip",
        //"Structure", 
        "Utility"]
    // No marinaStructures needed as planning to use one immutable poly
    // const marinaStructures = [
    //     {

    //     },
    // ]
    const marinaUtilities = [
        // {
        //     id: uuidv4(),
        //     label: "Power station 1",
        //     type: "Utility",
        //     subtype: "Power",
        //     length: 10,
        //     width: 10,
        //     angle: 0,
        //     defaultPosition: { x: 100, y: 100 },
        //     newPosition: { x: 0, y: 0 },
        //     depth: 0,
        // },
        // {
        //     id: uuidv4(),
        //     label: "Water 1",
        //     type: "Utility",
        //     subtype: "Water",
        //     length: 10,
        //     width: 10,
        //     angle: 0,
        //     defaultPosition: { x: 110, y: 100 },
        //     newPosition: { x: 0, y: 0 },
        //     depth: 0,
        // },
    ]
    const defaultMarinaSlips = [

        {
            id: uuidv4(),
            label: "Slip 1",
            type: "Slip",
            subtype: "Standard",
            length: 133,
            width: 68.8,
            angle: 0,
            defaultPosition: { x: 330.4, y: 320.1 },
            newPosition: { x: 0, y: 0 },
            depth: 0,
        },
        {
            id: uuidv4(),
            label: "Slip 2",
            type: "Slip",
            subtype: "Standard",
            length: 93.4,
            width: 41.3,
            angle: 0,
            defaultPosition: { x: 399.2, y: 360.1 },
            newPosition: { x: 0, y: 0 },
            depth: 0,
        },
        {
            id: uuidv4(),
            label: "Slip 3",
            type: "Slip",
            subtype: "Standard",
            length: 93.4,
            width: 41.3,
            angle: 0,
            defaultPosition: { x: 481.8, y: 360.1 },
            newPosition: { x: 0, y: 0 },
            depth: 0,
        },
        {
            id: uuidv4(),
            label: "Slip 4",
            type: "Slip",
            subtype: "Mega",
            length: 346.8,
            width: 68.8,
            angle: 0,
            defaultPosition: { x: 523.1, y: 106.7 },
            newPosition: { x: 0, y: 0 },
            depth: 0,
        },
        {
            id: uuidv4(),
            label: "Slip 5",
            type: "Slip",
            subtype: "Mega",
            length: 346.8,
            width: 123,
            angle: 0,
            defaultPosition: { x: 634.1, y: 106.7 },
            newPosition: { x: 0, y: 0 },
            depth: 0,
        },
    ]

    const defaultBoats = [
        {
            id: uuidv4(),
            label: "C",
            type: "Boat",
            subtype: "Motor",
            length: 150,
            width: 60,
            angle: 0,
            defaultPosition: { x: 380, y: 100 },
            newPosition: { x: 0, y: 0 },
            depth: 5,
        },
        {
            id: uuidv4(),
            label: "B",
            type: "Boat",
            subtype: "Motor",
            length: 120,
            width: 40,
            angle: 0,
            defaultPosition: { x: 330, y: 100 },
            newPosition: { x: 0, y: 0 },
            depth: 5,
        },
        {
            id: uuidv4(),
            label: "D",
            type: "Boat",
            subtype: "Motor",
            length: 200,
            width: 70,
            angle: 0,
            defaultPosition: { x: 450, y: 100 },
            newPosition: { x: 0, y: 0 },
            depth: 5,
        },
        {
            id: uuidv4(),
            label: "A",
            type: "Boat",
            subtype: "Sail",
            length: 50,
            width: 20,
            angle: 0,
            defaultPosition: { x: 300, y: 100 },
            newPosition: { x: 0, y: 0 },
            depth: 5,
        },
    ]
    const defaultRateCards = [
        {
            id: uuidv4(),
            label: "Standard",
            type: "RateCard",
            subtype: "Standard",
            rates: [
                {
                    linearRangeMin: 0,
                    linearRangeMax: 20,
                    linearRate: 10,
                    squareRate: null,
                },
                {
                    linearRangeMin: 21,
                    linearRangeMax: 30,
                    linearRate: 15,
                    squareRate: null,
                },
                {
                    linearRangeMin: 31,
                    linearRangeMax: 9999999999,
                    linearRate: 20,
                    squareRate: null,
                },
            ]
        },
        {
            id: uuidv4(),
            label: "Mega",
            type: "RateCard",
            subtype: "Mega",
            rates: [
                {
                    linearRangeMin: 0,
                    linearRangeMax: 20,
                    linearRate: 20,
                    squareRate: null,
                },
                {
                    linearRangeMin: 21,
                    linearRangeMax: 30,
                    linearRate: 25,
                    squareRate: null,
                },
                {
                    linearRangeMin: 31,
                    linearRangeMax: 9999999999,
                    linearRate: 30,
                    squareRate: null,
                },
            ]
        }
    ]

    const [boats, setBoats] = useState(defaultBoats)
    const [marinaSlips, setMarinaSlips] = useState(defaultMarinaSlips)
    const [rateCards, setRateCards] = useState(defaultRateCards)

    const getMarinaStateObject = (itemType) => {
        if (itemType === "Slip") { return marinaSlips }
        if (itemType === "Boat") { return boats }
        //if (itemType === "Structure") { return marinaStructures }
        if (itemType === "Utility") { return marinaUtilities }
        //if (itemType === "Bottom") { return marinaBottoms }
        if (itemType === "RateCard") { return rateCards }
        console.log("Error: getMarinaStateObject did not find a match for itemType: " + itemType)
    }

    const getMarinaStateSetter = (itemType) => {
        if (itemType === "Slip") { return setMarinaSlips }
        if (itemType === "Boat") { return setBoats }
        // if (itemType === "Structure") { return setMarinaStructures }
        // if (itemType === "Utility") { return setMarinaUtilities }
        // if (itemType === "Bottom") { return setMarinaBottoms }
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

    // Functions

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
            var slipPoints = utils.getPolygonPoints(slip)
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

    const updateNewPosition = (data, index, item) => {
        // data is an object with x and y defined
        // index is the number/position/order of the item in the array
        // used to update the array storage of the item's position
        let newArr = [...getMarinaStateObject(item.type)];
        newArr[index].newPosition = { x: data.x, y: data.y };
        getMarinaStateSetter(item.type)(newArr);
    }

    const [slipOccupancy, boatOccupance] = useMemo(() => getOccupancy(), [boats, marinaSlips, rateCards]) // Destinction between Ocupancy and Occupance used to differenciate the former as the thing that gets occupied and the latter the thing doing the occupying
    const marinaStats = useMemo(() => {
        let marinaStatsObject = {}
        // TODO: Make more efficient by iterating though the slipOccupancy, marinaSlips once
        marinaStatsObject["totalSlips"] = Number(marinaSlips.length)
        marinaStatsObject["totalLinearSpace"] = Math.round(Number(marinaSlips.reduce((a, b) => Number(a) + Number(b.length), 0)))
        marinaStatsObject["totalSquareSpace"] = Number(marinaSlips.reduce((a, b) => Number(a) + Number(b.length) * Number(b.width), 0))
        marinaStatsObject["totalBoats"] = Number(boats.length)
        marinaStatsObject["totalOccupants"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.total.occupantCount), 0))
        marinaStatsObject["totalLinearOccupancy"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.total.linearOccupancy), 0))
        marinaStatsObject["totalSquareOccupancy"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.total.squareOccupancy), 0))
        marinaStatsObject["percentLinearOccupancy"] = Math.round((Number(marinaStatsObject["totalLinearOccupancy"]) / Number(marinaStatsObject["totalLinearSpace"])) * 100)
        marinaStatsObject["percentSquareOccupancy"] = Math.round((Number(marinaStatsObject["totalSquareOccupancy"]) / Number(marinaStatsObject["totalSquareSpace"])) * 100)
        marinaStatsObject["totalMaxLinearYield"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.yield.maxLinearYield), 0))
        marinaStatsObject["totalCurrentLinearYield"] = Number(slipOccupancy.reduce((a, b) => Number(a) + Number(b.yield.currentLinearYield), 0))
        return marinaStatsObject
    }, [slipOccupancy])



    return (
        <Row>
            <Col id="Demo-worksheet-col" sm={12} md={7} style={{ paddingBottom: "5px" , backgroundColor: "#CFE4F2"}}>
                <div className="Demo" style={{ overflow: "scroll", position: "relative" }}>
                    <div id="Marina-metrics-floater">

                        <div>
                            <span style={{ fontWeight: "bold" }}>{marinaStats.totalOccupants} boats assigned</span> across <span style={{ fontWeight: "bold" }}>{marinaStats.totalSlips} total slips </span> with <span style={{ fontWeight: "bold" }}>{marinaStats.percentLinearOccupancy}% of marina occupied</span> {"("}{marinaStats.totalLinearOccupancy}ft of {marinaStats.totalLinearSpace}ft occupied{")"}</div>


                    </div>
                    <div className='Marina-worksheet' style={{ height: marinaBoundary.height, width: marinaBoundary.width }}>
                        <svg viewBox={viewBoxAttrs.join(" ")} xmlns="http://www.w3.org/2000/svg">


                            <polygon
                                style={{ fill: "rgb(216, 187, 159)", stroke: "rgb(0, 0, 0)" }}
                                points="-13.765 453.458 110.12 453.458 110.12 320.088 151.415 320.088 151.415 453.458 289.065 453.458 289.065 320.088 330.36 320.088 330.36 453.458 440.48 453.458 440.48 360.099 481.775 360.099 481.94 452.788 591.895 453.458 591.895 106.696 633.19 106.696 633.19 453.458 853.43 453.458 853.43 506.806 -13.765 506.806"
                            />


                            {arrayOfMarinaItemTypes.map((itemType, itemTypeIndex) => {
                                return (<>
                                    {getMarinaStateObject(itemType).map((item, index) => {
                                        return (
                                            <g>
                                                {/* All MarinaItems will render as rectangles for now */}
                                                <rect
                                                    className={item.type + " MarinaItem"}
                                                    width={item.width}
                                                    height={item.length}
                                                    x={item.defaultPosition.x}
                                                    y={item.defaultPosition.y}
                                                    transform={'rotate(' + item.angle + ', ' + item.defaultPosition.x + ', ' + item.defaultPosition.y + ')'}
                                                ></rect>
                                                <text style={{ stroke: "#1d590b", fontSize: "10px", fontWeight: "normal" }} x={item.defaultPosition.x} y={item.defaultPosition.y}>{item.label} {(item.subtype === "Mega") ? <>- {item.subtype}</> : null}</text>
                                            </g>
                                        );
                                    })}
                                </>
                                )
                            }
                            )}

                            {boats.map((boat, index) => {
                                let fontsize = "10"
                                return (<>
                                    <Draggable
                                        key={boat.id}
                                        grid={[1, 1]}
                                        bounds={{
                                            left: viewBoxAttrs[0] - boat.defaultPosition.x,
                                            top: viewBoxAttrs[1] - boat.defaultPosition.y,
                                            right: marinaBoundary.width + viewBoxAttrs[0] - boat.defaultPosition.x - boat.width,
                                            bottom: marinaBoundary.height + viewBoxAttrs[1] - boat.defaultPosition.y - boat.length
                                        }}
                                        onStop={(e, data) => { updateNewPosition(data, index, boat); }}
                                    >
                                        <g>

                                            {/* All MarinaItems will render as rectangles for now */}
                                            <rect
                                                className={boat.type + " MarinaItem"}
                                                width={boat.width}
                                                height={boat.length}
                                                x={boat.defaultPosition.x}
                                                y={boat.defaultPosition.y}
                                                transform={'rotate(' + boat.angle + ', ' + boat.defaultPosition.x + ', ' + boat.defaultPosition.y + ')'}
                                            ></rect>

                                            <text x={boat.defaultPosition.x + 3} y={boat.defaultPosition.y + 15}>{boat.label}</text>
                                        </g>

                                    </Draggable>
                                </>
                                )
                            }
                            )}


                        </svg>


                    </div>

                </div>
            </Col>
            <Col id="Demo-stats-col" sm={12} md={5}>
                <Card>
                    <Card.Body>
                        <Tabs
                            defaultActiveKey="occupancy"
                            id="uncontrolled-tab-example"
                            className="mb-3"
                            fill
                        >
                            <Tab eventKey="occupancy" title="Occupancy">
                                <Row className="g-4">
                                    {slipOccupancy.map((slip, index) => {
                                        let currentSlip = marinaSlips.find((marinaSlip) => marinaSlip.id === slip.slipID)
                                        return (
                                            <Col sm={3} md={6} lg={6}>
                                                <Card>
                                                    <Card.Body>
                                                        <Card.Title>{currentSlip.label}</Card.Title>
                                                        <Card.Text>
                                                            <div>{slip.total.occupantCount} boats in slip</div>

                                                        </Card.Text>

                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        )
                                    }
                                    )}

                                </Row>

                            </Tab>
                            <Tab eventKey="rateCards" title="Rate Cards">
                                <Row className="g-4">
                                    {rateCards.map((rateCard, index) => {
                                        return (
                                            <Col key={rateCard.id} lg={12} xl={6}>
                                                <Card>
                                                    <Card.Body>
                                                        <Card.Title>{rateCard.label}</Card.Title>
                                                        <Card.Text>
                                                            {rateCard.rates.map((rateCardRate, rateCardRateIndex) => {
                                                                return (
                                                                    <div>
                                                                        {rateCardRate.linearRangeMin} ft - {(rateCardRate.linearRangeMax > 500) ? <>500+</> : <>{rateCardRate.linearRangeMax}</>} ft: ${rateCardRate.linearRate}
                                                                    </div>
                                                                )
                                                            })}
                                                        </Card.Text>
                                                    </Card.Body>

                                                </Card>
                                            </Col>

                                        )
                                    }
                                    )}

                                </Row>
                            </Tab>
                        </Tabs>
                    </Card.Body>
                </Card>


            </Col>
        </Row>

    )
}