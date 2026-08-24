import { useState } from "react";
import { Navigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import { ChatState } from "../context/ChatProvider";

const HomePage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const toggleLogin = () => setIsLogin((prev) => !prev);

  //user comes from context; this page used to keep its own unused copy read
  //straight from localStorage
  const { user } = ChatState();

  if (user?.token) return <Navigate to="/chats" replace />;

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
