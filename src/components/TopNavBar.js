import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import logo from '../logo.svg';



export default function TopNavigation() {
    return (
      <Navbar id="MainNav" expand="md" variant='dark' fluid>
        <Container fluid="lg">
          <Navbar.Brand href="#home">
          <img
              alt=""
              src={logo}
              height="25"
              className="d-inline-block align-top"
            />{'         '}

          </Navbar.Brand>
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