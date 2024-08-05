import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

const UserBadgeItem = ({user, handler}) => {
  return (
    <Col xs={3} style={{background: "#BEC6A0"}}>
        {user.name}
        <Button variant="link" onClick={handler}>X</Button>
    </Col>
  )
}

export default UserBadgeItem