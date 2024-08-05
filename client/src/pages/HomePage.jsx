import { useState, useEffect } from "react";
import { useNavigate} from 'react-router-dom';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";

import "../styles/pages/homePage.scss";

const HomePage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState();
  const toggleLogin = () => setIsLogin(!isLogin);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);

    if(!userInfo) {
     navigate('/');
    }
 },[]);

  return (
    <Container fluid="sm">
      <Row className="home-center">
        <Col sm={3}>
          <h1 className="home-brand">Chat Live</h1>
        </Col>
        <Col sm={9} className="home-form">
          {isLogin ? (
            <Login toggleLogin={toggleLogin} />
          ) : (
            <Register toggleLogin={toggleLogin} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
