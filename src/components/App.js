import logo from '../logo.svg';
import '../App.css';

import TopNavBar from './TopNavBar';
import Demo from './Demo';


import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import 'bootstrap/dist/css/bootstrap.min.css';


export default function App() {
  return (
    <Container fluid="lg" id="MainContainer">
    <TopNavBar />
    <Row>
        <Col>
            <h1>EasySlip</h1>
            <p>Find a slip, assign a slip, leave a slip. Easy</p>
        </Col>
        <Col>
        </Col>
    </Row>

            <Demo />

    </Container>

  );
}